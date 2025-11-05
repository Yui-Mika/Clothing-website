"""Script to import products from JSON to MongoDB"""
import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId

# MongoDB connection
MONGODB_URL = "mongodb://localhost:27017"
DB_NAME = "Shop"

async def import_products():
    """Import products from products.json to MongoDB"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    products_collection = db["products"]
    
    print("🔌 Connected to MongoDB")
    
    # Read products.json
    with open("mongodb_collections/products.json", "r", encoding="utf-8") as f:
        products = json.load(f)
    
    print(f"📦 Found {len(products)} products in JSON file")
    
    # Clear existing products
    result = await products_collection.delete_many({})
    print(f"🗑️  Deleted {result.deleted_count} existing products")
    
    # Convert $oid and $date to proper MongoDB types
    for product in products:
        # Convert ObjectId
        if "_id" in product and "$oid" in product["_id"]:
            product["_id"] = ObjectId(product["_id"]["$oid"])
        
        # Convert dates
        if "createdAt" in product and "$date" in product["createdAt"]:
            product["createdAt"] = datetime.fromisoformat(
                product["createdAt"]["$date"].replace("Z", "+00:00")
            )
        
        if "updatedAt" in product and "$date" in product["updatedAt"]:
            product["updatedAt"] = datetime.fromisoformat(
                product["updatedAt"]["$date"].replace("Z", "+00:00")
            )
    
    # Insert products
    result = await products_collection.insert_many(products)
    print(f"✅ Imported {len(result.inserted_ids)} products successfully!")
    
    # Count products by category
    print("\n📊 Products by category:")
    categories = await products_collection.distinct("category")
    for category in categories:
        count = await products_collection.count_documents({"category": category, "inStock": True})
        print(f"   - {category}: {count} products")
    
    # Count popular products
    popular_count = await products_collection.count_documents({"popular": True, "inStock": True})
    print(f"\n⭐ Popular products: {popular_count}")
    
    # Close connection
    client.close()
    print("\n🎉 Import completed!")

if __name__ == "__main__":
    asyncio.run(import_products())
