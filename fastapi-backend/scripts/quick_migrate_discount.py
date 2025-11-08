"""
Quick Migration Script: Add Discount Fields (Auto Mode)
========================================================

Purpose: Same as migrate_discount_fields.py but runs automatically without user confirmation
Good for: CI/CD pipelines, automated deployments, quick testing

Usage:
    python scripts/quick_migrate_discount.py
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import Settings

# Load settings
settings = Settings()


async def quick_migrate():
    """Quick migration without confirmation"""
    print("🚀 Quick Discount Migration (Auto Mode)")
    print("-" * 50)
    
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    products_collection = db["products"]
    
    try:
        # Find products without discount fields
        products_without_discount = await products_collection.count_documents({
            "hasDiscount": {"$exists": False}
        })
        
        if products_without_discount == 0:
            print("✅ All products already have discount fields")
            return
        
        print(f"📊 Updating {products_without_discount} products...")
        
        stats = {"manual": 0, "default": 0, "total": 0}
        
        cursor = products_collection.find({"hasDiscount": {"$exists": False}})
        
        async for product in cursor:
            price = product.get("price", 0)
            offer_price = product.get("offerPrice", price)
            has_manual_discount = offer_price < price
            
            if has_manual_discount:
                discount_percent = round(((price - offer_price) / price) * 100, 2)
                update_data = {
                    "hasDiscount": True,
                    "discountPercent": discount_percent,
                    "updatedAt": datetime.utcnow()
                }
                stats["manual"] += 1
            else:
                update_data = {
                    "hasDiscount": False,
                    "discountPercent": 0,
                    "updatedAt": datetime.utcnow()
                }
                stats["default"] += 1
            
            await products_collection.update_one(
                {"_id": product["_id"]},
                {"$set": update_data}
            )
            stats["total"] += 1
        
        print(f"✅ Updated {stats['total']} products")
        print(f"   - {stats['manual']} with manual discount")
        print(f"   - {stats['default']} with default values")
        print("🎉 Migration completed!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(quick_migrate())
