"""
Risk scoring engine – produces a 0-100 risk score and priority ranking.
"""
from __future__ import annotations

from typing import Any, Dict, List

# Severity baseline contributions
_SEVERITY_BASE = {
    "critical": 80,
    "high": 60,
    "medium": 35,
    "low": 15,
}

# Threat-type multipliers (modifier added to base)
_TYPE_MODIFIER = {
    "ransomware": 20,
    "data_exfiltration": 18,
    "malware": 15,
    "ddos": 12,
    "brute_force": 10,
    "sql_injection": 10,
    "phishing": 8,
    "xss": 6,
    "port_scan": 5,
    "suspicious_behavior": 4,
}

# Status modifiers (active threat is worse)
_STATUS_MODIFIER = {
    "active": 10,
    "investigating": 5,
    "contained": -10,
    "resolved": -30,
    "false_positive": -50,
}

# Target importance labels
_TARGET_IMPORTANCE = {
    "critical": 15,   # e.g. domain controller, payment system
    "high": 10,
    "medium": 5,
    "low": 0,
}


class RiskScorer:
    def __init__(self, sensitivity: float = 0.75):
        """
        sensitivity: float 0-1 – higher values amplify the computed score.
        """
        self.sensitivity = max(0.0, min(1.0, sensitivity))

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def calculate_score(self, threat_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inputs (all optional, sensible defaults apply):
            threat_type     : str  – threat category
            severity        : str  – low | medium | high | critical
            status          : str  – active | investigating | resolved …
            frequency       : int  – how many times seen in window
            target_importance: str – low | medium | high | critical
            confidence      : float – model confidence 0-1
        """
        ttype = threat_data.get("type", "suspicious_behavior")
        severity = threat_data.get("severity", "medium")
        status = threat_data.get("status", "active")
        frequency = int(threat_data.get("frequency", 1))
        target_imp = threat_data.get("target_importance", "medium")
        confidence = float(threat_data.get("confidence", 0.75))

        base = _SEVERITY_BASE.get(severity, 35)
        type_mod = _TYPE_MODIFIER.get(ttype, 5)
        status_mod = _STATUS_MODIFIER.get(status, 0)
        target_mod = _TARGET_IMPORTANCE.get(target_imp, 5)

        # Frequency bonus (logarithmic, capped at +20)
        import math
        freq_bonus = min(20, int(math.log1p(frequency) * 5))

        # Confidence scaling (low confidence reduces score)
        conf_factor = 0.6 + 0.4 * confidence  # range [0.6, 1.0]

        raw = (base + type_mod + status_mod + target_mod + freq_bonus) * conf_factor
        # Apply sensitivity
        raw = raw * (0.5 + 0.5 * self.sensitivity)
        score = round(min(100.0, max(0.0, raw)), 1)

        return {
            "risk_score": score,
            "risk_level": self._score_to_level(score),
            "breakdown": {
                "base_score": base,
                "type_modifier": type_mod,
                "status_modifier": status_mod,
                "target_modifier": target_mod,
                "frequency_bonus": freq_bonus,
                "confidence_factor": round(conf_factor, 3),
            },
        }

    def prioritize_alerts(self, alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Score and sort alerts from highest to lowest risk.
        Adds a `risk_score` and `risk_level` key to each alert dict.
        """
        scored = []
        for alert in alerts:
            result = self.calculate_score(alert)
            enriched = {**alert, **result}
            scored.append(enriched)
        scored.sort(key=lambda a: a["risk_score"], reverse=True)
        return scored

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _score_to_level(score: float) -> str:
        if score >= 75:
            return "critical"
        if score >= 50:
            return "high"
        if score >= 25:
            return "medium"
        return "low"
