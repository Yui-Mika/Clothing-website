from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
db = Database()

async def get_database():
    return db.client[settings.DATABASE_NAME]

async def connect_to_mongo():
    """Connect to MongoDB"""
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    # Test connection
    await db.client.admin.command('ping')
    print("✅ Connected to MongoDB successfully!")
    
    # Create indexes
    await create_indexes()

async def create_indexes():
    """Create database indexes for better performance and constraints"""
    try:
        database = await get_database()
        
        # Create unique index on testimonials.userId to ensure one review per user
        testimonials_collection = database["testimonials"]
        await testimonials_collection.create_index("userId", unique=True)
        print("✅ Created unique index on testimonials.userId")
        
    except Exception as e:
        print(f"⚠️ Index creation info: {str(e)}")

async def close_mongo_connection():
    """Close MongoDB connection"""
    if db.client:
        db.client.close()
        print("❌ Closed MongoDB connection")

async def get_collection(collection_name: str):
    """Get a collection from the database"""
    database = await get_database()
    return database[collection_name]
