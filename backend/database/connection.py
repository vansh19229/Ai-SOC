import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ai_soc")

_client: AsyncIOMotorClient | None = None
_db = None


async def get_db():
    """Return the database instance, connecting if necessary."""
    global _client, _db
    if _db is None:
        try:
            _client = AsyncIOMotorClient(
                MONGODB_URL,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000,
            )
            await _client.admin.command("ping")
            _db = _client[DATABASE_NAME]
            logger.info("Connected to MongoDB at %s", MONGODB_URL)
        except Exception as exc:
            logger.warning("MongoDB unavailable (%s) – using in-memory store", exc)
            _client = None
            _db = None
    return _db


async def close_db():
    """Close the MongoDB connection."""
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")
