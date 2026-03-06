"""
Brute-force login attack detector.
Threshold: 5+ failed login attempts in 5 minutes from the same source IP.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional


class BruteForceDetector:
    WINDOW_MINUTES: int = 5
    THRESHOLD: int = 5

    def __init__(self):
        # {source_ip: [datetime, ...]}
        self._attempts: Dict[str, List[datetime]] = defaultdict(list)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def record_attempt(self, source_ip: str, timestamp: Optional[datetime] = None) -> None:
        """Record a single failed login attempt."""
        ts = timestamp or datetime.utcnow()
        self._attempts[source_ip].append(ts)
        self._prune(source_ip)

    def detect(
        self,
        log_entries: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Analyse a batch of log entries and return brute-force verdict.

        Each entry should contain:
            source_ip  : str
            success    : bool  (True = successful login)
            timestamp  : str | datetime (optional)
            username   : str  (optional)
        """
        # Aggregate failures per IP from the batch
        ip_failures: Dict[str, int] = defaultdict(int)
        ip_targets: Dict[str, set] = defaultdict(set)

        for entry in log_entries:
            if entry.get("success", True):
                continue
            ip = entry.get("source_ip", "")
            if not ip:
                continue
            ts = self._parse_ts(entry.get("timestamp"))
            self.record_attempt(ip, ts)
            ip_failures[ip] += 1
            if uname := entry.get("username"):
                ip_targets[ip].add(uname)

        # Evaluate
        detections = []
        for ip, count in ip_failures.items():
            windowed = self._count_in_window(ip)
            if windowed >= self.THRESHOLD:
                detections.append({
                    "source_ip": ip,
                    "attempt_count": windowed,
                    "target_accounts": list(ip_targets.get(ip, [])),
                })

        if detections:
            top = max(detections, key=lambda d: d["attempt_count"])
            return {
                "detected": True,
                "attempt_count": top["attempt_count"],
                "source_ip": top["source_ip"],
                "target_account": top["target_accounts"][0] if top["target_accounts"] else "unknown",
                "all_detections": detections,
                "severity": "high" if top["attempt_count"] >= 20 else "medium",
            }

        return {"detected": False, "attempt_count": 0, "source_ip": "", "target_account": ""}

    def check_ip(self, source_ip: str) -> Dict[str, Any]:
        """Check whether a single IP is currently in a brute-force state."""
        count = self._count_in_window(source_ip)
        detected = count >= self.THRESHOLD
        return {
            "detected": detected,
            "attempt_count": count,
            "source_ip": source_ip,
            "severity": "high" if count >= 20 else "medium" if detected else "low",
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _prune(self, ip: str) -> None:
        cutoff = datetime.utcnow() - timedelta(minutes=self.WINDOW_MINUTES)
        self._attempts[ip] = [t for t in self._attempts[ip] if t >= cutoff]

    def _count_in_window(self, ip: str) -> int:
        self._prune(ip)
        return len(self._attempts[ip])

    @staticmethod
    def _parse_ts(ts) -> datetime:
        if isinstance(ts, datetime):
            return ts
        if isinstance(ts, str):
            try:
                return datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except ValueError:
                pass
        return datetime.utcnow()
