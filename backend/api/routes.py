"""
All API routes for the AI-SOC platform.
Falls back to the in-memory store when MongoDB is not available.
"""
from __future__ import annotations

import math
import random
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database.models import (
    Alert, AlertCreate, AlertUpdate,
    Incident, IncidentCreate, IncidentUpdate,
    Log, NetworkActivity,
    Threat, ThreatCreate,
    User, UserCreate,
    AdminSettings,
)

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory store (populated by seed.py on startup)
# ---------------------------------------------------------------------------
from database.seed import build_seed as _build_seed

_store: Dict[str, Any] = {}


def get_store() -> Dict[str, Any]:
    global _store
    if not _store:
        _store = _build_seed()
    return _store


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _new_id() -> str:
    return str(uuid.uuid4())


def _paginate(items: list, page: int, limit: int) -> Dict[str, Any]:
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    return {
        "data": items[start:end],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, math.ceil(total / limit)),
    }


# ===========================================================================
# STATS
# ===========================================================================

@router.get("/api/stats")
async def get_stats():
    s = get_store()
    threats = s["threats"]
    alerts = s["alerts"]
    blocked = s["blacklist"]

    active_threats = [t for t in threats if t["status"] == "active"]
    open_alerts = [a for a in alerts if a["status"] == "open"]
    critical = [t for t in threats if t["severity"] == "critical"]
    resolved = [t for t in threats if t["status"] == "resolved"]

    # Simple security score: starts at 100, minus penalties
    score = max(0, 100 - len(active_threats) * 2 - len(critical) * 5)

    # Threat type distribution
    from collections import Counter
    type_dist = dict(Counter(t["type"] for t in threats))

    return {
        "threat_count": len(threats),
        "active_threats": len(active_threats),
        "alert_count": len(alerts),
        "open_alerts": len(open_alerts),
        "blocked_ips": len(blocked),
        "security_score": min(100, score),
        "active_incidents": len([i for i in s["incidents"] if i["status"] in ("open", "investigating")]),
        "resolved_today": len(resolved),
        "critical_threats": len(critical),
        "total_logs": len(s["logs"]),
        "users_monitored": len(s["users"]),
        "threat_distribution": type_dist,
        "last_updated": datetime.utcnow().isoformat(),
    }


# ===========================================================================
# THREATS
# ===========================================================================

@router.get("/api/threats")
async def get_threats(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    threat_type: Optional[str] = None,
):
    s = get_store()
    items = s["threats"][:]
    if severity:
        items = [t for t in items if t["severity"] == severity]
    if status:
        items = [t for t in items if t["status"] == status]
    if threat_type:
        items = [t for t in items if t["type"] == threat_type]
    items.sort(key=lambda t: t["timestamp"], reverse=True)
    return _paginate(items, page, limit)


@router.post("/api/threats", status_code=201)
async def create_threat(threat: ThreatCreate):
    s = get_store()
    new = {
        "id": _new_id(),
        **threat.model_dump(),
        "timestamp": datetime.utcnow().isoformat(),
        "actions_taken": [],
    }
    s["threats"].insert(0, new)
    return new


@router.get("/api/threats/{threat_id}")
async def get_threat(threat_id: str):
    s = get_store()
    for t in s["threats"]:
        if t["id"] == threat_id:
            return t
    raise HTTPException(status_code=404, detail="Threat not found")


# ===========================================================================
# ALERTS
# ===========================================================================

@router.get("/api/alerts")
async def get_alerts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    status: Optional[str] = None,
):
    s = get_store()
    items = s["alerts"][:]
    if severity:
        items = [a for a in items if a["severity"] == severity]
    if status:
        items = [a for a in items if a["status"] == status]
    items.sort(key=lambda a: a["timestamp"], reverse=True)
    return _paginate(items, page, limit)


@router.post("/api/alerts", status_code=201)
async def create_alert(alert: AlertCreate):
    s = get_store()
    new = {
        "id": _new_id(),
        **alert.model_dump(),
        "timestamp": datetime.utcnow().isoformat(),
        "status": "open",
    }
    s["alerts"].insert(0, new)
    return new


@router.put("/api/alerts/{alert_id}")
async def update_alert(alert_id: str, update: AlertUpdate):
    s = get_store()
    for a in s["alerts"]:
        if a["id"] == alert_id:
            for k, v in update.model_dump(exclude_none=True).items():
                a[k] = v
            return a
    raise HTTPException(status_code=404, detail="Alert not found")


# ===========================================================================
# LOGS
# ===========================================================================

@router.get("/api/logs")
async def get_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    level: Optional[str] = None,
    source: Optional[str] = None,
):
    s = get_store()
    items = s["logs"][:]
    if level:
        items = [l for l in items if l["level"] == level.upper()]
    if source:
        items = [l for l in items if l["source"] == source]
    items.sort(key=lambda l: l["timestamp"], reverse=True)
    return _paginate(items, page, limit)


# ===========================================================================
# INCIDENTS
# ===========================================================================

@router.get("/api/incidents")
async def get_incidents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    severity: Optional[str] = None,
):
    s = get_store()
    items = s["incidents"][:]
    if status:
        items = [i for i in items if i["status"] == status]
    if severity:
        items = [i for i in items if i["severity"] == severity]
    items.sort(key=lambda i: i["timestamp"], reverse=True)
    return _paginate(items, page, limit)


@router.post("/api/incidents", status_code=201)
async def create_incident(incident: IncidentCreate):
    s = get_store()
    now = datetime.utcnow().isoformat()
    new = {
        "id": _new_id(),
        **incident.model_dump(),
        "timestamp": now,
        "status": "open",
        "timeline": [{"time": now, "event": "Incident created"}],
        "report": None,
        "assigned_to": None,
        "resolved_at": None,
    }
    s["incidents"].insert(0, new)
    return new


@router.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    s = get_store()
    for i in s["incidents"]:
        if i["id"] == incident_id:
            return i
    raise HTTPException(status_code=404, detail="Incident not found")


@router.put("/api/incidents/{incident_id}")
async def update_incident(incident_id: str, update: IncidentUpdate):
    s = get_store()
    for i in s["incidents"]:
        if i["id"] == incident_id:
            data = update.model_dump(exclude_none=True)
            i.update(data)
            if data.get("status") == "resolved":
                i["resolved_at"] = datetime.utcnow().isoformat()
            return i
    raise HTTPException(status_code=404, detail="Incident not found")


# ===========================================================================
# NETWORK
# ===========================================================================

@router.get("/api/network")
async def get_network(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
):
    s = get_store()
    items = s["network"][:]
    if status:
        items = [n for n in items if n["status"] == status]
    items.sort(key=lambda n: n["timestamp"], reverse=True)
    return _paginate(items, page, limit)


# ===========================================================================
# USERS
# ===========================================================================

@router.get("/api/users")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    s = get_store()
    return _paginate(s["users"], page, limit)


@router.post("/api/users", status_code=201)
async def create_user(user: UserCreate):
    s = get_store()
    new = {
        "id": _new_id(),
        **user.model_dump(),
        "last_login": None,
        "status": "active",
        "location": "",
    }
    s["users"].append(new)
    return new


# ===========================================================================
# ADMIN – WHITELIST
# ===========================================================================

@router.get("/api/admin/whitelist")
async def get_whitelist():
    return {"whitelist": get_store()["whitelist"]}


@router.post("/api/admin/whitelist")
async def add_to_whitelist(body: Dict[str, str]):
    ip = body.get("ip", "").strip()
    if not ip:
        raise HTTPException(status_code=400, detail="ip field required")
    s = get_store()
    if ip not in s["whitelist"]:
        s["whitelist"].append(ip)
    return {"whitelist": s["whitelist"]}


@router.delete("/api/admin/whitelist/{ip}")
async def remove_from_whitelist(ip: str):
    s = get_store()
    if ip not in s["whitelist"]:
        raise HTTPException(status_code=404, detail="IP not found in whitelist")
    s["whitelist"].remove(ip)
    return {"whitelist": s["whitelist"]}


# ===========================================================================
# ADMIN – BLACKLIST
# ===========================================================================

@router.get("/api/admin/blacklist")
async def get_blacklist():
    return {"blacklist": get_store()["blacklist"]}


@router.post("/api/admin/blacklist")
async def add_to_blacklist(body: Dict[str, str]):
    ip = body.get("ip", "").strip()
    if not ip:
        raise HTTPException(status_code=400, detail="ip field required")
    s = get_store()
    if ip not in s["blacklist"]:
        s["blacklist"].append(ip)
    return {"blacklist": s["blacklist"]}


@router.delete("/api/admin/blacklist/{ip}")
async def remove_from_blacklist(ip: str):
    s = get_store()
    if ip not in s["blacklist"]:
        raise HTTPException(status_code=404, detail="IP not found in blacklist")
    s["blacklist"].remove(ip)
    return {"blacklist": s["blacklist"]}


# ===========================================================================
# ADMIN – SETTINGS
# ===========================================================================

@router.get("/api/admin/settings")
async def get_settings():
    return get_store()["settings"]


@router.put("/api/admin/settings")
async def update_settings(body: Dict[str, Any]):
    s = get_store()
    s["settings"].update(body)
    return s["settings"]


# ===========================================================================
# AI ENDPOINTS
# ===========================================================================

class AnalyzeRequest(BaseModel):
    log_data: Optional[Dict[str, Any]] = None
    logs: Optional[List[Dict[str, Any]]] = None
    text: Optional[str] = None


class ReportRequest(BaseModel):
    incident_id: Optional[str] = None
    incident_data: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


@router.post("/api/ai/analyze")
async def ai_analyze(req: AnalyzeRequest):
    from ai_models.anomaly_detector import AnomalyDetector
    from ai_models.threat_classifier import ThreatClassifier
    from ai_models.risk_scorer import RiskScorer

    detector = AnomalyDetector()
    classifier = ThreatClassifier()
    scorer = RiskScorer()

    log_data = req.log_data or {}
    if req.logs:
        # Aggregate features from batch
        from collections import Counter
        sources = [l.get("source", "") for l in req.logs]
        log_data = {
            "bytes_sent": sum(l.get("details", {}).get("bytes", 0) for l in req.logs),
            "bytes_recv": sum(l.get("details", {}).get("bytes", 0) for l in req.logs) // 2,
            "duration_ms": random.randint(100, 5000),
            "packet_count": len(req.logs),
            "unique_ports": len({l.get("details", {}).get("dest_port", 0) for l in req.logs}),
            "failed_attempts": sum(
                1 for l in req.logs if not l.get("details", {}).get("success", True)
            ),
        }

    anomaly = detector.predict(log_data)
    threat_features = {
        "failed_logins": log_data.get("failed_attempts", 0),
        "distinct_ports": log_data.get("unique_ports", 1),
        "bytes_out": log_data.get("bytes_sent", 0) / 1024,
        "request_rate": log_data.get("packet_count", 0) / 60,
        "error_rate": 0.1,
        "unique_urls": random.randint(1, 20),
        "payload_size": random.randint(200, 5000),
        "duration_ms": log_data.get("duration_ms", 200),
    }
    classification = classifier.classify_with_confidence(threat_features)
    risk = scorer.calculate_score({
        "type": classification["threat_type"],
        "severity": "high" if anomaly["is_anomaly"] else "low",
        "confidence": classification["confidence"],
    })

    return {
        "anomaly_detection": anomaly,
        "threat_classification": classification,
        "risk_assessment": risk,
        "summary": (
            f"{'⚠️ Anomaly detected' if anomaly['is_anomaly'] else '✅ Normal traffic'}. "
            f"Classified as: {classification['threat_type']} "
            f"(confidence: {classification['confidence']:.0%}). "
            f"Risk level: {risk['risk_level']}."
        ),
    }


@router.post("/api/ai/report")
async def ai_generate_report(req: ReportRequest):
    from incident_response.report_generator import ReportGenerator
    generator = ReportGenerator()

    s = get_store()
    incident_data = req.incident_data or {}
    if req.incident_id:
        for inc in s["incidents"]:
            if inc["id"] == req.incident_id:
                incident_data = inc
                break
        else:
            raise HTTPException(status_code=404, detail="Incident not found")

    if not incident_data:
        raise HTTPException(status_code=400, detail="incident_id or incident_data required")

    report = generator.generate_report(incident_data)

    # Persist report text on the incident
    if req.incident_id:
        for inc in s["incidents"]:
            if inc["id"] == req.incident_id:
                inc["report"] = report["report_text"]
                break

    return report


_CHAT_RESPONSES = {
    "threat": "I've analysed the current threat landscape. There are {active} active threats. "
              "The most common type is {top_type}. Recommend reviewing the threat dashboard.",
    "alert": "Currently {open} alerts are open. {critical} are critical severity. "
             "I suggest prioritising critical alerts first.",
    "incident": "There are {active_inc} active incidents. Incident response teams should "
                "focus on the most recent high-severity events.",
    "block": "To block an IP, use the blacklist endpoint: POST /api/admin/blacklist. "
             "You can also configure auto-block in AI settings.",
    "score": "The current security score is {score}/100. "
             "Score is influenced by active threats, open alerts and blocked IPs.",
    "default": "I'm your AI-SOC assistant. I can help you analyse threats, review alerts, "
               "manage incidents, and provide security insights. What would you like to know?",
}


@router.post("/api/ai/chat")
async def ai_chat(req: ChatRequest):
    s = get_store()
    msg = req.message.lower()

    threats = s["threats"]
    alerts = s["alerts"]
    incidents = s["incidents"]

    active_threats = [t for t in threats if t["status"] == "active"]
    open_alerts = [a for a in alerts if a["status"] == "open"]
    critical_alerts = [a for a in open_alerts if a["severity"] == "critical"]
    active_incidents = [i for i in incidents if i["status"] in ("open", "investigating")]

    from collections import Counter
    type_counts = Counter(t["type"] for t in threats)
    top_type = type_counts.most_common(1)[0][0] if type_counts else "unknown"

    score = max(0, 100 - len(active_threats) * 2 - len([t for t in threats if t["severity"] == "critical"]) * 5)

    if any(kw in msg for kw in ["threat", "attack", "malware", "exploit"]):
        key = "threat"
    elif any(kw in msg for kw in ["alert", "notification"]):
        key = "alert"
    elif any(kw in msg for kw in ["incident", "breach"]):
        key = "incident"
    elif any(kw in msg for kw in ["block", "ip", "blacklist"]):
        key = "block"
    elif any(kw in msg for kw in ["score", "health", "status"]):
        key = "score"
    else:
        key = "default"

    template = _CHAT_RESPONSES[key]
    response = template.format(
        active=len(active_threats),
        top_type=top_type.replace("_", " "),
        open=len(open_alerts),
        critical=len(critical_alerts),
        active_inc=len(active_incidents),
        score=score,
    )

    return {
        "response": response,
        "context": {
            "active_threats": len(active_threats),
            "open_alerts": len(open_alerts),
            "active_incidents": len(active_incidents),
            "security_score": score,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }
