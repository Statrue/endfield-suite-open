from datetime import UTC, datetime
from threading import Lock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes import battles as battle_routes
from app.core.errors import AppError
from app.db.models import AuthUserRecord, Base, UploadedBattleRecord
from app.main import app
from app.schemas.public import (
    PublicAccountSearchEntryResponse,
    PublicAccountSearchResponse,
)
from app.services import public_data
from app.services.public_data import DemoPublicDataService


def _battle_record(
    battle_id: str,
    account_id: str,
    nickname: str,
    *,
    status: str = "valid",
    visibility: str = "public",
    clear_flag: bool = True,
    official_timer_end_seen: bool | None = True,
    time_source: str | None = "game_timer",
    battle_end_at: str = "2026-08-01T12:00:00+00:00",
    parser_version: str = "raw-log-parser-v43",
) -> UploadedBattleRecord:
    return UploadedBattleRecord(
        id=battle_id,
        uploader_user_id=account_id,
        uploader_nickname=nickname,
        boss_key="boss-test",
        boss_slug="boss-test",
        boss_name="测试首领",
        dungeon_name="测试副本",
        duration_ms=60_000,
        battle_start_at="2026-08-01T11:59:00+00:00",
        battle_end_at=battle_end_at,
        total_damage=1_000_000,
        total_dps=16_666.67,
        clear_flag=clear_flag,
        roster_json="[]",
        participants_json="[]",
        timeline_events_json="[]",
        role_skill_stats_json="[]",
        parser_version=parser_version,
        rules_version="raw-log-parser-v37",
        battle_fingerprint=f"fingerprint-{battle_id}",
        time_source=time_source,
        official_timer_end_seen=official_timer_end_seen,
        visibility=visibility,
        status=status,
        created_at=battle_end_at,
    )


def _search_service() -> DemoPublicDataService:
    service = DemoPublicDataService.__new__(DemoPublicDataService)
    service.bosses_by_slug = {}
    service._hot_bosses_cache = None
    service._public_account_search_cache = {}
    service._public_account_search_cache_lock = Lock()
    service._battle_list_cache = {}
    service._battle_list_cache_lock = Lock()
    return service


def test_search_uses_simple_contains_and_public_ranking_eligibility(
    monkeypatch,
) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    test_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    with test_session() as session:
        session.add(
            AuthUserRecord(
                id="user-a",
                email="user-a@example.com",
                nickname="CPU 0",
                created_at=datetime.now(UTC),
                is_admin=False,
                is_disabled=False,
            )
        )
        session.add_all(
            (
                _battle_record("ranked-a", "user-a", "Old Name"),
                _battle_record("ranked-b", "user-b", "CPU_0"),
                _battle_record(
                    "old-parser",
                    "user-old",
                    "CPU Old",
                    parser_version="raw-log-parser-v1",
                ),
                _battle_record(
                    "private",
                    "user-private",
                    "CPU Private",
                    visibility="private",
                ),
                _battle_record(
                    "invalid",
                    "user-invalid",
                    "CPU Invalid",
                    status="deleted",
                ),
                _battle_record(
                    "uncleared",
                    "user-uncleared",
                    "CPU Uncleared",
                    clear_flag=False,
                ),
                _battle_record(
                    "unofficial",
                    "user-unofficial",
                    "CPU Unofficial",
                    official_timer_end_seen=False,
                ),
            )
        )
        session.commit()

    monkeypatch.setattr(public_data, "SessionLocal", test_session)
    service = _search_service()

    response = service.search_public_accounts(query="cpu", limit=10)

    assert response == PublicAccountSearchResponse(
        query="cpu",
        hasMore=False,
        accounts=[
            PublicAccountSearchEntryResponse(
                accountId="user-a",
                accountDisplayName="CPU 0",
            ),
            PublicAccountSearchEntryResponse(
                accountId="user-b",
                accountDisplayName="CPU_0",
            ),
        ],
    )

    spaced = service.search_public_accounts(query="cpu 0", limit=10)
    assert [account.accountId for account in spaced.accounts] == ["user-a"]

    underscored = service.search_public_accounts(query="cpu_0", limit=10)
    assert [account.accountId for account in underscored.accounts] == ["user-b"]

    assert service.search_public_accounts(query="CPU0", limit=10).accounts == []


def test_search_rejects_a_query_shorter_than_two_trimmed_characters() -> None:
    with pytest.raises(AppError) as error:
        _search_service().search_public_accounts(query="  A  ", limit=10)

    assert error.value.code == "account_query_too_short"


def test_search_route_returns_etag_and_supports_not_modified(monkeypatch) -> None:
    expected = PublicAccountSearchResponse(
        query="Alpha",
        hasMore=False,
        accounts=[
            PublicAccountSearchEntryResponse(
                accountId="user-a",
                accountDisplayName="Alpha",
            )
        ],
    )
    monkeypatch.setattr(
        battle_routes.public_data_service,
        "search_public_accounts",
        lambda *, query, limit: expected,
    )
    client = TestClient(app)

    response = client.get("/api/battles/users?query=Alpha&limit=10")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "public, max-age=60"
    etag = response.headers["etag"]
    assert etag.startswith('W/"') and len(etag) > 20
    assert response.json() == {
        "query": "Alpha",
        "hasMore": False,
        "accounts": [
            {
                "accountId": "user-a",
                "accountDisplayName": "Alpha",
            }
        ],
    }

    cached = client.get(
        "/api/battles/users?query=Alpha&limit=10",
        headers={"If-None-Match": etag},
    )
    assert cached.status_code == 304
    assert cached.content == b""
    assert client.get("/api/battles/users").status_code == 422


def test_search_cache_is_bounded_and_cleared_with_public_caches(monkeypatch) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    test_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    service = _search_service()
    monkeypatch.setattr(public_data, "SessionLocal", test_session)

    with test_session() as session:
        session.add(_battle_record("first", "user-a", "User Alpha"))
        session.commit()

    assert service.search_public_accounts(query="User", limit=10).accounts == [
        PublicAccountSearchEntryResponse(
            accountId="user-a",
            accountDisplayName="User Alpha",
        )
    ]

    with test_session() as session:
        session.add(_battle_record("second", "user-b", "User Beta"))
        session.commit()

    assert len(service.search_public_accounts(query="User", limit=10).accounts) == 1
    service._invalidate_public_caches()
    assert len(service.search_public_accounts(query="User", limit=10).accounts) == 2

    limited = service.search_public_accounts(query="User", limit=1)
    assert len(limited.accounts) == 1
    assert limited.hasMore is True

    monkeypatch.setattr(public_data, "PUBLIC_ACCOUNT_SEARCH_CACHE_MAX_ENTRIES", 2)
    service.search_public_accounts(query="Alpha", limit=10)
    service.search_public_accounts(query="Beta", limit=10)
    assert len(service._public_account_search_cache) <= 2
