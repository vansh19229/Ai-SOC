"""
IsolationForest-based anomaly detector for network traffic.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Detect anomalous network events using IsolationForest."""

    FEATURES = [
        "bytes_sent", "bytes_recv", "duration_ms",
        "packet_count", "unique_ports", "failed_attempts",
    ]

    def __init__(self, contamination: float = 0.05, n_estimators: int = 100):
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=42,
        )
        self.scaler = StandardScaler()
        self._trained = False
        self._fit_with_synthetic()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _synthetic_traffic(self, n: int = 2000) -> np.ndarray:
        rng = np.random.default_rng(42)
        normal = np.column_stack([
            rng.normal(50_000, 20_000, n),   # bytes_sent
            rng.normal(80_000, 30_000, n),   # bytes_recv
            rng.normal(200, 80, n),          # duration_ms
            rng.normal(100, 40, n),          # packet_count
            rng.integers(1, 5, n),           # unique_ports
            rng.integers(0, 2, n),           # failed_attempts
        ])
        # Add a handful of artificial anomalies
        anomalies = np.column_stack([
            rng.normal(5_000_000, 500_000, 50),
            rng.normal(100, 50, 50),
            rng.normal(5000, 1000, 50),
            rng.normal(5000, 500, 50),
            rng.integers(50, 1024, 50),
            rng.integers(20, 100, 50),
        ])
        return np.vstack([normal, anomalies])

    def _fit_with_synthetic(self) -> None:
        data = self._synthetic_traffic()
        scaled = self.scaler.fit_transform(data)
        self.model.fit(scaled)
        self._trained = True
        logger.debug("AnomalyDetector fitted on %d synthetic samples", len(data))

    def _to_array(self, data: Dict[str, Any]) -> np.ndarray:
        row = [
            float(data.get("bytes_sent", 0)),
            float(data.get("bytes_recv", 0)),
            float(data.get("duration_ms", 0)),
            float(data.get("packet_count", 0)),
            float(data.get("unique_ports", 1)),
            float(data.get("failed_attempts", 0)),
        ]
        return np.array(row).reshape(1, -1)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fit(self, data: List[Dict[str, Any]]) -> None:
        """Re-train on provided data rows (each dict keyed by FEATURES)."""
        if not data:
            return
        matrix = np.array([[float(row.get(f, 0)) for f in self.FEATURES] for row in data])
        scaled = self.scaler.fit_transform(matrix)
        self.model.fit(scaled)
        self._trained = True
        logger.info("AnomalyDetector re-trained on %d samples", len(data))

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Return anomaly prediction for a single traffic record."""
        arr = self._to_array(data)
        scaled = self.scaler.transform(arr)
        label = self.model.predict(scaled)[0]          # 1 = normal, -1 = anomaly
        score = self.anomaly_score(data)
        is_anomaly = bool(label == -1)
        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": score,
            "severity": self._score_to_severity(score) if is_anomaly else "normal",
        }

    def anomaly_score(self, data: Dict[str, Any]) -> float:
        """
        Return a normalised 0-100 anomaly score (higher = more anomalous).
        IsolationForest decision_function returns negative values for anomalies.
        """
        arr = self._to_array(data)
        scaled = self.scaler.transform(arr)
        raw = self.model.decision_function(scaled)[0]   # usually [-0.5, 0.5]
        # Invert & scale to 0-100
        score = float(np.clip(((-raw) + 0.5) * 100, 0, 100))
        return round(score, 2)

    @staticmethod
    def _score_to_severity(score: float) -> str:
        if score >= 80:
            return "critical"
        if score >= 60:
            return "high"
        if score >= 40:
            return "medium"
        return "low"
