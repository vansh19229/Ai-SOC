"""
Notification engine – log simulated alerts; hooks for Telegram / email.
"""
from __future__ import annotations

import logging
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, List

import httpx

logger = logging.getLogger(__name__)

_notification_log: List[Dict[str, Any]] = []


class Notifier:
    def __init__(self):
        self._log = _notification_log
        self._telegram_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self._telegram_chat = os.getenv("TELEGRAM_CHAT_ID", "")
        self._email_host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        self._email_port = int(os.getenv("EMAIL_PORT", "587"))
        self._email_user = os.getenv("EMAIL_USER", "")
        self._email_password = os.getenv("EMAIL_PASSWORD", "")
        self._email_enabled = bool(self._email_user)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def send_alert(self, threat_data: Dict[str, Any], settings: Dict[str, Any] = None) -> Dict[str, Any]:
        settings = settings or {}
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

        # Telegram
        telegram_enabled = settings.get("telegram_alerts_enabled", os.getenv("TELEGRAM_ALERTS_ENABLED", "").lower() == "true")
        if telegram_enabled and self._telegram_token and self._telegram_chat:
            if severity in ("critical", "high"):
                try:
                    self._send_telegram(threat_data)
                    channels_sent.append("telegram")
                except Exception as exc:
                    logger.warning("Telegram send failed: %s", exc)

        # Email
        email_enabled = settings.get("email_alerts_enabled", self._email_enabled)
        recipients_raw = settings.get("email_recipients", os.getenv("EMAIL_ALERT_RECIPIENTS", ""))
        recipients = [r.strip() for r in str(recipients_raw).split(",") if r.strip()]
        if email_enabled and self._email_user and recipients:
            if severity in ("critical", "high"):
                try:
                    self._send_email(threat_data, recipients)
                    channels_sent.append("email")
                except Exception as exc:
                    logger.warning("Email send failed: %s", exc)

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
    # Transport implementations
    # ------------------------------------------------------------------

    def _send_telegram(self, threat_data: Dict[str, Any]) -> None:
        """Send a formatted alert to Telegram via Bot API."""
        severity = threat_data.get("severity", "medium")
        ttype = threat_data.get("type", "unknown").replace("_", " ").title()
        source_ip = threat_data.get("source_ip", "N/A")
        timestamp = threat_data.get("timestamp", datetime.utcnow().isoformat())

        severity_icon = {"critical": "🚨", "high": "⚠️", "medium": "🔶", "low": "🔵"}.get(severity, "🔔")

        text = (
            f"{severity_icon} *AI-SOC ALERT* {severity_icon}\n\n"
            f"*Severity:* {severity.upper()}\n"
            f"*Threat Type:* {ttype}\n"
            f"*Source IP:* `{source_ip}`\n"
            f"*Time:* {timestamp[:19].replace('T', ' ')} UTC\n"
        )
        if threat_data.get("description"):
            text += f"\n*Details:* {threat_data['description']}"

        url = f"https://api.telegram.org/bot{self._telegram_token}/sendMessage"
        with httpx.Client(timeout=10) as client:
            resp = client.post(url, json={
                "chat_id": self._telegram_chat,
                "text": text,
                "parse_mode": "Markdown",
            })
            resp.raise_for_status()
        logger.info("Telegram alert sent for %s", ttype)

    def _send_email(self, threat_data: Dict[str, Any], recipients: List[str]) -> None:
        """Send an HTML-formatted alert email via SMTP."""
        severity = threat_data.get("severity", "medium")
        ttype = threat_data.get("type", "unknown").replace("_", " ").title()
        source_ip = threat_data.get("source_ip", "N/A")
        timestamp = threat_data.get("timestamp", datetime.utcnow().isoformat())
        description = threat_data.get("description", "No description available.")

        severity_color = {
            "critical": "#ef4444",
            "high": "#f97316",
            "medium": "#eab308",
            "low": "#3b82f6",
        }.get(severity, "#8892a4")

        actions = [
            f"Review the threat in the AI-SOC dashboard",
            f"Investigate traffic from {source_ip}",
            "Check related logs for more context",
            "Follow your incident response playbook",
        ]
        actions_html = "".join(f"<li style='margin:4px 0;color:#e2e8f0;'>{a}</li>" for a in actions)

        html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='margin:0;padding:0;background-color:#0a0e1a;font-family:monospace;'>
  <div style='max-width:600px;margin:0 auto;padding:24px;'>
    <div style='background-color:#161b27;border:1px solid #1e2739;border-radius:12px;padding:24px;'>
      <div style='display:flex;align-items:center;margin-bottom:20px;'>
        <span style='font-size:24px;margin-right:12px;'>🛡️</span>
        <h1 style='color:#00ff88;font-size:20px;margin:0;letter-spacing:0.1em;'>AI-SOC SECURITY ALERT</h1>
      </div>
      <div style='background-color:#0d1117;border:1px solid {severity_color}44;border-radius:8px;padding:16px;margin-bottom:16px;'>
        <div style='display:inline-block;background-color:{severity_color}22;color:{severity_color};
                    font-size:12px;font-weight:bold;text-transform:uppercase;padding:4px 12px;
                    border-radius:4px;border:1px solid {severity_color}44;margin-bottom:12px;'>
          {severity} SEVERITY
        </div>
        <h2 style='color:#e2e8f0;font-size:16px;margin:0 0 12px 0;'>{ttype}</h2>
        <p style='color:#8892a4;font-size:13px;margin:0;'>{description}</p>
      </div>
      <table style='width:100%;border-collapse:collapse;margin-bottom:16px;'>
        <tr><td style='padding:8px;color:#8892a4;font-size:12px;'>Source IP</td>
            <td style='padding:8px;color:#06b6d4;font-family:monospace;font-size:13px;'>{source_ip}</td></tr>
        <tr style='background-color:#0d111722;'>
            <td style='padding:8px;color:#8892a4;font-size:12px;'>Timestamp</td>
            <td style='padding:8px;color:#e2e8f0;font-size:13px;'>{timestamp[:19].replace("T", " ")} UTC</td></tr>
      </table>
      <div style='background-color:#0d1117;border:1px solid #1e2739;border-radius:8px;padding:16px;'>
        <h3 style='color:#e2e8f0;font-size:13px;margin:0 0 8px 0;'>Recommended Actions</h3>
        <ul style='padding-left:20px;margin:0;'>{actions_html}</ul>
      </div>
      <p style='color:#8892a4;font-size:11px;margin-top:16px;text-align:center;'>
        This is an automated alert from AI-SOC Platform
      </p>
    </div>
  </div>
</body>
</html>
"""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[AI-SOC] {severity.upper()} Alert: {ttype} from {source_ip}"
        msg["From"] = self._email_user
        msg["To"] = ", ".join(recipients)
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(self._email_host, self._email_port) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(self._email_user, self._email_password)
            smtp.sendmail(self._email_user, recipients, msg.as_string())
        logger.info("Email alert sent to %s for %s", recipients, ttype)
