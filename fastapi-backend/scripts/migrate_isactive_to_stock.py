"""
Migration script: Replace isActive field with stock field in products collection
This script will:
1. Add stock field with default value of 20 to all products
2. Remove isActive field from all products
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config.database import settings
from datetime import datetime

async def migrate_products():
    """Migrate all products from isActive to stock field"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    products_collection = db["products"]
    
    try:
        # Count total products
        total_products = await products_collection.count_documents({})
        print(f"📦 Found {total_products} products in database")
        
        if total_products == 0:
            print("⚠️  No products found. Nothing to migrate.")
            return
        
        # Update all products: add stock field and remove isActive
        result = await products_collection.update_many(
            {},  # Match all products
            {
                "$set": {
                    "stock": 20,
                    "updatedAt": datetime.utcnow()
                },
                "$unset": {
                    "isActive": ""
                }
            }
        )
        
        print(f"✅ Migration completed successfully!")
        print(f"   - Modified {result.modified_count} products")
        print(f"   - Added 'stock' field with default value 20")
        print(f"   - Removed 'isActive' field")
        
        # Verify migration
        sample = await products_collection.find_one({})
        if sample:
            print(f"\n📋 Sample product after migration:")
            print(f"   - Name: {sample.get('name', 'N/A')}")
            print(f"   - Stock: {sample.get('stock', 'N/A')}")
            print(f"   - Has isActive: {'isActive' in sample}")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise
    finally:
        client.close()
        print("\n🔌 Database connection closed")

if __name__ == "__main__":
    print("🚀 Starting migration: isActive → stock")
    print("=" * 50)
    asyncio.run(migrate_products())
    print("=" * 50)
    print("✨ Migration process completed!")
