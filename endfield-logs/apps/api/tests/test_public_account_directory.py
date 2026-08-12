from datetime import UTC, datetime

from app.api.routes import battles as battle_routes
from app.db.models import AuthUserRecord, Base, UploadedBattleRecord
from app.main import app
from app.schemas.public import (
    PublicAccountDirectoryEntryResponse,
    PublicAccountDirectoryResponse,
)
from app.services import public_data
from app.services.public_data import DemoPublicDataService
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def _battle_record(
    battle_id: str,
    account_id: str,
    nickname: str,
    *,
    status: str = "valid",
    visibility: str = "public",
    clear_flag: bool = True,
    battle_end_at: str = "2026-08-01T12:00:00+00:00",
    parser_version: str = "raw-log-parser-v1",
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
        rules_version="raw-log-parser-v1",
        battle_fingerprint=f"fingerprint-{battle_id}",
        visibility=visibility,
        status=status,
        created_at=battle_end_at,
    )


def test_directory_uses_only_valid_public_clears_without_parser_gate(
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
                nickname="Alpha Current",
                created_at=datetime.now(UTC),
                is_admin=False,
                is_disabled=False,
            )
        )
        session.add_all(
            (
                _battle_record(
                    "old-parser",
                    "user-a",
                    "Alpha Old",
                    parser_version="raw-log-parser-v1",
                ),
                _battle_record(
                    "duplicate-account",
                    "user-a",
                    "Alpha Older",
                    battle_end_at="2026-07-01T12:00:00+00:00",
                ),
                _battle_record(
                    "fallback-old",
                    "user-b",
                    "Beta Old",
                    battle_end_at="2026-06-01T12:00:00+00:00",
                ),
                _battle_record(
                    "fallback-new",
                    "user-b",
                    "Beta Latest",
                    battle_end_at="2026-08-02T12:00:00+00:00",
                ),
                _battle_record(
                    "private",
                    "user-private",
                    "Private Account",
                    visibility="private",
                ),
                _battle_record(
                    "invalid",
                    "user-invalid",
                    "Invalid Account",
                    status="deleted",
                ),
                _battle_record(
                    "uncleared",
                    "user-uncleared",
                    "Uncleared Account",
                    clear_flag=False,
                ),
            )
        )
        session.commit()

    monkeypatch.setattr(public_data, "SessionLocal", test_session)

    response = DemoPublicDataService.__new__(
        DemoPublicDataService
    ).list_public_accounts()

    assert response == PublicAccountDirectoryResponse(
        totalAccounts=2,
        accounts=[
            PublicAccountDirectoryEntryResponse(
                accountId="user-a",
                accountDisplayName="Alpha Current",
            ),
            PublicAccountDirectoryEntryResponse(
                accountId="user-b",
                accountDisplayName="Beta Latest",
            ),
        ],
    )


def test_directory_route_returns_the_minimal_public_contract(monkeypatch) -> None:
    expected = PublicAccountDirectoryResponse(
        totalAccounts=1,
        accounts=[
            PublicAccountDirectoryEntryResponse(
                accountId="user-a",
                accountDisplayName="Alpha",
            )
        ],
    )
    monkeypatch.setattr(
        battle_routes.public_data_service,
        "list_public_accounts",
        lambda: expected,
    )

    response = TestClient(app).get("/api/battles/users")

    assert response.status_code == 200
    assert response.json() == {
        "totalAccounts": 1,
        "accounts": [
            {
                "accountId": "user-a",
                "accountDisplayName": "Alpha",
            }
        ],
    }
