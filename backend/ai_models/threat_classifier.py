"""
RandomForest-based threat classifier.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler

logger = logging.getLogger(__name__)

THREAT_CLASSES = [
    "brute_force",
    "phishing",
    "port_scan",
    "malware",
    "suspicious_behavior",
    "sql_injection",
    "xss",
    "ddos",
    "ransomware",
    "normal",
]

# Feature order for classify()
FEATURES = [
    "failed_logins",       # count in window
    "distinct_ports",      # ports touched
    "bytes_out",           # outbound bytes (KB)
    "request_rate",        # requests per second
    "error_rate",          # HTTP 4xx/5xx ratio
    "unique_urls",         # unique URLs accessed
    "payload_size",        # avg payload bytes
    "duration_ms",         # connection duration
]


class ThreatClassifier:
    def __init__(self, n_estimators: int = 100):
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            random_state=42,
            class_weight="balanced",
        )
        self.scaler = StandardScaler()
        self.label_enc = LabelEncoder()
        self.label_enc.fit(THREAT_CLASSES)
        self._trained = False
        self._train_synthetic()

    # ------------------------------------------------------------------
    # Synthetic training
    # ------------------------------------------------------------------

    def _synthetic_dataset(self) -> Tuple[np.ndarray, np.ndarray]:
        rng = np.random.default_rng(42)
        rows: List[List[float]] = []
        labels: List[str] = []

        def add(n, label, **kw):
            # Pre-generate array kwargs into lists of length n
            resolved: Dict[str, list] = {}
            defaults = {
                "failed_logins": lambda: float(rng.integers(0, 3)),
                "distinct_ports": lambda: float(rng.integers(1, 5)),
                "bytes_out": lambda: float(rng.normal(50, 20)),
                "request_rate": lambda: float(rng.normal(2, 1)),
                "error_rate": lambda: float(rng.uniform(0, 0.05)),
                "unique_urls": lambda: float(rng.integers(1, 10)),
                "payload_size": lambda: float(rng.normal(512, 200)),
                "duration_ms": lambda: float(rng.normal(200, 80)),
            }
            feat_names = list(defaults.keys())
            for feat in feat_names:
                if feat in kw:
                    val = kw[feat]
                    if hasattr(val, "__len__") and not isinstance(val, str):
                        resolved[feat] = [float(v) for v in val]
                    else:
                        resolved[feat] = [float(val)] * n
                else:
                    resolved[feat] = [defaults[feat]() for _ in range(n)]
            for i in range(n):
                rows.append([resolved[f][i] for f in feat_names])
                labels.append(label)

        add(300, "normal")
        add(200, "brute_force",
            failed_logins=rng.integers(10, 100, 200).tolist(),
            distinct_ports=rng.integers(1, 3, 200).tolist(),
            request_rate=rng.normal(15, 5, 200).tolist())
        add(150, "port_scan",
            distinct_ports=rng.integers(50, 1024, 150).tolist(),
            duration_ms=rng.normal(50, 20, 150).tolist(),
            bytes_out=rng.normal(5, 2, 150).tolist())
        add(150, "phishing",
            unique_urls=rng.integers(1, 3, 150).tolist(),
            payload_size=rng.normal(5000, 1000, 150).tolist(),
            error_rate=rng.uniform(0, 0.02, 150).tolist())
        add(150, "malware",
            bytes_out=rng.normal(5000, 1000, 150).tolist(),
            duration_ms=rng.normal(10000, 3000, 150).tolist())
        add(100, "ddos",
            request_rate=rng.normal(500, 100, 100).tolist(),
            bytes_out=rng.normal(100, 30, 100).tolist())
        add(100, "sql_injection",
            error_rate=rng.uniform(0.3, 0.9, 100).tolist(),
            unique_urls=rng.integers(1, 5, 100).tolist())
        add(100, "xss",
            payload_size=rng.normal(2000, 500, 100).tolist(),
            error_rate=rng.uniform(0.1, 0.5, 100).tolist())
        add(100, "ransomware",
            bytes_out=rng.normal(100_000, 20_000, 100).tolist(),
            duration_ms=rng.normal(50_000, 10_000, 100).tolist())
        add(100, "suspicious_behavior",
            failed_logins=rng.integers(3, 10, 100).tolist(),
            bytes_out=rng.normal(2000, 500, 100).tolist())

        X = np.array(rows, dtype=float)
        y = np.array(labels)
        return X, y

    def _train_synthetic(self) -> None:
        X, y = self._synthetic_dataset()
        X_scaled = self.scaler.fit_transform(X)
        y_enc = self.label_enc.transform(y)
        self.model.fit(X_scaled, y_enc)
        self._trained = True
        logger.debug("ThreatClassifier trained on %d synthetic samples", len(y))

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def train(self, data: List[Dict[str, Any]], labels: List[str]) -> None:
        """Re-train on provided labelled data."""
        X = np.array([[float(row.get(f, 0)) for f in FEATURES] for row in data])
        X_scaled = self.scaler.fit_transform(X)
        y_enc = self.label_enc.transform(labels)
        self.model.fit(X_scaled, y_enc)
        self._trained = True
        logger.info("ThreatClassifier re-trained on %d samples", len(labels))

    def _feature_array(self, features: Dict[str, Any]) -> np.ndarray:
        row = [float(features.get(f, 0)) for f in FEATURES]
        return np.array(row).reshape(1, -1)

    def classify(self, features: Dict[str, Any]) -> str:
        """Return the most-likely threat class label."""
        arr = self._feature_array(features)
        scaled = self.scaler.transform(arr)
        pred = self.model.predict(scaled)[0]
        return self.label_enc.inverse_transform([pred])[0]

    def get_confidence(self, features: Dict[str, Any]) -> Dict[str, float]:
        """Return a probability dict {class: probability} for all classes."""
        arr = self._feature_array(features)
        scaled = self.scaler.transform(arr)
        proba = self.model.predict_proba(scaled)[0]
        classes = self.label_enc.inverse_transform(self.model.classes_)
        return {cls: round(float(p), 4) for cls, p in zip(classes, proba)}

    def classify_with_confidence(self, features: Dict[str, Any]) -> Dict[str, Any]:
        confidences = self.get_confidence(features)
        best_class = max(confidences, key=confidences.get)
        return {
            "threat_type": str(best_class),
            "confidence": float(confidences[best_class]),
            "all_probabilities": {str(k): float(v) for k, v in confidences.items()},
        }
