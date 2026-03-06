"""
Port-scan detector.
Threshold: 10+ distinct destination ports from the same source IP within 60 seconds.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set


class PortScanDetector:
    WINDOW_SECONDS: int = 60
    THRESHOLD: int = 10

    def __init__(self):
        # {source_ip: [(datetime, port), ...]}
        self._events: Dict[str, List[tuple]] = defaultdict(list)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def record_connection(
        self,
        source_ip: str,
        dest_port: int,
        timestamp: Optional[datetime] = None,
    ) -> None:
        ts = timestamp or datetime.utcnow()
        self._events[source_ip].append((ts, dest_port))
        self._prune(source_ip)

    def detect(self, log_entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyse a batch of network log entries.

        Each entry should have:
            source_ip : str
            dest_port : int
            timestamp : str | datetime (optional)
        """
        for entry in log_entries:
            ip = entry.get("source_ip", "")
            port = entry.get("dest_port") or entry.get("port")
            if not ip or port is None:
                continue
            ts = self._parse_ts(entry.get("timestamp"))
            self.record_connection(ip, int(port), ts)

        detections = []
        for ip in list(self._events.keys()):
            ports = self._ports_in_window(ip)
            if len(ports) >= self.THRESHOLD:
                detections.append({
                    "source_ip": ip,
                    "scanned_ports": sorted(ports),
                    "port_count": len(ports),
                })

        if detections:
            top = max(detections, key=lambda d: d["port_count"])
            return {
                "detected": True,
                "source_ip": top["source_ip"],
                "scanned_ports": top["scanned_ports"],
                "port_count": top["port_count"],
                "scan_type": self._classify_scan(top["scanned_ports"]),
                "severity": "high" if top["port_count"] >= 100 else "medium",
                "all_detections": detections,
            }

        return {
            "detected": False,
            "source_ip": "",
            "scanned_ports": [],
            "port_count": 0,
            "scan_type": "none",
        }

    def check_ip(self, source_ip: str) -> Dict[str, Any]:
        ports = self._ports_in_window(source_ip)
        detected = len(ports) >= self.THRESHOLD
        return {
            "detected": detected,
            "source_ip": source_ip,
            "scanned_ports": sorted(ports),
            "port_count": len(ports),
            "scan_type": self._classify_scan(sorted(ports)) if detected else "none",
            "severity": "high" if len(ports) >= 100 else "medium" if detected else "low",
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _prune(self, ip: str) -> None:
        cutoff = datetime.utcnow() - timedelta(seconds=self.WINDOW_SECONDS)
        self._events[ip] = [(t, p) for t, p in self._events[ip] if t >= cutoff]

    def _ports_in_window(self, ip: str) -> Set[int]:
        self._prune(ip)
        return {p for _, p in self._events[ip]}

    @staticmethod
    def _classify_scan(ports: List[int]) -> str:
        if not ports:
            return "none"
        well_known = [p for p in ports if p <= 1023]
        if len(well_known) / max(len(ports), 1) > 0.7:
            return "well_known_port_scan"
        if max(ports) - min(ports) == len(ports) - 1:
            return "sequential_scan"
        return "random_scan"

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
