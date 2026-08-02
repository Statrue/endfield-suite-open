from __future__ import annotations

from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parent
DATA_SENTINEL = ROOT / "data" / "local_tables" / "NumIdStrTable.json"

RESOURCE_TEST_FILES = {
    "test_loadout_static.py",
    "test_message_registry_activity.py",
    "test_overlay_status.py",
    "test_packet_resolver_bundle.py",
    "test_packet_resolver_wulfa.py",
    "test_rdps_audit.py",
    "test_rdps_effect_catalog.py",
    "test_trace_bridge_timer.py",
}


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    if DATA_SENTINEL.is_file():
        return
    reason = "generated parser resources are not distributed in the public repository"
    marker = pytest.mark.skip(reason=reason)
    parser_tests = ROOT / "packages" / "parser_core" / "tests"
    for item in items:
        path = Path(str(item.path)).resolve()
        if parser_tests in path.parents or path.name in RESOURCE_TEST_FILES:
            item.add_marker(marker)

