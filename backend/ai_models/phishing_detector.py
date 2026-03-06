"""
NLP-based phishing email detector using TF-IDF + LogisticRegression.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Indicator keyword lists
# ---------------------------------------------------------------------------
_URGENCY_WORDS = [
    "urgent", "immediately", "action required", "expires", "deadline",
    "limited time", "act now", "respond immediately", "24 hours", "verify now",
    "confirm now", "suspension", "suspended", "locked", "account closed",
]
_CREDENTIAL_WORDS = [
    "password", "username", "login", "sign in", "credentials",
    "social security", "credit card", "bank account", "account number",
    "pin number", "security code",
]
_LINK_WORDS = [
    "click here", "click below", "follow this link", "access here",
    "verify your", "update your", "confirm your",
]
_IMPERSONATION_WORDS = [
    "paypal", "amazon", "apple", "microsoft", "google", "irs", "fbi",
    "bank of america", "chase bank", "wells fargo", "netflix", "ebay",
]

# ---------------------------------------------------------------------------
# Synthetic training corpus
# ---------------------------------------------------------------------------
_PHISHING_SAMPLES = [
    "URGENT: Your account has been compromised. Click here immediately to verify your credentials.",
    "Dear customer, your PayPal account has been suspended. Verify your information now.",
    "You have won a $1000 Amazon gift card! Click the link below to claim your prize.",
    "IRS Notice: You have a pending tax refund. Provide your bank account details to receive it.",
    "Your Microsoft account will be deleted in 24 hours. Sign in to prevent suspension.",
    "Security Alert: Unusual activity detected. Confirm your password immediately.",
    "Your Apple ID has been locked. Update your information to restore access.",
    "Congratulations! You've been selected for a free iPhone. Click here to claim.",
    "ACTION REQUIRED: Verify your email address or your account will be suspended.",
    "Your Netflix subscription failed. Update your payment information to continue.",
    "FBI Warning: Your computer has been infected. Call this number immediately.",
    "Dear user, your bank account shows suspicious activity. Log in now to secure.",
    "Limited offer: Get 90% discount. Only 24 hours left. Click here to buy now.",
    "Your credit card has been charged $500. If you didn't authorize this, click here.",
    "Google security alert: Someone has your password. Change it now to protect your account.",
    "Chase Bank: Your account will be closed. Provide your credentials to keep it active.",
    "You have a pending package delivery. Pay the customs fee to release it.",
    "Verify your social security number to avoid account suspension.",
    "FINAL NOTICE: Pay your overdue balance immediately or face legal action.",
    "Your iCloud storage is full. Click here to upgrade your plan now.",
]
_LEGIT_SAMPLES = [
    "Hi team, please find attached the quarterly report for your review.",
    "Meeting reminder: Project kickoff at 2 PM in conference room B.",
    "The deployment to production has been completed successfully.",
    "Please review the pull request and provide your feedback.",
    "Welcome to the company! Here are the onboarding documents.",
    "Your expense report has been approved and payment is being processed.",
    "Monthly newsletter: Top stories from our engineering blog.",
    "Your order #12345 has been shipped. Expected delivery: Thursday.",
    "Thank you for your purchase. Your receipt is attached.",
    "The weekly backup has completed. All systems are operating normally.",
    "New feature released: Check out the updated dashboard in v2.3.",
    "Team lunch is scheduled for Friday at noon. Please RSVP.",
    "Your vacation request for Dec 25-Jan 1 has been approved.",
    "Code review completed. Two minor comments, no blocking issues.",
    "Reminder: Complete your annual performance review by end of month.",
    "The security patch has been applied to all production servers.",
    "Your password has been changed successfully as requested.",
    "Invoice #4567 from Vendor Corp for $2,450 is ready for approval.",
    "Project documentation has been updated in Confluence.",
    "Happy birthday! The team has organised a small celebration for you.",
]


_AUGMENT_FACTOR = 10  # number of times to repeat each sample class during training


class PhishingDetector:
    def __init__(self):
        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=5000,
                sublinear_tf=True,
            )),
            ("clf", LogisticRegression(random_state=42, max_iter=1000)),
        ])
        self._trained = False
        self._train_synthetic()

    def _train_synthetic(self) -> None:
        # Augment with small variations
        texts = _PHISHING_SAMPLES * _AUGMENT_FACTOR + _LEGIT_SAMPLES * _AUGMENT_FACTOR
        labels = [1] * (len(_PHISHING_SAMPLES) * _AUGMENT_FACTOR) + [0] * (len(_LEGIT_SAMPLES) * _AUGMENT_FACTOR)
        self.pipeline.fit(texts, labels)
        self._trained = True
        logger.debug("PhishingDetector trained on %d samples", len(texts))

    def train(self, texts: List[str], labels: List[int]) -> None:
        self.pipeline.fit(texts, labels)
        self._trained = True
        logger.info("PhishingDetector re-trained on %d samples", len(texts))

    def analyze_email(self, text: str) -> Dict[str, Any]:
        proba = self.pipeline.predict_proba([text])[0]
        phishing_prob = float(proba[1])
        score = round(phishing_prob * 100, 1)
        indicators = self.get_phishing_indicators(text)
        return {
            "is_phishing": phishing_prob >= 0.5,
            "phishing_score": score,
            "confidence": round(max(proba), 4),
            "indicators": indicators,
            "risk_level": self._score_to_risk(score),
        }

    def get_phishing_indicators(self, text: str) -> List[str]:
        lower = text.lower()
        found: List[str] = []

        for word in _URGENCY_WORDS:
            if word in lower:
                found.append(f"Urgency language: '{word}'")

        for word in _CREDENTIAL_WORDS:
            if word in lower:
                found.append(f"Credential request: '{word}'")

        for word in _LINK_WORDS:
            if word in lower:
                found.append(f"Suspicious CTA: '{word}'")

        for word in _IMPERSONATION_WORDS:
            if word in lower:
                found.append(f"Brand impersonation: '{word}'")

        # URL pattern check
        urls = re.findall(r"https?://\S+", text)
        for url in urls:
            if any(kw in url.lower() for kw in ["bit.ly", "tinyurl", "t.co", "goo.gl"]):
                found.append(f"Shortened URL detected: {url}")
            if re.search(r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", url):
                found.append(f"IP address in URL: {url}")

        return list(dict.fromkeys(found))  # deduplicate while preserving order

    @staticmethod
    def _score_to_risk(score: float) -> str:
        if score >= 80:
            return "critical"
        if score >= 60:
            return "high"
        if score >= 40:
            return "medium"
        return "low"
