"""
Script để tạo wishlist mẫu cho user Dan
Thêm 6 sản phẩm vào wishlist collection

Chạy script:
cd fastapi-backend
python scripts/create_sample_wishlist.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017"
DATABASE_NAME = "Shop"

async def create_sample_wishlist():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DATABASE_NAME]
    
    print("🔗 Connected to MongoDB")
    
    # Get collections
    users_collection = db.users
    products_collection = db.products
    wishlists_collection = db.wishlists
    
    # Find user Dan
    user = await users_collection.find_one({"email": "dnldna05@gmail.com"})
    
    if not user:
        print("❌ User Dan not found!")
        return
    
    user_id = str(user["_id"])
    print(f"✅ Found user: {user['email']} (ID: {user_id})")
    
    # Get 6 random products
    products_cursor = products_collection.aggregate([
        {"$sample": {"size": 6}}  # Lấy random 6 sản phẩm
    ])
    products = await products_cursor.to_list(length=6)
    
    if len(products) < 6:
        print(f"⚠️ Only found {len(products)} products in database")
    
    print(f"\n📦 Selected {len(products)} products for wishlist:")
    for i, product in enumerate(products, 1):
        print(f"  {i}. {product['name']} (ID: {product['_id']})")
    
    # Check if user already has a wishlist
    existing_wishlist = await wishlists_collection.find_one({"userId": user_id})
    
    if existing_wishlist:
        print(f"\n⚠️ User already has wishlist with {len(existing_wishlist.get('products', []))} products")
        print("🗑️ Deleting old wishlist...")
        await wishlists_collection.delete_one({"userId": user_id})
    
    # Create wishlist products array
    wishlist_products = []
    base_time = datetime.utcnow()
    
    for i, product in enumerate(products):
        # Thêm products với thời gian khác nhau (mới nhất lên đầu)
        added_time = datetime(
            base_time.year,
            base_time.month,
            base_time.day,
            base_time.hour,
            base_time.minute - (len(products) - i),  # Products added at different times
            base_time.second
        )
        
        wishlist_products.append({
            "productId": str(product["_id"]),
            "addedAt": added_time
        })
    
    # Create new wishlist document
    new_wishlist = {
        "userId": user_id,
        "products": wishlist_products,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Insert into database
    result = await wishlists_collection.insert_one(new_wishlist)
    
    print(f"\n✅ Wishlist created successfully!")
    print(f"📊 Wishlist ID: {result.inserted_id}")
    print(f"📦 Total products: {len(wishlist_products)}")
    print(f"\n🎉 Sample wishlist for user Dan has been created!")
    
    # Show summary
    print("\n" + "="*60)
    print("WISHLIST SUMMARY")
    print("="*60)
    print(f"User: {user['email']}")
    print(f"User ID: {user_id}")
    print(f"Products in wishlist: {len(wishlist_products)}")
    print("\nProducts:")
    for i, product in enumerate(products, 1):
        print(f"  {i}. {product['name']}")
        print(f"     Category: {product['category']}")
        print(f"     Price: ${product['price']:,}")
        if product.get('hasDiscount'):
            print(f"     Offer Price: ${product['offerPrice']:,} (-{product['discountPercent']}%)")
        print()
    
    # Close connection
    client.close()
    print("✅ MongoDB connection closed")

if __name__ == "__main__":
    print("="*60)
    print("CREATE SAMPLE WISHLIST FOR USER DAN")
    print("="*60)
    print()
    asyncio.run(create_sample_wishlist())
