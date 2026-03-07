"""
All API routes for the AI-SOC platform.
Falls back to the in-memory store when MongoDB is not available.
"""
from __future__ import annotations

import asyncio
import math
import random
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
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
# WebSocket broadcast for live logs
# ---------------------------------------------------------------------------

_ws_log_clients: List[asyncio.Queue] = []


async def broadcast_log_to_ws(log: Dict[str, Any]) -> None:
    """Broadcast a log entry to all connected WebSocket clients."""
    dead: List[asyncio.Queue] = []
    for q in _ws_log_clients:
        try:
            q.put_nowait(log)
        except asyncio.QueueFull:
            pass
        except Exception:
            dead.append(q)
    for q in dead:
        if q in _ws_log_clients:
            _ws_log_clients.remove(q)


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


# ---------------------------------------------------------------------------
# IP → Geolocation lookup (hardcoded for simulated IPs)
# ---------------------------------------------------------------------------

_IP_GEO: Dict[str, Dict[str, Any]] = {
    "185.220.101.45": {"lat": 51.5074, "lon": -0.1278, "country": "United Kingdom"},
    "91.108.4.200":   {"lat": 55.7558, "lon": 37.6176, "country": "Russia"},
    "198.54.117.200": {"lat": 37.3382, "lon": -121.8863, "country": "United States"},
    "103.21.244.0":   {"lat": 22.3193, "lon": 114.1694, "country": "Hong Kong"},
    "45.33.32.156":   {"lat": 29.9547, "lon": -90.0750, "country": "United States"},
    "172.64.0.0":     {"lat": 37.3860, "lon": -122.0838, "country": "United States"},
    "104.16.0.0":     {"lat": 37.3860, "lon": -122.0838, "country": "United States"},
    "151.101.0.0":    {"lat": 47.6062, "lon": -122.3321, "country": "United States"},
    "77.88.8.8":      {"lat": 55.7558, "lon": 37.6176, "country": "Russia"},
    "94.100.180.1":   {"lat": 55.7558, "lon": 37.6176, "country": "Russia"},
    "1.1.1.1":        {"lat": -33.8688, "lon": 151.2093, "country": "Australia"},
    "8.8.8.8":        {"lat": 37.4056, "lon": -122.0775, "country": "United States"},
    "185.199.108.153":{"lat": 37.7749, "lon": -122.4194, "country": "United States"},
    "140.82.121.4":   {"lat": 37.7749, "lon": -122.4194, "country": "United States"},
    "192.30.255.112": {"lat": 37.7749, "lon": -122.4194, "country": "United States"},
    # From mock-data.ts
    "185.234.219.42": {"lat": 55.7558, "lon": 37.6176, "country": "Russia"},
    "103.42.91.17":   {"lat": 39.9042, "lon": 116.4074, "country": "China"},
    "91.108.4.33":    {"lat": 55.7558, "lon": 37.6176, "country": "Russia"},
    "77.88.44.12":    {"lat": -15.7801, "lon": -47.9292, "country": "Brazil"},
    "198.51.100.10":  {"lat": 39.0392, "lon": 125.7625, "country": "North Korea"},
    "203.0.113.5":    {"lat": 6.5244,  "lon": 3.3792,   "country": "Nigeria"},
    "45.67.89.10":    {"lat": 44.4268, "lon": 26.1025,  "country": "Romania"},
    "34.56.78.90":    {"lat": 37.4056, "lon": -122.0775, "country": "United States"},
    "172.16.254.1":   {"lat": 28.6139, "lon": 77.2090,  "country": "India"},
    "185.156.73.14":  {"lat": 48.8566, "lon": 2.3522,   "country": "France"},
}

# Headquarters / target coordinates (New York)
_HQ_LAT = 40.7128
_HQ_LON = -74.0060


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
# WEBSOCKET – LIVE LOG STREAM
# ===========================================================================

@router.websocket("/api/ws/logs")
async def ws_logs(
    websocket: WebSocket,
    level: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
):
    await websocket.accept()
    queue: asyncio.Queue = asyncio.Queue(maxsize=200)
    _ws_log_clients.append(queue)
    try:
        while True:
            try:
                log = await asyncio.wait_for(queue.get(), timeout=30)
            except asyncio.TimeoutError:
                # Send a ping to keep connection alive
                await websocket.send_json({"type": "ping"})
                continue

            # Apply filters
            if level and log.get("level") != level.upper():
                continue
            if source and log.get("source") != source:
                continue

            log["type"] = "log"
            await websocket.send_json(log)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if queue in _ws_log_clients:
            _ws_log_clients.remove(queue)


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
# ATTACK MAP
# ===========================================================================

@router.get("/api/attack-map")
async def get_attack_map():
    s = get_store()
    threats = s["threats"]

    attacks = []
    seen_ips: Dict[str, int] = {}
    for threat in threats:
        src_ip = threat.get("source_ip", "")
        geo = _IP_GEO.get(src_ip)
        if not geo:
            continue
        seen_ips[src_ip] = seen_ips.get(src_ip, 0) + 1
        attacks.append({
            "id": threat["id"],
            "source_ip": src_ip,
            "source_lat": geo["lat"],
            "source_lon": geo["lon"],
            "source_country": geo["country"],
            "target_lat": _HQ_LAT,
            "target_lon": _HQ_LON,
            "severity": threat["severity"],
            "type": threat["type"],
            "timestamp": threat["timestamp"],
            "description": threat.get("description", ""),
            "status": threat.get("status", "active"),
        })

    # Sort by timestamp descending, return last 50
    attacks.sort(key=lambda a: a["timestamp"], reverse=True)
    return {"attacks": attacks[:50], "total": len(attacks)}


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
# ADMIN – TEST NOTIFICATIONS
# ===========================================================================

@router.post("/api/admin/test-email")
async def test_email():
    s = get_store()
    settings = s["settings"]
    from incident_response.notifier import Notifier
    notifier = Notifier()
    test_threat = {
        "type": "test_notification",
        "severity": "high",
        "source_ip": "127.0.0.1",
        "timestamp": datetime.utcnow().isoformat(),
        "description": "This is a test email from the AI-SOC platform to verify email alerts are working.",
    }
    try:
        notifier._send_email(
            test_threat,
            [r.strip() for r in str(settings.get("email_recipients", "")).split(",") if r.strip()],
        )
        return {"success": True, "message": "Test email sent successfully"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Email send failed: {exc}")


@router.post("/api/admin/test-telegram")
async def test_telegram():
    s = get_store()
    from incident_response.notifier import Notifier
    notifier = Notifier()
    test_threat = {
        "type": "test_notification",
        "severity": "high",
        "source_ip": "127.0.0.1",
        "timestamp": datetime.utcnow().isoformat(),
        "description": "Test message from AI-SOC platform – Telegram alerts are working! 🎉",
    }
    try:
        notifier._send_telegram(test_threat)
        return {"success": True, "message": "Test Telegram message sent successfully"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Telegram send failed: {exc}")


# ===========================================================================
# THREAT INTEL FEED
# NOTE: /stats must be defined before /{indicator} to avoid path conflict
# ===========================================================================

@router.get("/api/threat-intel/stats")
async def get_threat_intel_stats():
    from threat_intelligence.feed import ThreatIntelFeed
    feed = ThreatIntelFeed(get_store())
    return feed.get_stats()


@router.get("/api/threat-intel")
async def get_threat_intel(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    ioc_type: Optional[str] = Query(default=None),
    min_confidence: Optional[int] = Query(default=None, ge=0, le=100),
    source: Optional[str] = None,
    search: Optional[str] = None,
):
    from threat_intelligence.feed import ThreatIntelFeed
    feed = ThreatIntelFeed(get_store())
    return feed.get_feed(
        page=page, limit=limit,
        ioc_type=ioc_type, min_confidence=min_confidence,
        source=source, search=search,
    )


@router.get("/api/threat-intel/{indicator}")
async def check_threat_intel(indicator: str):
    from threat_intelligence.feed import ThreatIntelFeed
    feed = ThreatIntelFeed(get_store())
    return feed.check_indicator(indicator)


@router.post("/api/threat-intel", status_code=201)
async def add_threat_intel(body: Dict[str, Any]):
    if not body.get("value"):
        raise HTTPException(status_code=400, detail="value field required")
    from threat_intelligence.feed import ThreatIntelFeed
    feed = ThreatIntelFeed(get_store())
    return feed.add_indicator(body)


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


class ExplainRequest(BaseModel):
    threat_id: Optional[str] = None
    threat_data: Optional[Dict[str, Any]] = None


# Template-based AI explanations keyed by threat type
_EXPLAIN_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "sql_injection": {
        "explanation": "SQL Injection is an attack where malicious SQL code is inserted into input fields to manipulate the database. The attacker crafts queries to bypass authentication, extract data, or modify records.",
        "technical_details": "The attacker submits crafted input like `' OR 1=1--` to web forms or API parameters. This manipulates the SQL query structure, causing the database to return unintended data or execute unauthorized commands. Classic vectors include login forms, search fields, and URL parameters.",
        "impact": "Complete database compromise, unauthorized access to all records, potential data exfiltration of customer PII and credentials, authentication bypass, and in severe cases, remote code execution via stored procedures.",
        "mitigation": "1. Use parameterized queries / prepared statements. 2. Implement input validation and sanitization. 3. Apply least-privilege database accounts. 4. Enable WAF with SQL injection rules. 5. Regularly audit and test endpoints.",
        "ioc_indicators": ["Payloads containing OR 1=1", "UNION SELECT statements in requests", "SQL keywords in URL parameters", "Repeated 500 errors on form submissions", "Unusual database query patterns in logs"],
        "severity_justification": "High/Critical – SQL injection can lead to full database compromise and data breach, impacting business operations and regulatory compliance (GDPR, PCI-DSS).",
        "similar_threats": ["Blind SQL Injection", "Time-based SQL Injection", "NoSQL Injection", "ORM Injection"],
    },
    "brute_force": {
        "explanation": "A brute force attack systematically tries all possible password combinations to gain unauthorized access. The attacker automates credential guessing against login endpoints.",
        "technical_details": "Automated tools (Hydra, Medusa, custom scripts) rapidly test username/password combinations against SSH, RDP, web login portals, or APIs. Modern attacks use credential stuffing (leaked databases) and password spraying (common passwords across many accounts) to reduce lockout risk.",
        "impact": "Unauthorized account access, lateral movement within the network, privilege escalation if admin accounts are compromised, data theft, and ransomware deployment.",
        "mitigation": "1. Implement account lockout after N failed attempts. 2. Enable MFA on all accounts. 3. Use rate limiting on authentication endpoints. 4. Deploy fail2ban or equivalent. 5. Monitor and alert on repeated failed logins.",
        "ioc_indicators": ["High volume of failed login attempts from single IP", "Login attempts for multiple usernames", "Unusual off-hours authentication activity", "Geographic anomalies in login locations", "Credential stuffing patterns in auth logs"],
        "severity_justification": "High – sustained brute force indicates targeted intrusion attempt. If successful, full account takeover enables further attacks.",
        "similar_threats": ["Credential Stuffing", "Password Spraying", "Dictionary Attack", "Rainbow Table Attack"],
    },
    "phishing": {
        "explanation": "Phishing uses deceptive emails, websites, or messages to trick users into revealing credentials or installing malware. Attackers impersonate trusted entities like banks, IT departments, or executives.",
        "technical_details": "Spear phishing targets specific individuals with personalized lures. Emails contain malicious links to credential-harvesting pages or attachments with macros/exploits. Modern campaigns use HTTPS, legitimate-looking domains, and bypass email security via lookalike domains (typosquatting).",
        "impact": "Credential theft enabling account takeover, malware installation (ransomware, RATs, keyloggers), business email compromise (BEC) leading to financial fraud, and initial access for APT campaigns.",
        "mitigation": "1. Deploy DMARC, DKIM, and SPF email authentication. 2. Conduct regular phishing awareness training. 3. Use email security gateways with sandbox analysis. 4. Implement URL rewriting and scanning. 5. Enable MFA to limit credential theft impact.",
        "ioc_indicators": ["Lookalike domain names", "Unexpected email attachments", "Urgent language requesting credentials", "Mismatched display names and email addresses", "Links to newly registered domains"],
        "severity_justification": "High – phishing is the #1 initial access vector for breaches. Successfully compromised credentials enable wide-ranging attacks.",
        "similar_threats": ["Spear Phishing", "Whaling", "Vishing", "Smishing", "Business Email Compromise"],
    },
    "malware": {
        "explanation": "Malware (malicious software) is designed to disrupt, damage, or gain unauthorized access to systems. It encompasses viruses, trojans, ransomware, spyware, and other hostile programs.",
        "technical_details": "Malware is typically delivered via phishing, drive-by downloads, or exploitation of vulnerabilities. Once executed, it may establish persistence (registry keys, scheduled tasks, service installation), communicate with C2 servers, escalate privileges, and perform its primary objective (encryption, data theft, botnet enrollment).",
        "impact": "System disruption, data encryption (ransomware), credential and data theft, unauthorized network access, botnet enrollment for DDoS attacks, and significant financial and reputational damage.",
        "mitigation": "1. Keep all systems and software updated. 2. Deploy EDR with behavioral detection. 3. Implement application whitelisting. 4. Regularly back up data offline. 5. Segment networks to limit lateral movement.",
        "ioc_indicators": ["Unknown processes with network connections", "Unusual file system activity (mass read/write)", "Registry modifications in startup keys", "Outbound connections to unknown IPs", "High CPU/disk usage by unknown processes"],
        "severity_justification": "Critical – active malware on endpoints represents immediate operational risk, potential data loss, and can spread laterally to compromise the entire network.",
        "similar_threats": ["Ransomware", "Trojan", "Spyware", "Rootkit", "Worm", "Botnet"],
    },
    "ransomware": {
        "explanation": "Ransomware encrypts victim files and demands payment (usually cryptocurrency) for decryption keys. Modern ransomware also exfiltrates data and threatens publication (double extortion).",
        "technical_details": "Ransomware typically uses strong asymmetric encryption (RSA/AES combination). It targets network shares, backup systems, and databases. The encryption process involves generating a unique key pair, encrypting files with AES, encrypting the AES key with attacker's RSA public key, and deleting shadow copies to prevent recovery.",
        "impact": "Complete data loss if no backups, operational downtime (avg. 21 days for recovery), ransom payments ($200K-$5M+ for enterprise), regulatory penalties for data exposure, and severe reputational damage.",
        "mitigation": "1. Maintain offline, air-gapped backups tested regularly. 2. Segment networks and implement least privilege. 3. Deploy EDR with ransomware behavioral detection. 4. Patch vulnerabilities promptly. 5. Develop and test an incident response plan.",
        "ioc_indicators": ["Mass file extension changes", "Ransom note files (README.txt, !DECRYPT)", "Deletion of volume shadow copies", "Rapid I/O activity on file servers", "Unusual SMB activity across the network"],
        "severity_justification": "Critical – ransomware causes immediate operational disruption and can result in permanent data loss, making it one of the most damaging threat types.",
        "similar_threats": ["Cryptolocker", "Ryuk", "LockBit", "BlackCat/ALPHV", "Conti", "REvil"],
    },
    "ddos": {
        "explanation": "Distributed Denial of Service attacks overwhelm a target with traffic from multiple sources (botnet), rendering services unavailable to legitimate users.",
        "technical_details": "DDoS attacks are categorized as volumetric (floods bandwidth), protocol (exploits protocol weaknesses like SYN floods), or application layer (HTTP floods, Slowloris). Botnets of thousands of compromised devices generate attack traffic. Modern attacks use reflection/amplification (DNS, NTP, SSDP) to multiply attack volume.",
        "impact": "Service outages affecting revenue and SLAs, increased infrastructure costs (egress, mitigation), reputational damage, potential cover for other attacks (smoke screen), and regulatory penalties for availability failures.",
        "mitigation": "1. Implement cloud-based DDoS mitigation (Cloudflare, AWS Shield). 2. Configure rate limiting and traffic scrubbing. 3. Use BGP blackholing for attack traffic. 4. Implement auto-scaling for application layer attacks. 5. Develop DDoS response runbooks.",
        "ioc_indicators": ["Exponential traffic increase from multiple IPs", "High packet rate with small payload sizes", "Traffic from unexpected geographic regions", "Exhausted connection tables on load balancers", "Service timeouts and high error rates"],
        "severity_justification": "High – DDoS can cause complete service unavailability, directly impacting business operations and customer experience.",
        "similar_threats": ["SYN Flood", "UDP Flood", "HTTP Flood", "DNS Amplification", "Slowloris", "Botnet Attack"],
    },
    "data_exfiltration": {
        "explanation": "Data exfiltration is the unauthorized transfer of sensitive data from an organization to an external location controlled by the attacker.",
        "technical_details": "Attackers use various techniques: HTTPS/DNS tunneling to bypass DLP, steganography to hide data in images, legitimate cloud services (Dropbox, GitHub) as exfiltration points, encrypted archives sent via email, and slow-and-low transfers to avoid detection thresholds.",
        "impact": "Loss of intellectual property, customer PII exposure triggering GDPR/CCPA penalties, competitive disadvantage, regulatory fines (up to 4% of global revenue), class action lawsuits, and severe reputational damage.",
        "mitigation": "1. Implement DLP solutions monitoring data in motion. 2. Encrypt sensitive data at rest. 3. Monitor and alert on unusual outbound transfers. 4. Restrict USB/removable media. 5. Apply zero-trust network access controls.",
        "ioc_indicators": ["Large outbound data transfers to unknown IPs", "DNS queries with unusually high entropy (tunneling)", "Compressed/encrypted archives created before transfer", "Access to sensitive data outside business hours", "Connections to cloud storage from unexpected hosts"],
        "severity_justification": "Critical – confirmed data exfiltration triggers mandatory breach notification obligations and indicates a significant compromise of the organization's security posture.",
        "similar_threats": ["DNS Tunneling", "C2 Data Theft", "Insider Threat Data Leak", "Cloud Exfiltration", "Email Data Leak"],
    },
    "port_scan": {
        "explanation": "Port scanning is reconnaissance activity where an attacker probes a network to discover open ports and running services, gathering intelligence for subsequent attacks.",
        "technical_details": "Common techniques include TCP SYN scans (stealthy, no full connection), UDP scans, and service version detection (nmap -sV). Attackers map the network topology, identify vulnerable services, and find entry points. Tools: nmap, masscan, Shodan queries.",
        "impact": "While not directly harmful, port scans indicate active reconnaissance. Discovered open services become attack targets. Information gathered enables more sophisticated follow-up attacks.",
        "mitigation": "1. Implement firewall rules to block unsolicited connection attempts. 2. Deploy IDS/IPS with port scan signatures. 3. Reduce attack surface by closing unnecessary ports. 4. Alert on scan activity and block source IPs. 5. Use port knocking for sensitive services.",
        "ioc_indicators": ["Sequential port connection attempts from single IP", "SYN packets without completing handshakes", "Connections to many ports in short timeframes", "Known scanning tool user agents", "Unusually high connection attempt error rates"],
        "severity_justification": "Medium – port scanning itself causes no direct damage but is a precursor to targeted attacks. The scanning pattern indicates intent.",
        "similar_threats": ["Network Reconnaissance", "Service Enumeration", "OS Fingerprinting", "Vulnerability Scanning"],
    },
    "xss": {
        "explanation": "Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into web pages viewed by other users, enabling session hijacking, credential theft, and defacement.",
        "technical_details": "Reflected XSS executes immediately from URL parameters. Stored XSS persists in the database and affects all viewers. DOM-based XSS manipulates the client-side DOM. Payloads typically steal session cookies, redirect users, keylog inputs, or perform actions on behalf of the victim.",
        "impact": "Session hijacking enabling account takeover, credential theft via fake login forms, malware distribution to site visitors, website defacement, and CSRF attack enablement.",
        "mitigation": "1. Implement Content Security Policy (CSP) headers. 2. Encode all output (HTML, JS, URL encoding). 3. Validate and sanitize all user inputs. 4. Use HTTPOnly and Secure flags on session cookies. 5. Implement XSS filters in WAF.",
        "ioc_indicators": ["Script tags in input fields or URL parameters", "Event handler injections (onerror, onload)", "JavaScript pseudo-protocol in URLs", "Encoded script payloads (%3Cscript%3E)", "Unusual DOM modifications in browser logs"],
        "severity_justification": "High – successful XSS can result in complete account takeover and data theft from all affected users.",
        "similar_threats": ["CSRF", "DOM Manipulation", "Clickjacking", "HTML Injection", "Template Injection"],
    },
    "suspicious_behavior": {
        "explanation": "Anomalous user or system behavior that deviates significantly from established baselines, potentially indicating insider threats, compromised accounts, or advanced persistent threats.",
        "technical_details": "Behavioral analysis detects deviations from normal patterns: unusual login times, unexpected geographic locations, abnormal data access volumes, privilege escalation attempts, and lateral movement. UEBA (User and Entity Behavior Analytics) systems build baselines and score deviations.",
        "impact": "Insider threats causing data theft or sabotage, compromised accounts enabling further network infiltration, APT lateral movement, and compliance violations from unauthorized data access.",
        "mitigation": "1. Deploy UEBA solution with machine learning baselines. 2. Implement PAM for privileged account monitoring. 3. Enable MFA and conditional access policies. 4. Conduct regular access rights reviews. 5. Establish clear acceptable use policies.",
        "ioc_indicators": ["Off-hours system access", "Access from unusual geographic locations", "Accessing large amounts of data atypically", "Privilege escalation attempts", "Lateral movement to systems outside normal scope"],
        "severity_justification": "Medium/High – anomalous behavior may indicate account compromise or insider threat, both requiring immediate investigation to prevent escalation.",
        "similar_threats": ["Insider Threat", "Account Takeover", "APT Lateral Movement", "Privilege Abuse"],
    },
}

_DEFAULT_EXPLAIN = {
    "explanation": "A security threat has been detected that requires investigation. The threat involves potentially malicious activity targeting your infrastructure.",
    "technical_details": "The threat was identified through correlation of multiple indicators including network traffic patterns, log anomalies, and behavioral signatures. Further forensic analysis is recommended.",
    "impact": "Without remediation, this threat could lead to unauthorized access, data loss, or service disruption. The severity indicates the urgency of response.",
    "mitigation": "1. Isolate affected systems immediately. 2. Collect and preserve forensic evidence. 3. Block source IPs at the perimeter. 4. Reset potentially compromised credentials. 5. Follow your incident response playbook.",
    "ioc_indicators": ["Source IP involved in suspicious activity", "Anomalous network traffic patterns", "Unusual system or user behavior"],
    "severity_justification": "Severity was assigned based on the potential impact, confidence score, and historical patterns associated with this threat type.",
    "similar_threats": ["Advanced Persistent Threat", "Zero-day Exploit", "Supply Chain Attack"],
}


@router.post("/api/ai/explain")
async def ai_explain(req: ExplainRequest):
    s = get_store()
    threat_data = req.threat_data or {}

    if req.threat_id:
        for t in s["threats"]:
            if t["id"] == req.threat_id:
                threat_data = t
                break
        else:
            raise HTTPException(status_code=404, detail="Threat not found")

    if not threat_data:
        raise HTTPException(status_code=400, detail="threat_id or threat_data required")

    ttype = threat_data.get("type", "unknown").lower()
    template = _EXPLAIN_TEMPLATES.get(ttype, _DEFAULT_EXPLAIN)

    return {
        "threat_type": ttype,
        "threat_id": threat_data.get("id"),
        "severity": threat_data.get("severity", "unknown"),
        "source_ip": threat_data.get("source_ip", "N/A"),
        **template,
        "generated_at": datetime.utcnow().isoformat(),
    }


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
