"""
NLP phishing detection via the PhishingDetector AI model.
"""
from __future__ import annotations

from typing import Any, Dict


class PhishingEngine:
    """
    Thin wrapper used by the detection pipeline.
    Delegates to ai_models.PhishingDetector for the heavy lifting.
    """

    def __init__(self):
        # Lazy import to avoid circular deps and keep startup fast
        from ai_models.phishing_detector import PhishingDetector
        self._model = PhishingDetector()

    def detect(self, email_text: str) -> Dict[str, Any]:
        """
        Analyse an email body / subject for phishing signals.

        Returns:
            is_phishing : bool
            confidence  : float 0-1
            phishing_score : float 0-100
            indicators  : list[str]
            risk_level  : str
        """
        return self._model.analyze_email(email_text)

    def bulk_detect(self, emails: list) -> list:
        """Run detection on a list of email dicts (each must have 'body' key)."""
        results = []
        for email in emails:
            text = email.get("body", email.get("text", str(email)))
            result = self.detect(text)
            result["email_id"] = email.get("id", "")
            results.append(result)
        return results
