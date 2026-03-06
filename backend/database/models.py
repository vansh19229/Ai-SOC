from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
import uuid


def new_id() -> str:
    return str(uuid.uuid4())


class PyObjectId(str):
    """Coerce MongoDB ObjectId / plain strings to str."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return str(v)


# ---------------------------------------------------------------------------
# Threat
# ---------------------------------------------------------------------------
class Threat(BaseModel):
    id: str = Field(default_factory=new_id)
    type: str
    source_ip: str
    target: str
    severity: str  # low | medium | high | critical
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    description: str
    status: str = "active"  # active | investigating | resolved | false_positive
    actions_taken: List[str] = []
    confidence: float = 0.0
    details: Dict[str, Any] = {}

    model_config = {"populate_by_name": True}


class ThreatCreate(BaseModel):
    type: str
    source_ip: str
    target: str
    severity: str
    description: str
    status: str = "active"
    confidence: float = 0.0
    details: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Alert
# ---------------------------------------------------------------------------
class Alert(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    severity: str
    source: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "open"  # open | acknowledged | resolved | false_positive
    details: str = ""
    threat_id: Optional[str] = None
    assigned_to: Optional[str] = None

    model_config = {"populate_by_name": True}


class AlertCreate(BaseModel):
    title: str
    severity: str
    source: str
    details: str = ""
    threat_id: Optional[str] = None


class AlertUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    details: Optional[str] = None


# ---------------------------------------------------------------------------
# Incident
# ---------------------------------------------------------------------------
class Incident(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    type: str
    severity: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "open"  # open | investigating | contained | resolved | closed
    affected_systems: List[str] = []
    source_ip: str = ""
    description: str = ""
    timeline: List[Dict[str, Any]] = []
    report: Optional[str] = None
    assigned_to: Optional[str] = None
    resolved_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}


class IncidentCreate(BaseModel):
    title: str
    type: str
    severity: str
    affected_systems: List[str] = []
    source_ip: str = ""
    description: str = ""


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    description: Optional[str] = None
    report: Optional[str] = None


# ---------------------------------------------------------------------------
# Log
# ---------------------------------------------------------------------------
class Log(BaseModel):
    id: str = Field(default_factory=new_id)
    source: str
    level: str  # INFO | WARNING | ERROR | CRITICAL | DEBUG
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip: str = ""
    user: str = ""
    details: Dict[str, Any] = {}

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# NetworkActivity
# ---------------------------------------------------------------------------
class NetworkActivity(BaseModel):
    id: str = Field(default_factory=new_id)
    source_ip: str
    dest_ip: str
    protocol: str
    port: int
    bytes: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "allowed"  # allowed | blocked | suspicious

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class User(BaseModel):
    id: str = Field(default_factory=new_id)
    username: str
    email: str
    role: str = "analyst"  # admin | analyst | viewer
    last_login: Optional[datetime] = None
    status: str = "active"  # active | suspended | locked
    location: str = ""
    department: str = ""

    model_config = {"populate_by_name": True}


class UserCreate(BaseModel):
    username: str
    email: str
    role: str = "analyst"
    department: str = ""


# ---------------------------------------------------------------------------
# AdminSettings
# ---------------------------------------------------------------------------
class AdminSettings(BaseModel):
    ai_sensitivity: float = 0.75  # 0.0 – 1.0
    auto_block: bool = True
    auto_disable_accounts: bool = False
    notification_enabled: bool = True
    block_threshold: int = 5
    scan_interval_seconds: int = 30
    max_alerts_per_hour: int = 100
    whitelist_ips: List[str] = []
    blacklist_ips: List[str] = []
    alert_email: str = ""
    telegram_enabled: bool = False

    model_config = {"populate_by_name": True}
