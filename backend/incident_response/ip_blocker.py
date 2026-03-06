"""
IP blocking – in-memory implementation with optional MongoDB persistence.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Set

logger = logging.getLogger(__name__)

# Shared in-process state (also updated from seed data)
_blocked_ips: Dict[str, Dict[str, Any]] = {}


class IPBlocker:
    def __init__(self):
        # Reference the module-level dict so all instances share state
        self._blocked = _blocked_ips

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def block_ip(self, ip: str, reason: str = "manual", source: str = "soar") -> Dict[str, Any]:
        if ip in self._blocked:
            return {"success": False, "message": f"{ip} is already blocked", "ip": ip}
        entry = {
            "ip": ip,
            "reason": reason,
            "source": source,
            "blocked_at": datetime.utcnow().isoformat(),
            "active": True,
        }
        self._blocked[ip] = entry
        logger.info("IP blocked: %s (reason: %s)", ip, reason)
        return {"success": True, "message": f"{ip} has been blocked", "ip": ip, "entry": entry}

    def unblock_ip(self, ip: str) -> Dict[str, Any]:
        if ip not in self._blocked:
            return {"success": False, "message": f"{ip} is not blocked", "ip": ip}
        entry = self._blocked.pop(ip)
        entry["active"] = False
        entry["unblocked_at"] = datetime.utcnow().isoformat()
        logger.info("IP unblocked: %s", ip)
        return {"success": True, "message": f"{ip} has been unblocked", "ip": ip}

    def is_blocked(self, ip: str) -> bool:
        return ip in self._blocked

    def get_blocked_ips(self) -> List[Dict[str, Any]]:
        return list(self._blocked.values())

    def bulk_block(self, ips: List[str], reason: str = "bulk_block") -> Dict[str, Any]:
        blocked = []
        skipped = []
        for ip in ips:
            result = self.block_ip(ip, reason=reason)
            (blocked if result["success"] else skipped).append(ip)
        return {"blocked": blocked, "skipped": skipped}
