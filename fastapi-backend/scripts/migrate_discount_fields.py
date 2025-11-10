"""
Migration Script: Add Discount Fields to Products
==================================================

Purpose:
- Add discount fields (hasDiscount, discountPercent) to all products in MongoDB
- Set default values: hasDiscount=False, discountPercent=0
- Detect manual discounts where offerPrice < price
- Calculate discountPercent for products with existing manual discounts

Usage:
    python scripts/migrate_discount_fields.py

Requirements:
    - MongoDB connection configured in app/config/database.py
    - Run from project root directory
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import Settings

# Load settings
settings = Settings()


async def migrate_discount_fields():
    """
    Migrate discount fields for all products in database
    """
    print("=" * 80)
    print("DISCOUNT FIELDS MIGRATION SCRIPT")
    print("=" * 80)
    print()
    
    # Connect to MongoDB
    print("📡 Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    products_collection = db["products"]
    
    try:
        # Count total products
        total_products = await products_collection.count_documents({})
        print(f"✅ Connected! Found {total_products} products in database")
        print()
        
        # Find products without hasDiscount field
        products_without_discount = await products_collection.count_documents({
            "hasDiscount": {"$exists": False}
        })
        print(f"📊 Products without discount fields: {products_without_discount}")
        print()
        
        if products_without_discount == 0:
            print("✨ All products already have discount fields!")
            print("Migration not needed.")
            return
        
        # Confirm before proceeding
        print(f"⚠️  This will update {products_without_discount} products")
        response = input("Continue? (yes/no): ").strip().lower()
        
        if response != "yes":
            print("❌ Migration cancelled by user")
            return
        
        print()
        print("🚀 Starting migration...")
        print()
        
        # Statistics
        stats = {
            "updated": 0,
            "with_manual_discount": 0,
            "without_discount": 0,
            "errors": 0
        }
        
        # Find all products without discount fields
        cursor = products_collection.find({"hasDiscount": {"$exists": False}})
        
        async for product in cursor:
            product_id = product["_id"]
            product_name = product.get("name", "Unknown")
            price = product.get("price", 0)
            offer_price = product.get("offerPrice", price)
            
            try:
                # Detect manual discount
                has_manual_discount = offer_price < price
                
                if has_manual_discount:
                    # Calculate discount percentage
                    discount_percent = round(((price - offer_price) / price) * 100, 2)
                    
                    update_data = {
                        "hasDiscount": True,
                        "discountPercent": discount_percent,
                        "updatedAt": datetime.utcnow()
                    }
                    
                    stats["with_manual_discount"] += 1
                    print(f"✓ [{product_id}] {product_name}")
                    print(f"  Manual discount detected: {discount_percent}%")
                    print(f"  Price: {price:,} → Offer: {offer_price:,}")
                    
                else:
                    # No discount, set defaults
                    update_data = {
                        "hasDiscount": False,
                        "discountPercent": 0,
                        "updatedAt": datetime.utcnow()
                    }
                    
                    stats["without_discount"] += 1
                    print(f"✓ [{product_id}] {product_name}")
                    print(f"  Set default values (no discount)")
                
                # Update product
                result = await products_collection.update_one(
                    {"_id": product_id},
                    {"$set": update_data}
                )
                
                if result.modified_count > 0:
                    stats["updated"] += 1
                
                print()
                
            except Exception as e:
                print(f"❌ Error processing product {product_id}: {str(e)}")
                stats["errors"] += 1
                print()
        
        # Print summary
        print("=" * 80)
        print("MIGRATION SUMMARY")
        print("=" * 80)
        print(f"✅ Total updated: {stats['updated']}")
        print(f"🔍 Products with manual discount: {stats['with_manual_discount']}")
        print(f"📝 Products without discount: {stats['without_discount']}")
        print(f"❌ Errors: {stats['errors']}")
        print()
        
        if stats["errors"] == 0:
            print("🎉 Migration completed successfully!")
        else:
            print("⚠️  Migration completed with some errors")
        
        # Verify migration
        print()
        print("🔍 Verifying migration...")
        remaining = await products_collection.count_documents({
            "hasDiscount": {"$exists": False}
        })
        
        if remaining == 0:
            print("✅ Verification passed! All products now have discount fields")
        else:
            print(f"⚠️  Warning: {remaining} products still missing discount fields")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise
    
    finally:
        # Close connection
        client.close()
        print()
        print("👋 Database connection closed")


async def rollback_migration():
    """
    Rollback: Remove discount fields from all products
    """
    print("=" * 80)
    print("ROLLBACK DISCOUNT FIELDS MIGRATION")
    print("=" * 80)
    print()
    
    # Connect to MongoDB
    print("📡 Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    products_collection = db["products"]
    
    try:
        # Count products with discount fields
        products_with_discount = await products_collection.count_documents({
            "hasDiscount": {"$exists": True}
        })
        
        print(f"✅ Connected! Found {products_with_discount} products with discount fields")
        print()
        
        if products_with_discount == 0:
            print("✨ No products have discount fields to remove")
            return
        
        # Confirm before proceeding
        print(f"⚠️  This will remove discount fields from {products_with_discount} products")
        response = input("Continue? (yes/no): ").strip().lower()
        
        if response != "yes":
            print("❌ Rollback cancelled by user")
            return
        
        print()
        print("🔄 Rolling back migration...")
        
        # Remove discount fields
        result = await products_collection.update_many(
            {"hasDiscount": {"$exists": True}},
            {
                "$unset": {
                    "hasDiscount": "",
                    "discountPercent": "",
                    "discountStartDate": "",
                    "discountEndDate": ""
                },
                "$set": {
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        print(f"✅ Removed discount fields from {result.modified_count} products")
        print("🎉 Rollback completed successfully!")
        
    except Exception as e:
        print(f"❌ Rollback failed: {str(e)}")
        raise
    
    finally:
        client.close()
        print()
        print("👋 Database connection closed")


def main():
    """
    Main function - parse command line arguments
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrate discount fields for products")
    parser.add_argument(
        "--rollback",
        action="store_true",
        help="Rollback migration (remove discount fields)"
    )
    
    args = parser.parse_args()
    
    if args.rollback:
        asyncio.run(rollback_migration())
    else:
        asyncio.run(migrate_discount_fields())


if __name__ == "__main__":
    main()
