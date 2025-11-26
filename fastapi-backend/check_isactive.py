from pymongo import MongoClient
from bson import ObjectId
from app.config.settings import settings

client = MongoClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

test_id = "673b1234567890abcdef1001"
product = db.products.find_one({"_id": ObjectId(test_id)})

if product:
    print(f"Product: {product['name']}")
    print(f"Has 'isActive' field: {'isActive' in product}")
    if 'isActive' in product:
        print(f"isActive value: {product['isActive']}")
    else:
        print("❌ Missing 'isActive' field!")
    
    # Test query with isActive=True
    product_with_active = db.products.find_one({"_id": ObjectId(test_id), "isActive": True})
    print(f"\nQuery with isActive=True: {'✅ Found' if product_with_active else '❌ Not found'}")
    
    # Test query without isActive
    product_without_active = db.products.find_one({"_id": ObjectId(test_id)})
    print(f"Query without isActive: {'✅ Found' if product_without_active else '❌ Not found'}")

client.close()
