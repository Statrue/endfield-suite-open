from __future__ import annotations

from PySide6.QtWidgets import (
    QDialog,
    QDialogButtonBox,
    QFormLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QVBoxLayout,
)

from app.services.settings_store import UploaderSettings


class SettingsDialog(QDialog):
    def __init__(self, settings: UploaderSettings, parent=None) -> None:
        super().__init__(parent)
        self.setWindowTitle("上传器设置")
        self.resize(520, 220)
        self.last_log_dir = settings.last_log_dir

        layout = QVBoxLayout()

        intro = QLabel("配置上传器连接的 API 和网站地址。保存后会立即做一次连接检查。")
        intro.setWordWrap(True)

        form = QFormLayout()
        defaults = UploaderSettings()
        self.api_base_url_input = QLineEdit(settings.api_base_url)
        self.web_base_url_input = QLineEdit(settings.web_base_url)
        self.api_base_url_input.setPlaceholderText(defaults.api_base_url)
        self.web_base_url_input.setPlaceholderText(defaults.web_base_url)
        form.addRow("API 地址", self.api_base_url_input)
        form.addRow("网站地址", self.web_base_url_input)

        self.message_label = QLabel("")
        self.message_label.setWordWrap(True)

        self.reset_button = QPushButton("恢复默认")
        self.button_box = QDialogButtonBox(QDialogButtonBox.StandardButton.Save | QDialogButtonBox.StandardButton.Cancel)

        layout.addWidget(intro)
        layout.addLayout(form)
        layout.addWidget(self.reset_button)
        layout.addWidget(self.message_label)
        layout.addWidget(self.button_box)
        self.setLayout(layout)

        self.reset_button.clicked.connect(self._reset_defaults)
        self.button_box.accepted.connect(self._accept_if_valid)
        self.button_box.rejected.connect(self.reject)

    def _reset_defaults(self) -> None:
        defaults = UploaderSettings()
        self.api_base_url_input.setText(defaults.api_base_url)
        self.web_base_url_input.setText(defaults.web_base_url)
        self.set_message("已恢复默认地址。")

    def _accept_if_valid(self) -> None:
        settings = self.current_settings()
        if not settings.api_base_url.startswith(("http://", "https://")):
            self.set_message("API 地址必须以 http:// 或 https:// 开头。", error=True)
            return
        if not settings.web_base_url.startswith(("http://", "https://")):
            self.set_message("网站地址必须以 http:// 或 https:// 开头。", error=True)
            return
        self.accept()

    def current_settings(self) -> UploaderSettings:
        return UploaderSettings(
            api_base_url=self.api_base_url_input.text().strip(),
            web_base_url=self.web_base_url_input.text().strip(),
            last_log_dir=self.last_log_dir,
        )

    def set_message(self, message: str, *, error: bool = False) -> None:
        color = "#c0392b" if error else "#2c3e50"
        self.message_label.setStyleSheet(f"color: {color};")
        self.message_label.setText(message)
