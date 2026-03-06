"""
SOAR (Security Orchestration, Automation and Response) engine.
Evaluates detected threats and triggers automated response actions.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List

from incident_response.ip_blocker import IPBlocker
from incident_response.account_manager import AccountManager
from incident_response.notifier import Notifier
from incident_response.report_generator import ReportGenerator

logger = logging.getLogger(__name__)


# Action decision table: {severity: min_actions}
_POLICY = {
    "critical": ["send_alert", "block_ip", "generate_report"],
    "high":     ["send_alert", "block_ip"],
    "medium":   ["send_alert"],
    "low":      ["send_alert"],
}

# Types that may also trigger account actions
_ACCOUNT_TYPES = {"brute_force", "insider_threat", "suspicious_behavior", "data_exfiltration"}


class SOAREngine:
    def __init__(self, auto_block: bool = True, auto_disable_accounts: bool = False):
        self.auto_block = auto_block
        self.auto_disable_accounts = auto_disable_accounts
        self._blocker = IPBlocker()
        self._account_mgr = AccountManager()
        self._notifier = Notifier()
        self._reporter = ReportGenerator()
        self._action_log: List[Dict[str, Any]] = []

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def respond(self, threat: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a threat dict and execute appropriate automated responses.

        Returns:
            actions_taken : list[str]
            status        : str
            details       : dict
        """
        severity = threat.get("severity", "low")
        ttype = threat.get("type", "unknown")
        source_ip = threat.get("source_ip", "")
        target_account = threat.get("target_account", "")

        planned = _POLICY.get(severity, ["send_alert"])
        actions_taken: List[str] = []
        details: Dict[str, Any] = {}

        # --- Always notify ---
        if "send_alert" in planned:
            self._notifier.send_alert(threat)
            actions_taken.append("send_alert")

        # --- Block IP ---
        if "block_ip" in planned and self.auto_block and source_ip:
            result = self._blocker.block_ip(source_ip, reason=f"auto_{ttype}")
            if result["success"]:
                actions_taken.append("block_ip")
                details["blocked_ip"] = source_ip

        # --- Disable account ---
        if (
            self.auto_disable_accounts
            and ttype in _ACCOUNT_TYPES
            and target_account
        ):
            result = self._account_mgr.disable_account(target_account, reason=ttype)
            if result["success"]:
                actions_taken.append("disable_account")
                details["disabled_account"] = target_account

        # --- Generate report for critical/high ---
        if "generate_report" in planned:
            report = self._reporter.generate_report({
                **threat,
                "title": f"Auto-generated: {ttype.replace('_', ' ').title()}",
                "actions_taken": actions_taken,
            })
            actions_taken.append("generate_report")
            details["report_preview"] = report["executive_summary"]

        # Log action
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "threat_type": ttype,
            "severity": severity,
            "source_ip": source_ip,
            "actions_taken": actions_taken,
            "details": details,
        }
        self._action_log.append(log_entry)
        logger.info("SOAR responded to %s/%s: %s", ttype, severity, actions_taken)

        return {
            "actions_taken": actions_taken,
            "status": "completed",
            "details": details,
            "timestamp": log_entry["timestamp"],
        }

    def get_action_log(self, limit: int = 100) -> List[Dict[str, Any]]:
        return list(reversed(self._action_log[-limit:]))
