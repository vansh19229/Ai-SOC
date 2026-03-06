"""
Realistic security log generator used to populate the live feed.
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List

# ---------------------------------------------------------------------------
# Pool data
# ---------------------------------------------------------------------------
_EXTERNAL_IPS = [
    "185.220.101.45", "91.108.4.200", "198.54.117.200", "103.21.244.0",
    "45.33.32.156", "172.64.0.0", "104.16.0.0", "151.101.0.0",
    "77.88.8.8", "94.100.180.1", "1.1.1.1", "8.8.8.8",
]
_INTERNAL_IPS = (
    [f"10.0.0.{i}" for i in range(1, 30)]
    + [f"192.168.1.{i}" for i in range(1, 50)]
)
_ALL_IPS = _EXTERNAL_IPS + _INTERNAL_IPS

_USERS = [
    "alice.johnson", "bob.smith", "carol.white", "dave.brown",
    "eve.davis", "frank.miller", "grace.wilson", "henry.moore",
    "admin", "root", "service_account", "svc_backup",
]
_SERVICES = ["sshd", "apache2", "nginx", "mysqld", "vsftpd", "postfix", "dovecot"]
_ENDPOINTS = [
    "/login", "/admin", "/api/v1/users", "/wp-admin", "/phpMyAdmin",
    "/api/v1/data", "/.env", "/config.php", "/backup.zip",
    "/api/v1/tokens", "/graphql", "/swagger-ui",
]
_HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"]
_STATUS_CODES = [200, 200, 200, 301, 400, 401, 403, 404, 500]
_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
    "python-requests/2.31.0",
    "curl/7.88.1",
    "Nmap Scripting Engine",
    "sqlmap/1.7",
    "Nikto/2.1.6",
    "masscan/1.3",
]


def _rand_ip(external: float = 0.4) -> str:
    return random.choice(_EXTERNAL_IPS if random.random() < external else _INTERNAL_IPS)


def _new_id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Individual log generators
# ---------------------------------------------------------------------------

def _firewall_log() -> Dict[str, Any]:
    action = random.choices(["ALLOW", "DENY", "DROP"], weights=[0.6, 0.25, 0.15])[0]
    proto = random.choice(["TCP", "UDP", "ICMP"])
    src = _rand_ip(0.5)
    dst = _rand_ip(0.1)
    port = random.choice([22, 80, 443, 3389, 445, 21, 25, 8080, 3306, 1433])
    level = "WARNING" if action in ("DENY", "DROP") else "INFO"
    return {
        "id": _new_id(),
        "source": "firewall",
        "level": level,
        "message": (
            f"Firewall {action}: {proto} {src}:{random.randint(1024,65535)} "
            f"-> {dst}:{port}"
        ),
        "timestamp": datetime.utcnow().isoformat(),
        "ip": src,
        "user": "",
        "details": {"action": action, "protocol": proto, "dest_port": port, "dest_ip": dst},
    }


def _web_access_log() -> Dict[str, Any]:
    ip = _rand_ip(0.6)
    method = random.choice(_HTTP_METHODS)
    endpoint = random.choice(_ENDPOINTS)
    status = random.choice(_STATUS_CODES)
    ua = random.choice(_USER_AGENTS)
    size = random.randint(100, 50_000)
    level = "ERROR" if status >= 500 else ("WARNING" if status >= 400 else "INFO")
    suspicious_ua = any(kw in ua for kw in ["sqlmap", "Nmap", "Nikto", "masscan"])
    if suspicious_ua:
        level = "WARNING"
    return {
        "id": _new_id(),
        "source": "web_server",
        "level": level,
        "message": (
            f'{ip} - - [{datetime.utcnow().strftime("%d/%b/%Y:%H:%M:%S +0000")}] '
            f'"{method} {endpoint} HTTP/1.1" {status} {size}'
        ),
        "timestamp": datetime.utcnow().isoformat(),
        "ip": ip,
        "user": "",
        "details": {
            "method": method,
            "endpoint": endpoint,
            "status_code": status,
            "bytes": size,
            "user_agent": ua,
            "suspicious": suspicious_ua,
        },
    }


def _auth_log() -> Dict[str, Any]:
    user = random.choice(_USERS)
    ip = _rand_ip(0.5)
    service = random.choice(_SERVICES)
    success = random.random() > 0.35
    action = "Accepted" if success else "Failed"
    auth_type = random.choice(["password", "publickey", "keyboard-interactive"])
    level = "INFO" if success else "WARNING"
    return {
        "id": _new_id(),
        "source": "auth",
        "level": level,
        "message": (
            f"{service}: {action} {auth_type} for {'invalid user ' if not success else ''}"
            f"{user} from {ip} port {random.randint(1024, 65535)} ssh2"
        ),
        "timestamp": datetime.utcnow().isoformat(),
        "ip": ip,
        "user": user,
        "details": {
            "service": service,
            "success": success,
            "auth_type": auth_type,
        },
    }


def _network_traffic_log() -> Dict[str, Any]:
    src = _rand_ip(0.4)
    dst = _rand_ip(0.2)
    proto = random.choice(["TCP", "UDP", "ICMP", "DNS", "HTTP", "HTTPS"])
    port = random.choice([80, 443, 53, 22, 21, 25, 3306, 6379, 27017, 8080])
    bytes_val = random.randint(64, 10_000_000)
    suspicious = bytes_val > 5_000_000 or port in (4444, 1337, 31337)
    level = "WARNING" if suspicious else "INFO"
    return {
        "id": _new_id(),
        "source": "network",
        "level": level,
        "message": (
            f"Network flow: {proto} {src} -> {dst}:{port} "
            f"({bytes_val:,} bytes)"
        ),
        "timestamp": datetime.utcnow().isoformat(),
        "ip": src,
        "user": "",
        "details": {
            "protocol": proto,
            "dest_ip": dst,
            "dest_port": port,
            "bytes": bytes_val,
            "suspicious": suspicious,
        },
    }


def _endpoint_log() -> Dict[str, Any]:
    host = random.choice(["web-01", "db-01", "mail-01", "dc-01", "workstation-" + str(random.randint(1, 20))])
    actions = [
        ("process_created", "INFO", f"Process created: {random.choice(['cmd.exe','powershell.exe','bash','python3','nc'])} by {random.choice(_USERS)}"),
        ("file_access", "INFO", f"File accessed: /etc/passwd by {random.choice(_USERS)}"),
        ("registry_change", "WARNING", "Registry modification detected in HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"),
        ("usb_inserted", "WARNING", f"USB device inserted on {host}"),
        ("service_stopped", "ERROR", f"Critical service stopped: {random.choice(_SERVICES)}"),
        ("malware_quarantined", "CRITICAL", f"Threat quarantined: Trojan.GenericKD on {host}"),
    ]
    ev_type, level, msg = random.choice(actions)
    return {
        "id": _new_id(),
        "source": "endpoint",
        "level": level,
        "message": msg,
        "timestamp": datetime.utcnow().isoformat(),
        "ip": _rand_ip(0.1),
        "user": random.choice(_USERS),
        "details": {"host": host, "event_type": ev_type},
    }


# ---------------------------------------------------------------------------
# Public generator functions
# ---------------------------------------------------------------------------

_GENERATORS = [_firewall_log, _web_access_log, _auth_log, _network_traffic_log, _endpoint_log]
_WEIGHTS = [0.25, 0.25, 0.25, 0.15, 0.10]


def generate_log_entry() -> Dict[str, Any]:
    """Generate a single realistic log entry."""
    fn = random.choices(_GENERATORS, weights=_WEIGHTS)[0]
    return fn()


def generate_log_batch(n: int = 10) -> List[Dict[str, Any]]:
    """Generate n log entries."""
    return [generate_log_entry() for _ in range(n)]


def generate_threat_from_logs(logs: List[Dict[str, Any]]) -> Dict[str, Any] | None:
    """
    Heuristically derive a threat from a batch of logs.
    Returns a threat dict or None if nothing suspicious is found.
    """
    suspicious = [l for l in logs if l["level"] in ("WARNING", "ERROR", "CRITICAL")]
    if len(suspicious) < 3:
        return None

    # Collect IPs with multiple warnings
    from collections import Counter
    ip_counts = Counter(l["ip"] for l in suspicious if l["ip"])
    if not ip_counts:
        return None

    top_ip, count = ip_counts.most_common(1)[0]
    if count < 2:
        return None

    # Determine threat type heuristically
    sources = {l["source"] for l in suspicious}
    if "auth" in sources:
        ttype, severity = "brute_force", "high" if count >= 5 else "medium"
    elif "web_server" in sources:
        ttype, severity = "port_scan", "medium"
    elif "endpoint" in sources:
        ttype, severity = "malware", "high"
    else:
        ttype, severity = "suspicious_behavior", "low"

    return {
        "id": _new_id(),
        "type": ttype,
        "source_ip": top_ip,
        "target": _rand_ip(0.0),
        "severity": severity,
        "timestamp": datetime.utcnow().isoformat(),
        "description": f"Auto-detected {ttype} from {top_ip} ({count} suspicious events)",
        "status": "active",
        "actions_taken": [],
        "confidence": round(min(0.99, 0.5 + count * 0.05), 2),
        "details": {"suspicious_event_count": count},
    }
