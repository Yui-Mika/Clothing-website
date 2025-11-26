"""Script to import settings from JSON to MongoDB"""
import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
from app.config.settings import settings

# MongoDB connection
MONGODB_URL = settings.MONGODB_URL
DB_NAME = settings.DATABASE_NAME

async def import_settings():
    """Import settings from settings.json to MongoDB"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    settings_collection = db["settings"]
    
    print("🔌 Connected to MongoDB")
    
    # Read settings.json
    with open("mongodb_collections/settings.json", "r", encoding="utf-8") as f:
        settings = json.load(f)
    
    print(f"⚙️  Found {len(settings)} settings in JSON file")
    
    # Clear existing settings
    result = await settings_collection.delete_many({})
    print(f"🗑️  Deleted {result.deleted_count} existing settings")
    
    # Convert $oid and $date to proper MongoDB types
    for setting in settings:
        # Convert ObjectId
        if "_id" in setting and "$oid" in setting["_id"]:
            setting["_id"] = ObjectId(setting["_id"]["$oid"])
        
        # Convert dates
        if "createdAt" in setting and "$date" in setting["createdAt"]:
            setting["createdAt"] = datetime.fromisoformat(
                setting["createdAt"]["$date"].replace("Z", "+00:00")
            )
        
        if "updatedAt" in setting and "$date" in setting["updatedAt"]:
            setting["updatedAt"] = datetime.fromisoformat(
                setting["updatedAt"]["$date"].replace("Z", "+00:00")
            )
    
    # Insert settings
    result = await settings_collection.insert_many(settings)
    print(f"✅ Imported {len(result.inserted_ids)} settings successfully!")
    
    # List all settings
    print("\n📋 Settings imported:")
    all_settings = await settings_collection.find().to_list(length=None)
    for setting in all_settings:
        status = "🟢 Active" if setting.get("isActive") else "🔴 Inactive"
        print(f"   {status} Year {setting['year']}: Shipping ${setting['shippingFee']}, Tax {setting['taxRate']*100}%")
    
    # Find current year active setting
    current_year = datetime.now().year
    current_setting = await settings_collection.find_one({
        "year": current_year,
        "isActive": True
    })
    
    if current_setting:
        print(f"\n✨ Current active setting (Year {current_year}):")
        print(f"   - Shipping Fee: ${current_setting['shippingFee']}")
        print(f"   - Tax Rate: {current_setting['taxRate']*100}%")
    else:
        print(f"\n⚠️  No active setting found for current year ({current_year})")
    
    # Close connection
    client.close()
    print("\n🔒 Connection closed")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting Settings Import Script")
    print("=" * 60)
    
    asyncio.run(import_settings())
    
    print("\n" + "=" * 60)
    print("✅ Settings import completed!")
    print("=" * 60)
