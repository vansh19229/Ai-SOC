"""
Seed realistic demo data into the in-memory store (or MongoDB if available).
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
_THREAT_TYPES = [
    "brute_force", "phishing", "port_scan", "malware",
    "suspicious_behavior", "sql_injection", "xss", "ddos",
    "ransomware", "data_exfiltration",
]
_SEVERITIES = ["low", "medium", "high", "critical"]
_SEVERITY_WEIGHTS = [0.3, 0.35, 0.25, 0.10]

_SOURCES = ["firewall", "ids", "endpoint", "email_gateway", "web_proxy", "siem"]
_PROTOCOLS = ["TCP", "UDP", "ICMP", "HTTP", "HTTPS", "DNS", "FTP", "SSH"]
_LOG_LEVELS = ["INFO", "WARNING", "ERROR", "CRITICAL", "DEBUG"]
_LOG_LEVEL_WEIGHTS = [0.5, 0.25, 0.15, 0.05, 0.05]

_USERS = [
    ("alice.johnson", "alice@corp.local", "admin", "IT Security"),
    ("bob.smith", "bob@corp.local", "analyst", "SOC"),
    ("carol.white", "carol@corp.local", "analyst", "SOC"),
    ("dave.brown", "dave@corp.local", "viewer", "Finance"),
    ("eve.davis", "eve@corp.local", "analyst", "IT Security"),
    ("frank.miller", "frank@corp.local", "viewer", "HR"),
    ("grace.wilson", "grace@corp.local", "analyst", "Network"),
    ("henry.moore", "henry@corp.local", "viewer", "Operations"),
    ("iris.taylor", "iris@corp.local", "analyst", "Endpoint"),
    ("jack.anderson", "jack@corp.local", "viewer", "Marketing"),
]

_INTERNAL_IPS = [
    "10.0.0." + str(i) for i in range(1, 30)
] + [
    "192.168.1." + str(i) for i in range(1, 50)
]

_EXTERNAL_IPS = [
    "45.33.32.156", "185.220.101.45", "91.108.4.200", "198.54.117.200",
    "103.21.244.0", "172.64.0.0", "104.16.0.0", "151.101.0.0",
    "1.1.1.1", "8.8.8.8", "77.88.8.8", "94.100.180.1",
    "185.199.108.153", "140.82.121.4", "192.30.255.112",
]


def _rand_ip(external: bool = False) -> str:
    if external:
        return random.choice(_EXTERNAL_IPS)
    return random.choice(_INTERNAL_IPS + _EXTERNAL_IPS)


def _rand_time(days_back: int = 30) -> datetime:
    now = datetime.utcnow()
    return now - timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59),
    )


def _rand_severity() -> str:
    return random.choices(_SEVERITIES, weights=_SEVERITY_WEIGHTS)[0]


def _new_id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------

def generate_threats(n: int = 50) -> List[Dict[str, Any]]:
    threats = []
    descriptions = {
        "brute_force": "Multiple failed authentication attempts detected from {ip}",
        "phishing": "Suspicious phishing email campaign targeting internal users",
        "port_scan": "Systematic port scanning activity detected from {ip}",
        "malware": "Known malware signature detected in network traffic from {ip}",
        "suspicious_behavior": "Anomalous user behavior pattern detected for account {user}",
        "sql_injection": "SQL injection attempt detected in web application request from {ip}",
        "xss": "Cross-site scripting payload detected in request from {ip}",
        "ddos": "Distributed denial-of-service attack originating from {ip}",
        "ransomware": "Ransomware encryption activity detected on endpoint from {ip}",
        "data_exfiltration": "Unusual large data transfer to external IP {ip}",
    }
    statuses = ["active", "investigating", "resolved", "false_positive"]
    status_weights = [0.4, 0.3, 0.2, 0.1]

    for _ in range(n):
        ttype = random.choice(_THREAT_TYPES)
        src_ip = _rand_ip(external=True)
        user = random.choice(_USERS)[0]
        desc = descriptions[ttype].format(ip=src_ip, user=user)
        threats.append({
            "id": _new_id(),
            "type": ttype,
            "source_ip": src_ip,
            "target": random.choice(_INTERNAL_IPS),
            "severity": _rand_severity(),
            "timestamp": _rand_time().isoformat(),
            "description": desc,
            "status": random.choices(statuses, weights=status_weights)[0],
            "actions_taken": random.sample(
                ["ip_blocked", "alert_sent", "account_disabled", "report_generated"],
                k=random.randint(0, 3),
            ),
            "confidence": round(random.uniform(0.55, 0.99), 2),
            "details": {"attempts": random.randint(1, 200)},
        })
    return threats


def generate_alerts(threats: List[Dict], n: int = 100) -> List[Dict[str, Any]]:
    alerts = []
    titles = {
        "brute_force": "Brute Force Attack Detected",
        "phishing": "Phishing Campaign Identified",
        "port_scan": "Port Scan Activity",
        "malware": "Malware Signature Match",
        "suspicious_behavior": "Anomalous User Behavior",
        "sql_injection": "SQL Injection Attempt",
        "xss": "XSS Attack Detected",
        "ddos": "DDoS Attack in Progress",
        "ransomware": "Ransomware Activity Detected",
        "data_exfiltration": "Data Exfiltration Attempt",
    }
    statuses = ["open", "acknowledged", "resolved", "false_positive"]
    status_weights = [0.45, 0.25, 0.20, 0.10]

    for _ in range(n):
        threat = random.choice(threats) if threats else {}
        ttype = threat.get("type", "suspicious_behavior")
        alerts.append({
            "id": _new_id(),
            "title": titles.get(ttype, "Security Alert"),
            "severity": threat.get("severity", _rand_severity()),
            "source": random.choice(_SOURCES),
            "timestamp": _rand_time().isoformat(),
            "status": random.choices(statuses, weights=status_weights)[0],
            "details": (
                f"Threat detected from {threat.get('source_ip', _rand_ip())}. "
                f"Confidence: {threat.get('confidence', 0.75):.1%}"
            ),
            "threat_id": threat.get("id"),
            "assigned_to": random.choice([None, random.choice(_USERS)[0]]),
        })
    return alerts


def generate_incidents(n: int = 20) -> List[Dict[str, Any]]:
    incidents = []
    types = ["security_breach", "ransomware", "data_leak", "insider_threat",
             "ddos_attack", "phishing_campaign", "supply_chain", "apt"]
    statuses = ["open", "investigating", "contained", "resolved", "closed"]

    for i in range(n):
        itype = random.choice(types)
        sev = _rand_severity()
        ts = _rand_time(60)
        incidents.append({
            "id": _new_id(),
            "title": f"INC-{1000 + i}: {itype.replace('_', ' ').title()}",
            "type": itype,
            "severity": sev,
            "timestamp": ts.isoformat(),
            "status": random.choice(statuses),
            "affected_systems": random.sample(
                ["web-server-01", "db-server-02", "mail-server-01",
                 "workstation-finance-03", "vpn-gateway", "dc-01"],
                k=random.randint(1, 4),
            ),
            "source_ip": _rand_ip(external=True),
            "description": (
                f"Security incident of type {itype} detected with {sev} severity. "
                "Immediate investigation required."
            ),
            "timeline": [
                {"time": ts.isoformat(), "event": "Incident detected by SIEM"},
                {"time": (ts + timedelta(minutes=5)).isoformat(), "event": "Alert raised"},
                {"time": (ts + timedelta(minutes=15)).isoformat(), "event": "Analyst assigned"},
            ],
            "report": None,
            "assigned_to": random.choice([None, random.choice(_USERS)[0]]),
            "resolved_at": None,
        })
    return incidents


def generate_logs(n: int = 500) -> List[Dict[str, Any]]:
    logs = []
    messages = [
        "User {user} logged in successfully from {ip}",
        "Failed login attempt for user {user} from {ip}",
        "Firewall rule triggered: blocked connection from {ip}",
        "Suspicious outbound connection detected to {ip}",
        "IDS alert: potential port scan from {ip}",
        "Endpoint protection: threat quarantined on host {host}",
        "DNS query to known malicious domain from {ip}",
        "SSL certificate validation failed for {ip}",
        "Privilege escalation attempt by user {user}",
        "Large file transfer initiated by {user} to {ip}",
        "System update applied on host {host}",
        "Service restart: sshd on {host}",
        "Backup completed successfully for {host}",
        "Configuration change detected on firewall",
        "Web application firewall blocked request from {ip}",
    ]
    hosts = ["web-01", "db-01", "mail-01", "dc-01", "vpn-01", "fw-01", "ids-01"]

    for _ in range(n):
        user = random.choice(_USERS)[0]
        ip = _rand_ip(random.random() > 0.5)
        host = random.choice(hosts)
        msg_template = random.choice(messages)
        logs.append({
            "id": _new_id(),
            "source": random.choice(_SOURCES),
            "level": random.choices(_LOG_LEVELS, weights=_LOG_LEVEL_WEIGHTS)[0],
            "message": msg_template.format(user=user, ip=ip, host=host),
            "timestamp": _rand_time(7).isoformat(),
            "ip": ip,
            "user": user,
            "details": {"host": host},
        })
    return logs


def generate_network_activity(n: int = 100) -> List[Dict[str, Any]]:
    activity = []
    statuses = ["allowed", "blocked", "suspicious"]
    status_weights = [0.65, 0.20, 0.15]
    ports = [80, 443, 22, 21, 25, 53, 3306, 5432, 6379, 8080, 8443, 3389, 445]

    for _ in range(n):
        activity.append({
            "id": _new_id(),
            "source_ip": _rand_ip(random.random() > 0.4),
            "dest_ip": _rand_ip(random.random() > 0.6),
            "protocol": random.choice(_PROTOCOLS),
            "port": random.choice(ports),
            "bytes": random.randint(64, 10_000_000),
            "timestamp": _rand_time(1).isoformat(),
            "status": random.choices(statuses, weights=status_weights)[0],
        })
    return activity


def generate_users() -> List[Dict[str, Any]]:
    users = []
    for uname, email, role, dept in _USERS:
        users.append({
            "id": _new_id(),
            "username": uname,
            "email": email,
            "role": role,
            "last_login": _rand_time(3).isoformat(),
            "status": random.choice(["active", "active", "active", "suspended"]),
            "location": random.choice(["New York", "London", "Berlin", "Tokyo", "Remote"]),
            "department": dept,
        })
    return users


def generate_settings() -> Dict[str, Any]:
    return {
        "ai_sensitivity": 0.75,
        "auto_block": True,
        "auto_disable_accounts": False,
        "notification_enabled": True,
        "block_threshold": 5,
        "scan_interval_seconds": 30,
        "max_alerts_per_hour": 100,
        "whitelist_ips": ["127.0.0.1", "10.0.0.1", "192.168.1.1"],
        "blacklist_ips": ["185.220.101.45", "91.108.4.200"],
        "alert_email": "",
        "telegram_enabled": False,
    }


def build_seed() -> Dict[str, Any]:
    """Return a fully populated in-memory seed dictionary."""
    threats = generate_threats(50)
    alerts = generate_alerts(threats, 100)
    incidents = generate_incidents(20)
    logs = generate_logs(500)
    network = generate_network_activity(100)
    users = generate_users()
    settings = generate_settings()
    return {
        "threats": threats,
        "alerts": alerts,
        "incidents": incidents,
        "logs": logs,
        "network": network,
        "users": users,
        "settings": settings,
        "whitelist": settings["whitelist_ips"][:],
        "blacklist": settings["blacklist_ips"][:],
    }
