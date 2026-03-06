"""
Notification engine – log simulated alerts; hooks for Telegram / email.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

_notification_log: List[Dict[str, Any]] = []


class Notifier:
    def __init__(self):
        self._log = _notification_log
        self._telegram_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self._telegram_chat = os.getenv("TELEGRAM_CHAT_ID", "")
        self._email_enabled = bool(os.getenv("EMAIL_USER", ""))

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def send_alert(self, threat_data: Dict[str, Any]) -> Dict[str, Any]:
        severity = threat_data.get("severity", "medium")
        ttype = threat_data.get("type", "unknown")
        source_ip = threat_data.get("source_ip", "N/A")

        message = (
            f"[{severity.upper()}] {ttype.replace('_', ' ').title()} detected "
            f"from {source_ip}"
        )
        channels_sent = []

        # In-memory log always works
        self.log_notification(message, severity=severity, details=threat_data)
        channels_sent.append("internal_log")

        # Telegram stub
        if self._telegram_token and self._telegram_chat:
            try:
                self._send_telegram(message)
                channels_sent.append("telegram")
            except Exception as exc:
                logger.warning("Telegram send failed: %s", exc)

        logger.info("Alert dispatched via %s: %s", ", ".join(channels_sent), message)
        return {"sent": True, "channels": channels_sent, "message": message}

    def log_notification(
        self,
        message: str,
        severity: str = "info",
        details: Dict[str, Any] = None,
    ) -> None:
        entry = {
            "id": len(self._log) + 1,
            "message": message,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {},
        }
        self._log.append(entry)
        logger.debug("Notification logged: %s", message)

    def get_recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        return list(reversed(self._log[-limit:]))

    # ------------------------------------------------------------------
    # Transport stubs
    # ------------------------------------------------------------------

    def _send_telegram(self, message: str) -> None:
        """Stub – replace with real httpx call when token is configured."""
        logger.debug("Telegram [stub]: %s", message)
