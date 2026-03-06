"""
AI-SOC Backend – FastAPI entry point.
"""
from __future__ import annotations

import asyncio
import logging
import os
import random
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Background task: simulate live logs every 30 seconds
# ---------------------------------------------------------------------------

async def _simulate_logs_loop() -> None:
    """Periodically inject simulated log entries and derive threats."""
    from api.log_simulator import generate_log_batch, generate_threat_from_logs
    from api.routes import get_store

    while True:
        try:
            await asyncio.sleep(30)
            s = get_store()
            batch = generate_log_batch(random.randint(5, 15))

            # Prepend new logs
            s["logs"] = batch + s["logs"]
            # Keep log list bounded
            if len(s["logs"]) > 2000:
                s["logs"] = s["logs"][:2000]

            # Maybe derive a new threat
            threat = generate_threat_from_logs(batch)
            if threat:
                s["threats"].insert(0, threat)
                # Trigger SOAR
                from incident_response.soar import SOAREngine
                soar = SOAREngine(
                    auto_block=s["settings"].get("auto_block", True),
                    auto_disable_accounts=s["settings"].get("auto_disable_accounts", False),
                )
                soar.respond(threat)
                logger.info("New auto-detected threat: %s from %s", threat["type"], threat["source_ip"])

        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.warning("Log simulation error: %s", exc)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

_bg_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _bg_task

    # Initialise in-memory store with seed data
    from api.routes import get_store
    store = get_store()
    logger.info(
        "In-memory store ready: %d threats, %d alerts, %d logs",
        len(store["threats"]),
        len(store["alerts"]),
        len(store["logs"]),
    )

    # Attempt MongoDB connection (non-fatal)
    from database.connection import get_db
    db = await get_db()
    if db is not None:
        logger.info("MongoDB connected – using persistent storage")
    else:
        logger.info("MongoDB not available – using in-memory storage")

    # Start background log simulation
    _bg_task = asyncio.create_task(_simulate_logs_loop())
    logger.info("Background log simulator started (interval: 30s)")

    yield

    # Shutdown
    if _bg_task:
        _bg_task.cancel()
        try:
            await _bg_task
        except asyncio.CancelledError:
            pass
    from database.connection import close_db
    await close_db()
    logger.info("AI-SOC backend shutdown complete")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI-SOC API",
    description="Autonomous AI Security Operations Center",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes
from api.routes import router
app.include_router(router)


@app.get("/")
async def root():
    return {
        "service": "AI-SOC Backend",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    from database.connection import get_db
    db = await get_db()
    return {
        "status": "healthy",
        "database": "connected" if db is not None else "in-memory",
    }


# ---------------------------------------------------------------------------
# Dev runner
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
