from __future__ import annotations

from PySide6.QtCore import QSize, Qt, Signal
from PySide6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QProgressBar,
    QPushButton,
    QSizePolicy,
    QStyle,
    QVBoxLayout,
    QWidget,
)

from app.state.store import BattleCandidate
from app.ui.theme import WORKFLOW_STYLE, install_shadow, set_message_label, set_pointing_hand


class BattleUploadView(QWidget):
    upload_requested = Signal(list)
    reupload_requested = Signal(str)
    retry_failed_requested = Signal(list)
    open_record_requested = Signal(str)
    back_requested = Signal()
    logout_requested = Signal()
    start_game_requested = Signal()

    def __init__(self) -> None:
        super().__init__()
        self._all_candidates: list[BattleCandidate] = []
        self._candidates_by_id: dict[str, BattleCandidate] = {}
        self._visible_candidate_ids: list[str] = []

        self.setObjectName("battleUploadRoot")
        self.setStyleSheet(WORKFLOW_STYLE)

        outer = QVBoxLayout()
        outer.setContentsMargins(28, 24, 28, 22)
        outer.setSpacing(0)

        card = QFrame()
        card.setObjectName("workflowCard")
        card.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        card_layout = QVBoxLayout(card)
        card_layout.setContentsMargins(24, 24, 24, 22)
        card_layout.setSpacing(14)

        header = QFrame()
        header.setObjectName("heroStrip")
        header_layout = QVBoxLayout(header)
        header_layout.setContentsMargins(24, 20, 24, 20)
        header_layout.setSpacing(7)

        eyebrow = QLabel("BATTLE UPLOAD")
        eyebrow.setObjectName("workflowEyebrow")
        title = QLabel("选择、筛选并上传 battle 记录")
        title.setObjectName("workflowTitle")
        title.setWordWrap(True)
        description = QLabel("解析结果会按场次列出，可以筛选失败项、重复项和可上传记录后批量提交。")
        description.setObjectName("workflowBody")
        description.setWordWrap(True)
        header_layout.addWidget(eyebrow)
        header_layout.addWidget(title)
        header_layout.addWidget(description)

        summary_panel = QFrame()
        summary_panel.setObjectName("summaryPanel")
        summary_layout = QVBoxLayout(summary_panel)
        summary_layout.setContentsMargins(18, 13, 18, 13)
        summary_layout.setSpacing(5)
        summary_title = QLabel("当前解析结果")
        summary_title.setObjectName("sectionTitle")
        self.summary_label = QLabel("")
        self.summary_label.setObjectName("summaryLabel")
        self.summary_label.setWordWrap(True)
        summary_layout.addWidget(summary_title)
        summary_layout.addWidget(self.summary_label)

        filter_panel = QFrame()
        filter_panel.setObjectName("filterPanel")
        filters_layout = QHBoxLayout(filter_panel)
        filters_layout.setContentsMargins(14, 12, 14, 12)
        filters_layout.setSpacing(10)
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("筛选首领 / 副本 / 阵容")
        self.status_filter = QComboBox()
        self.status_filter.addItems(["全部状态", "仅可上传", "仅已存在", "仅上传成功", "仅失败项"])
        self.sort_order = QComboBox()
        self.sort_order.addItems(["按场次", "按时长（短到长）", "按时长（长到短）", "按首领名称"])
        self.show_uncleared_checkbox = QCheckBox("显示未完成战斗")
        self.show_uncleared_checkbox.setObjectName("showUnclearedFilter")
        self.show_uncleared_checkbox.setToolTip("未完成 battle 可以上传，但不会进入排行榜。")
        self.show_uncleared_checkbox.setChecked(True)
        set_pointing_hand(self.show_uncleared_checkbox)
        filters_layout.addWidget(self.search_input)
        filters_layout.addWidget(self.status_filter)
        filters_layout.addWidget(self.sort_order)
        filters_layout.addWidget(self.show_uncleared_checkbox)
        self.list_widget = QListWidget()
        self.list_widget.setAlternatingRowColors(False)
        self.progress_label = QLabel("")
        self.progress_label.setObjectName("progressLabel")
        self.progress_bar = QProgressBar()
        self.progress_bar.hide()
        self.message_label = QLabel("")
        self.message_label.setObjectName("messageLabel")
        self.message_label.setWordWrap(True)
        self.message_label.hide()

        self.progress_panel = QFrame()
        self.progress_panel.setObjectName("progressPanel")
        progress_layout = QVBoxLayout(self.progress_panel)
        progress_layout.setContentsMargins(18, 13, 18, 13)
        progress_layout.setSpacing(8)
        progress_layout.addWidget(self.progress_label)
        progress_layout.addWidget(self.progress_bar)
        self.progress_panel.hide()

        self.select_all_button = QPushButton("全选当前可上传项")
        self.clear_selection_button = QPushButton("清空当前选择")
        self.upload_button = QPushButton("上传勾选的 battle")
        self.upload_current_button = QPushButton("上传当前记录")
        self.reupload_button = QPushButton("重传当前记录")
        self.reupload_button.setToolTip(
            "对已存在的战斗重新上传：用新版客户端补全数据字段（复用同一条记录，不产生重复）。"
        )
        self.retry_failed_button = QPushButton("重试失败项")
        self.open_record_button = QPushButton("打开当前记录")
        self.back_button = QPushButton("返回重新选择日志")
        self.logout_button = QPushButton("退出登录")
        self.start_game_button = QPushButton("启动游戏")

        self.retry_failed_button.setEnabled(False)
        self.open_record_button.setEnabled(False)

        for button in [
            self.select_all_button,
            self.clear_selection_button,
            self.upload_current_button,
            self.reupload_button,
            self.retry_failed_button,
            self.open_record_button,
        ]:
            button.setObjectName("secondaryAction")
            button.setMinimumHeight(40)
            set_pointing_hand(button)
        self.upload_button.setObjectName("primaryAction")
        self.upload_button.setMinimumHeight(42)
        set_pointing_hand(self.upload_button)
        for button in [self.back_button, self.logout_button]:
            button.setObjectName("ghostAction")
            button.setMinimumHeight(36)
            set_pointing_hand(button)
        self.start_game_button.setObjectName("secondaryAction")
        self.start_game_button.setMinimumHeight(36)
        self.start_game_button.setToolTip("启动终末地游戏本体。")
        set_pointing_hand(self.start_game_button)
        self.start_game_button.setIcon(
            self.style().standardIcon(QStyle.StandardPixmap.SP_MediaPlay)
        )

        self.select_all_button.setIcon(
            self.style().standardIcon(QStyle.StandardPixmap.SP_DialogApplyButton)
        )
        self.clear_selection_button.setIcon(
            self.style().standardIcon(QStyle.StandardPixmap.SP_DialogResetButton)
        )
        self.upload_button.setIcon(
            self.style().standardIcon(QStyle.StandardPixmap.SP_DialogSaveButton)
        )
        self.upload_current_button.setIcon(
            self.style().standardIcon(QStyle.StandardPixmap.SP_DialogSaveButton)
        )
        self.retry_failed_button.setIcon(
            self.style().standardIcon(QStyle.StandardPixmap.SP_BrowserReload)
        )
        self.open_record_button.setIcon(
            self.style().standardIcon(QStyle.StandardPixmap.SP_DialogOpenButton)
        )
        self.back_button.setIcon(self.style().standardIcon(QStyle.StandardPixmap.SP_ArrowBack))
        self.logout_button.setIcon(
            self.style().standardIcon(QStyle.StandardPixmap.SP_DialogCloseButton)
        )

        main_actions = QHBoxLayout()
        main_actions.setSpacing(10)
        main_actions.addWidget(self.select_all_button)
        main_actions.addWidget(self.clear_selection_button)
        main_actions.addStretch(1)
        main_actions.addWidget(self.upload_button, 2)
        main_actions.addWidget(self.upload_current_button)
        main_actions.addWidget(self.reupload_button)
        main_actions.addWidget(self.retry_failed_button)
        main_actions.addWidget(self.open_record_button)

        footer_actions = QHBoxLayout()
        footer_actions.setSpacing(8)
        footer_actions.addWidget(self.back_button)
        footer_actions.addStretch(1)
        footer_actions.addWidget(self.start_game_button)
        footer_actions.addWidget(self.logout_button)

        self.action_panel = QFrame()
        self.action_panel.setObjectName("actionPanel")
        self.action_panel.setMinimumHeight(116)
        self.action_panel.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        action_layout = QVBoxLayout(self.action_panel)
        action_layout.setContentsMargins(14, 12, 14, 12)
        action_layout.setSpacing(10)
        action_layout.addLayout(main_actions)
        action_layout.addLayout(footer_actions)

        card_layout.addWidget(header)
        card_layout.addWidget(summary_panel)
        card_layout.addWidget(filter_panel)
        card_layout.addWidget(self.list_widget, 1)
        card_layout.addWidget(self.progress_panel)
        card_layout.addWidget(self.action_panel)
        card_layout.addWidget(self.message_label)

        outer.addWidget(card, 1)
        self.setLayout(outer)
        install_shadow(card, blur_radius=46)

        self.search_input.textChanged.connect(lambda *_: self._render_candidates())
        self.status_filter.currentIndexChanged.connect(lambda *_: self._render_candidates())
        self.sort_order.currentIndexChanged.connect(lambda *_: self._render_candidates())
        self.show_uncleared_checkbox.toggled.connect(lambda *_: self._on_show_uncleared_changed())
        self.select_all_button.clicked.connect(self._select_all_visible_uploadable)
        self.clear_selection_button.clicked.connect(self._clear_visible_selection)
        self.upload_button.clicked.connect(self._on_upload_clicked)
        self.upload_current_button.clicked.connect(self._on_upload_current_clicked)
        self.reupload_button.clicked.connect(self._on_reupload_clicked)
        self.retry_failed_button.clicked.connect(self._on_retry_failed_clicked)
        self.open_record_button.clicked.connect(self._on_open_record_clicked)
        self.back_button.clicked.connect(lambda: self.back_requested.emit())
        self.logout_button.clicked.connect(lambda: self.logout_requested.emit())
        self.start_game_button.clicked.connect(lambda: self.start_game_requested.emit())
        self.list_widget.itemChanged.connect(self._on_item_changed)
        self.list_widget.currentItemChanged.connect(lambda *_: self._sync_buttons())

    def set_busy(self, busy: bool) -> None:
        self.search_input.setEnabled(not busy)
        self.status_filter.setEnabled(not busy)
        self.sort_order.setEnabled(not busy)
        self.show_uncleared_checkbox.setEnabled(not busy)
        self.select_all_button.setEnabled(not busy and bool(self._visible_uploadable_candidates()))
        self.clear_selection_button.setEnabled(not busy and bool(self.selected_candidate_ids()))
        self.upload_button.setEnabled(not busy and bool(self.selected_candidate_ids()))
        self.upload_current_button.setEnabled(not busy and self._selected_uploadable_candidate_id() is not None)
        self.reupload_button.setEnabled(not busy and self._selected_duplicate_candidate_id() is not None)
        self.retry_failed_button.setEnabled(not busy and bool(self.failed_candidate_ids()))
        self.open_record_button.setEnabled(not busy and self._selected_record_url() is not None)
        self.back_button.setEnabled(not busy)
        self.logout_button.setEnabled(not busy)
        self.list_widget.setEnabled(not busy)

    def set_message(self, message: str, *, error: bool = False) -> None:
        set_message_label(self.message_label, message, error=error)

    def set_progress(self, message: str, *, current: int | None = None, total: int | None = None) -> None:
        self.progress_label.setText(message)
        self.progress_panel.show()
        self.progress_bar.show()
        if total and total > 0 and current is not None:
            self.progress_bar.setRange(0, total)
            self.progress_bar.setValue(max(0, min(current, total)))
            return
        self.progress_bar.setRange(0, 0)

    def clear_progress(self) -> None:
        self.progress_label.clear()
        self.progress_bar.setRange(0, 1)
        self.progress_bar.setValue(0)
        self.progress_bar.hide()
        self.progress_panel.hide()

    def set_candidates(
        self,
        candidates: list[BattleCandidate],
        *,
        reset_uncleared_filter: bool = False,
    ) -> None:
        if reset_uncleared_filter:
            self.show_uncleared_checkbox.blockSignals(True)
            self.show_uncleared_checkbox.setChecked(True)
            self.show_uncleared_checkbox.blockSignals(False)
        self._all_candidates = list(candidates)
        self._candidates_by_id = {candidate.candidate_id: candidate for candidate in candidates}
        for candidate in self._all_candidates:
            if self._dungeon_identity_is_unverified(candidate.payload.get("battle") or {}):
                candidate.selected = False
        if not self.show_uncleared_checkbox.isChecked():
            self._clear_uncleared_selection()
        self._render_candidates()

    def _render_candidates(self) -> None:
        candidates = self._sorted_candidates(self._filtered_candidates(self._all_candidates))
        self.list_widget.blockSignals(True)
        self.list_widget.clear()
        self._visible_candidate_ids = []

        for candidate in candidates:
            text = self._format_candidate_text(candidate)
            item = QListWidgetItem(text)
            item.setSizeHint(QSize(0, 98))
            item.setData(Qt.ItemDataRole.UserRole, candidate.candidate_id)
            item.setToolTip(self._format_candidate_tooltip(candidate))
            self._visible_candidate_ids.append(candidate.candidate_id)
            flags = item.flags() | Qt.ItemFlag.ItemIsSelectable | Qt.ItemFlag.ItemIsEnabled
            if (
                not candidate.duplicate
                and not candidate.upload_url
                and not self._dungeon_identity_is_unverified(candidate.payload.get("battle") or {})
            ):
                flags |= Qt.ItemFlag.ItemIsUserCheckable
                item.setCheckState(Qt.CheckState.Checked if candidate.selected else Qt.CheckState.Unchecked)
            else:
                item.setCheckState(Qt.CheckState.Unchecked)
            item.setFlags(flags)
            self.list_widget.addItem(item)

        self.list_widget.blockSignals(False)
        total_count = len(candidates)
        uploadable_count = sum(
            1
            for candidate in candidates
            if not candidate.duplicate
            and not candidate.upload_url
            and not self._dungeon_identity_is_unverified(candidate.payload.get("battle") or {})
        )
        duplicate_count = sum(1 for candidate in candidates if candidate.duplicate)
        uploaded_count = sum(1 for candidate in candidates if candidate.upload_url)
        failed_count = sum(
            1
            for candidate in candidates
            if candidate.upload_error and not candidate.upload_url and not candidate.duplicate
        )
        selected_count = len(self.selected_candidate_ids())
        visible_ids = set(self._visible_candidate_ids)
        uncleared_count = sum(
            1 for candidate in self._all_candidates if self._is_uncleared_candidate(candidate)
        )
        hidden_uncleared_count = sum(
            1
            for candidate in self._all_candidates
            if self._is_uncleared_candidate(candidate) and candidate.candidate_id not in visible_ids
        )
        source_label = f"来源：{self._all_candidates[0].file_name} | " if self._all_candidates else ""
        hidden_uncleared_label = (
            f" | 已隐藏未完成：{hidden_uncleared_count}" if hidden_uncleared_count else ""
        )
        self.summary_label.setText(
            f"{source_label}全部：{len(self._all_candidates)} | 当前显示：{total_count} | "
            f"未完成：{uncleared_count}"
            f"{hidden_uncleared_label} | 可上传：{uploadable_count} | 已存在：{duplicate_count} | "
            f"已上传：{uploaded_count} | 失败：{failed_count} | 已勾选：{selected_count}"
        )
        self._sync_buttons()

    def _filtered_candidates(self, candidates: list[BattleCandidate]) -> list[BattleCandidate]:
        query = self.search_input.text().strip().lower()
        status_label = self.status_filter.currentText()
        show_uncleared = self.show_uncleared_checkbox.isChecked()
        filtered: list[BattleCandidate] = []
        for candidate in candidates:
            if self._is_uncleared_candidate(candidate) and not show_uncleared:
                continue

            if query:
                haystack = " ".join(
                    [
                        candidate.boss_name,
                        candidate.dungeon_name,
                        " ".join(candidate.roster_names),
                    ]
                ).lower()
                if query not in haystack:
                    continue

            if status_label == "仅可上传" and (
                candidate.duplicate
                or candidate.upload_url
                or self._dungeon_identity_is_unverified(candidate.payload.get("battle") or {})
            ):
                continue
            if status_label == "仅已存在" and not candidate.duplicate:
                continue
            if status_label == "仅上传成功" and not candidate.upload_url:
                continue
            if status_label == "仅失败项" and not (candidate.upload_error and not candidate.upload_url and not candidate.duplicate):
                continue
            filtered.append(candidate)
        return filtered

    def _sorted_candidates(self, candidates: list[BattleCandidate]) -> list[BattleCandidate]:
        sort_label = self.sort_order.currentText()
        if sort_label == "按时长（短到长）":
            return sorted(candidates, key=lambda candidate: (candidate.duration_ms, candidate.source_battle_index))
        if sort_label == "按时长（长到短）":
            return sorted(candidates, key=lambda candidate: (-candidate.duration_ms, candidate.source_battle_index))
        if sort_label == "按首领名称":
            return sorted(candidates, key=lambda candidate: (candidate.boss_name, candidate.source_battle_index))
        return sorted(candidates, key=lambda candidate: candidate.source_battle_index)

    @staticmethod
    def _format_damage(value: int | float | None) -> str:
        if value is None:
            return "-"
        return f"{int(value):,}"

    def _format_candidate_text(self, candidate: BattleCandidate) -> str:
        battle = candidate.payload.get("battle") or {}
        roster_text = " / ".join(candidate.roster_names)
        status_bits: list[str] = []
        if candidate.duplicate:
            status_bits.append("已存在")
        elif candidate.upload_url:
            status_bits.append("上传成功")
        elif self._dungeon_identity_is_unverified(battle):
            status_bits.append("不可上传")
        else:
            status_bits.append("可上传")
        if candidate.upload_error:
            status_bits.append(f"失败：{candidate.upload_error}")
        if self._is_uncleared_candidate(candidate):
            status_bits.append("未完成")
        if battle.get("timerWindowValid") is False:
            status_bits.append("计时窗口无效")
        if battle.get("rdpsStrictOk") is False:
            blocker_count = battle.get("rdpsPreflightBlockerCount")
            blocker_suffix = f"({int(blocker_count)}项)" if blocker_count is not None else ""
            status_bits.append(f"rDPS审计失败{blocker_suffix}")
        if battle.get("loadoutFallbackUsed") is True:
            status_bits.append("配装使用兜底")
        if self._dungeon_identity_is_unverified(battle):
            status_bits.append("副本场地未验证")

        total_damage = self._format_damage(battle.get("totalDamage"))
        total_dps = battle.get("totalDps")
        total_dps_text = f"{float(total_dps):.2f}" if total_dps is not None else "-"
        fingerprint = str(battle.get("battleFingerprint") or "")
        rules_version = str(battle.get("rulesVersion") or "-")
        clear_status = "未完成" if self._is_uncleared_candidate(candidate) else "已完成"
        header = (
            f"第 {candidate.source_battle_index} 场 | {candidate.boss_name} | "
            f"{candidate.dungeon_name} | {candidate.duration_ms / 1000:.2f}s | {clear_status}"
        )
        metrics = (
            f"总伤：{total_damage} | 总DPS：{total_dps_text} | "
            f"指纹：{fingerprint[:12] or '-'} | 规则：{rules_version}"
        )
        return "\n".join(
            [
                header,
                f"阵容：{roster_text}",
                metrics,
                f"状态：{' / '.join(status_bits)}",
            ]
        )

    def _format_candidate_tooltip(self, candidate: BattleCandidate) -> str:
        battle = candidate.payload.get("battle") or {}
        fingerprint = str(battle.get("battleFingerprint") or "-")
        parser_version = str(battle.get("parserVersion") or "-")
        rules_version = str(battle.get("rulesVersion") or "-")
        battle_start_at = str(battle.get("battleStartAt") or "-")
        battle_end_at = str(battle.get("battleEndAt") or "-")
        clear_status = "未完成" if self._is_uncleared_candidate(candidate) else "已完成"
        timer_window = self._format_check_state(battle.get("timerWindowValid"))
        rdps_strict = self._format_check_state(battle.get("rdpsStrictOk"))
        blocker_count = battle.get("rdpsPreflightBlockerCount")
        blocker_text = str(int(blocker_count)) if blocker_count is not None else "-"
        boss_identity_source = str(battle.get("bossIdentitySource") or "-")
        dungeon_identity_source = str(battle.get("dungeonIdentitySource") or "-")
        dungeon_context_id = str(battle.get("dungeonContextId") or "-")
        loadout_fallback = "是" if battle.get("loadoutFallbackUsed") is True else "否"
        return "\n".join(
            [
                f"来源文件：{candidate.file_name}",
                f"完成状态：{clear_status}",
                f"开始时间：{battle_start_at}",
                f"结束时间：{battle_end_at}",
                f"完整指纹：{fingerprint}",
                f"解析版本：{parser_version}",
                f"规则版本：{rules_version}",
                f"计时窗口有效：{timer_window}",
                f"rDPS 严格审计：{rdps_strict}（阻断项：{blocker_text}）",
                f"Boss 身份来源：{boss_identity_source}",
                f"副本身份来源：{dungeon_identity_source}",
                f"官方场地 ID：{dungeon_context_id}",
                f"配装使用兜底：{loadout_fallback}",
            ]
        )

    @staticmethod
    def _format_check_state(value: object) -> str:
        if value is True:
            return "是"
        if value is False:
            return "否"
        return "旧记录未提供"

    @staticmethod
    def _dungeon_identity_is_unverified(battle: dict) -> bool:
        return (
            battle.get("dungeonIdentitySource") != "dungeon_context"
            or not str(battle.get("dungeonContextId") or "").strip()
            or str(battle.get("dungeonKey") or "") in {"", "unknown_dungeon"}
        )

    @staticmethod
    def _is_uncleared_candidate(candidate: BattleCandidate) -> bool:
        battle = candidate.payload.get("battle") if isinstance(candidate.payload, dict) else None
        if not isinstance(battle, dict):
            return True
        if battle.get("clearFlag") is not True:
            return True
        if battle.get("timerWindowValid") is False:
            return True
        has_timer_fields = "timerEndSeen" in battle or "officialTimerEndSeen" in battle
        if not has_timer_fields:
            return False
        return battle.get("timerEndSeen") is not True and battle.get("officialTimerEndSeen") is not True

    def _clear_uncleared_selection(self) -> None:
        for candidate in self._all_candidates:
            if self._is_uncleared_candidate(candidate):
                candidate.selected = False

    def selected_candidate_ids(self) -> list[str]:
        return [
            candidate.candidate_id
            for candidate in self._all_candidates
            if candidate.selected
            and not candidate.duplicate
            and not candidate.upload_url
            and not self._dungeon_identity_is_unverified(candidate.payload.get("battle") or {})
        ]

    def failed_candidate_ids(self) -> list[str]:
        return [
            candidate.candidate_id
            for candidate in self._candidates_by_id.values()
            if candidate.upload_error
            and not candidate.upload_url
            and not candidate.duplicate
            and not self._dungeon_identity_is_unverified(candidate.payload.get("battle") or {})
        ]

    def _selected_record_url(self) -> str | None:
        item = self.list_widget.currentItem()
        if item is None:
            return None
        candidate_id = item.data(Qt.ItemDataRole.UserRole)
        if not isinstance(candidate_id, str):
            return None
        candidate = self._candidates_by_id.get(candidate_id)
        if candidate is None:
            return None
        return candidate.upload_url or candidate.duplicate_url

    def _selected_uploadable_candidate_id(self) -> str | None:
        item = self.list_widget.currentItem()
        if item is None:
            return None
        candidate_id = item.data(Qt.ItemDataRole.UserRole)
        if not isinstance(candidate_id, str):
            return None
        candidate = self._candidates_by_id.get(candidate_id)
        if (
            candidate is None
            or candidate.duplicate
            or candidate.upload_url
            or self._dungeon_identity_is_unverified(candidate.payload.get("battle") or {})
        ):
            return None
        return candidate_id

    def _visible_uploadable_candidates(self) -> list[BattleCandidate]:
        return [
            candidate
            for candidate_id in self._visible_candidate_ids
            if (candidate := self._candidates_by_id.get(candidate_id)) is not None
            and not candidate.duplicate
            and not candidate.upload_url
            and not self._dungeon_identity_is_unverified(candidate.payload.get("battle") or {})
        ]

    def _sync_buttons(self) -> None:
        self.select_all_button.setEnabled(bool(self._visible_uploadable_candidates()))
        self.clear_selection_button.setEnabled(bool(self.selected_candidate_ids()))
        self.upload_button.setEnabled(bool(self.selected_candidate_ids()))
        self.upload_current_button.setEnabled(self._selected_uploadable_candidate_id() is not None)
        self.reupload_button.setEnabled(self._selected_duplicate_candidate_id() is not None)
        self.retry_failed_button.setEnabled(bool(self.failed_candidate_ids()))
        self.open_record_button.setEnabled(self._selected_record_url() is not None)

    def _on_item_changed(self, item: QListWidgetItem) -> None:
        candidate_id = item.data(Qt.ItemDataRole.UserRole)
        if not isinstance(candidate_id, str):
            return
        candidate = self._candidates_by_id.get(candidate_id)
        if candidate is None:
            return
        candidate.selected = item.checkState() == Qt.CheckState.Checked
        self._sync_buttons()

    def _on_show_uncleared_changed(self) -> None:
        if not self.show_uncleared_checkbox.isChecked():
            self._clear_uncleared_selection()
        self._render_candidates()

    def _select_all_visible_uploadable(self) -> None:
        for candidate in self._visible_uploadable_candidates():
            candidate.selected = True
        self._render_candidates()

    def _clear_visible_selection(self) -> None:
        for candidate_id in self._visible_candidate_ids:
            candidate = self._candidates_by_id.get(candidate_id)
            if candidate is not None and not candidate.duplicate and not candidate.upload_url:
                candidate.selected = False
        self._render_candidates()

    def _on_upload_clicked(self) -> None:
        self.upload_requested.emit(self.selected_candidate_ids())

    def _on_upload_current_clicked(self) -> None:
        candidate_id = self._selected_uploadable_candidate_id()
        if candidate_id:
            self.upload_requested.emit([candidate_id])

    def _selected_duplicate_candidate_id(self) -> str | None:
        """当前选中且已存在于服务器的记录（重传补全的目标）。"""
        item = self.list_widget.currentItem()
        if item is None:
            return None
        candidate_id = item.data(Qt.ItemDataRole.UserRole)
        if not isinstance(candidate_id, str):
            return None
        candidate = self._candidates_by_id.get(candidate_id)
        if candidate is None or not candidate.duplicate or candidate.upload_url:
            return None
        return candidate_id

    def _on_reupload_clicked(self) -> None:
        candidate_id = self._selected_duplicate_candidate_id()
        if candidate_id:
            self.reupload_requested.emit(candidate_id)

    def _on_retry_failed_clicked(self) -> None:
        self.retry_failed_requested.emit(self.failed_candidate_ids())

    def _on_open_record_clicked(self) -> None:
        url = self._selected_record_url()
        if url:
            self.open_record_requested.emit(url)
