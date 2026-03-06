"""
Account manager – simulate enabling/disabling user accounts.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

_accounts: Dict[str, Dict[str, Any]] = {}


class AccountManager:
    def __init__(self):
        self._accounts = _accounts

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def disable_account(self, username: str, reason: str = "security_policy") -> Dict[str, Any]:
        entry = self._accounts.setdefault(username, {"username": username, "status": "active"})
        if entry["status"] == "disabled":
            return {"success": False, "message": f"Account '{username}' is already disabled"}
        entry["status"] = "disabled"
        entry["disabled_at"] = datetime.utcnow().isoformat()
        entry["reason"] = reason
        logger.info("Account disabled: %s (reason: %s)", username, reason)
        return {
            "success": True,
            "message": f"Account '{username}' has been disabled",
            "username": username,
        }

    def enable_account(self, username: str) -> Dict[str, Any]:
        entry = self._accounts.get(username)
        if not entry or entry.get("status") != "disabled":
            return {"success": False, "message": f"Account '{username}' is not disabled"}
        entry["status"] = "active"
        entry["enabled_at"] = datetime.utcnow().isoformat()
        logger.info("Account enabled: %s", username)
        return {
            "success": True,
            "message": f"Account '{username}' has been re-enabled",
            "username": username,
        }

    def get_status(self, username: str) -> Dict[str, Any]:
        return self._accounts.get(username, {"username": username, "status": "unknown"})

    def list_disabled(self) -> List[str]:
        return [u for u, d in self._accounts.items() if d.get("status") == "disabled"]
