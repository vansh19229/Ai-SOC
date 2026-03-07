"""
Threat Intelligence Feed – maintains an in-memory IOC database.
"""
from __future__ import annotations

import math
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional


class ThreatIntelFeed:
    """
    In-memory threat intelligence indicator feed.
    Provides lookup, pagination, and filtering over IOC entries.
    """

    def __init__(self, store: Dict[str, Any]):
        """Initialize with a reference to the shared in-memory store."""
        self._store = store

    @property
    def _feed(self) -> List[Dict[str, Any]]:
        return self._store.setdefault("threat_intel", [])

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_feed(
        self,
        page: int = 1,
        limit: int = 20,
        ioc_type: Optional[str] = None,
        min_confidence: Optional[int] = None,
        source: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        items = self._feed[:]
        if ioc_type:
            items = [i for i in items if i["type"] == ioc_type]
        if min_confidence is not None:
            items = [i for i in items if i["confidence"] >= min_confidence]
        if source:
            items = [i for i in items if i["source"] == source]
        if search:
            q = search.lower()
            items = [i for i in items if q in i["value"].lower() or q in i.get("threat_type", "").lower()]
        items.sort(key=lambda x: x["last_seen"], reverse=True)
        total = len(items)
        start = (page - 1) * limit
        return {
            "data": items[start: start + limit],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": max(1, math.ceil(total / limit)),
        }

    def check_indicator(self, indicator: str) -> Dict[str, Any]:
        """Look up an IP, domain, hash, or URL in the feed."""
        indicator_lower = indicator.lower()
        for entry in self._feed:
            if entry["value"].lower() == indicator_lower:
                return {"found": True, "indicator": entry}
        return {"found": False, "indicator": None, "value": indicator}

    def add_indicator(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new IOC entry to the feed."""
        now = datetime.utcnow().isoformat()
        entry = {
            "id": str(uuid.uuid4()),
            "type": data.get("type", "ip"),
            "value": data.get("value", ""),
            "threat_type": data.get("threat_type", "unknown"),
            "confidence": int(data.get("confidence", 50)),
            "source": data.get("source", "manual"),
            "first_seen": data.get("first_seen", now),
            "last_seen": data.get("last_seen", now),
            "tags": data.get("tags", []),
            "description": data.get("description", ""),
        }
        self._feed.insert(0, entry)
        return entry

    def get_stats(self) -> Dict[str, Any]:
        """Return aggregate statistics about the feed."""
        feed = self._feed
        total = len(feed)
        by_type: Dict[str, int] = {}
        by_source: Dict[str, int] = {}
        high_confidence = 0

        for entry in feed:
            itype = entry.get("type", "unknown")
            source = entry.get("source", "unknown")
            by_type[itype] = by_type.get(itype, 0) + 1
            by_source[source] = by_source.get(source, 0) + 1
            if entry.get("confidence", 0) >= 75:
                high_confidence += 1

        return {
            "total": total,
            "high_confidence": high_confidence,
            "active_sources": len(by_source),
            "by_type": by_type,
            "by_source": by_source,
        }
