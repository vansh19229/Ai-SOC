"""
User-behaviour analytics (UBA) – detect anomalous activity patterns.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional


class UserBehaviorAnalyzer:
    """
    Rule-based + scoring UBA engine.

    Checks performed:
        1. Unusual login hours (outside 07:00-22:00 local)
        2. Simultaneous sessions from different geo-locations
        3. Excessive failed logins (>3 in a session context)
        4. High-volume data access / downloads
        5. Access to sensitive resources outside normal role
    """

    NORMAL_HOUR_START = 7   # UTC 07:00
    NORMAL_HOUR_END = 22    # UTC 22:00  (all times expected in UTC)
    MAX_DOWNLOADS_MB = 500
    MAX_FAILED_LOGINS = 3

    def analyze(self, user_activity: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyse a single user activity snapshot.

        Expected keys (all optional):
            username          : str
            login_hour        : int  0-23
            login_locations   : list[str]
            failed_logins     : int
            data_accessed_mb  : float
            resources_accessed: list[str]
            role              : str
            last_known_ip     : str
            current_ip        : str
        """
        anomalies: List[str] = []
        score = 0

        # 1. Unusual hours
        hour = user_activity.get("login_hour")
        if hour is not None:
            if not (self.NORMAL_HOUR_START <= hour <= self.NORMAL_HOUR_END):
                anomalies.append(f"Login at unusual hour: {hour:02d}:00")
                score += 25

        # 2. Multiple locations
        locations = user_activity.get("login_locations", [])
        if len(set(locations)) > 1:
            anomalies.append(f"Login from multiple locations: {', '.join(set(locations))}")
            score += 30

        # 3. Excessive failed logins
        failed = user_activity.get("failed_logins", 0)
        if failed > self.MAX_FAILED_LOGINS:
            anomalies.append(f"Excessive failed logins: {failed}")
            score += min(40, failed * 5)

        # 4. High data volume
        data_mb = user_activity.get("data_accessed_mb", 0)
        if data_mb > self.MAX_DOWNLOADS_MB:
            anomalies.append(f"High data volume accessed: {data_mb:.0f} MB")
            score += min(30, int(data_mb / 100))

        # 5. IP change
        last_ip = user_activity.get("last_known_ip", "")
        current_ip = user_activity.get("current_ip", "")
        if last_ip and current_ip and last_ip != current_ip:
            if not self._same_subnet(last_ip, current_ip):
                anomalies.append(f"IP address changed: {last_ip} → {current_ip}")
                score += 20

        # 6. Sensitive resource access
        role = user_activity.get("role", "viewer")
        resources = user_activity.get("resources_accessed", [])
        if role == "viewer" and any(r for r in resources if "admin" in r.lower()):
            anomalies.append("Viewer role accessed admin resources")
            score += 35

        score = min(100, score)
        return {
            "anomaly_detected": len(anomalies) > 0,
            "behavior_score": score,
            "risk_level": self._score_to_risk(score),
            "anomalies": anomalies,
            "username": user_activity.get("username", "unknown"),
        }

    def analyze_batch(self, activities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [self.analyze(a) for a in activities]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _same_subnet(ip1: str, ip2: str) -> bool:
        try:
            parts1 = ip1.split(".")[:3]
            parts2 = ip2.split(".")[:3]
            return parts1 == parts2
        except Exception:
            return False

    @staticmethod
    def _score_to_risk(score: int) -> str:
        if score >= 75:
            return "critical"
        if score >= 50:
            return "high"
        if score >= 25:
            return "medium"
        return "low"
