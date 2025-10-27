from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings


client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongo_uri)
    # If URI includes db name, get_default_database returns it; else use 'shopprr'
    db_name = client.get_default_database().name if client.get_default_database() else "ecomerce"
    db = client[db_name]


async def close_mongo_connection() -> None:
    global client
    if client:
        client.close()


