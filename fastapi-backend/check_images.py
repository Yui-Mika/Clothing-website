"""
Script to check product images in MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URL = "mongodb://localhost:27017/"
DATABASE_NAME = "Shop"

async def check_product_images():
    print("=" * 70)
    print("📸 PRODUCT IMAGES DATABASE CHECK")
    print("=" * 70)
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    products_collection = db["products"]
    
    # Get all products
    products = await products_collection.find({}).to_list(length=None)
    
    if not products:
        print("\n❌ No products found in database!")
        client.close()
        return
    
    print(f"\n📦 Found {len(products)} products\n")
    
    for idx, product in enumerate(products, 1):
        print(f"{idx}. {product['name']}")
        print(f"   ID: {product['_id']}")
        print(f"   Category: {product.get('category', 'N/A')}")
        print(f"   Price: ${product.get('offerPrice', 0):,.2f}")
        
        images = product.get('image', [])
        print(f"   Images: {len(images)} image(s)")
        
        if images:
            for img_idx, img_url in enumerate(images, 1):
                # Check if URL is valid
                if img_url.startswith('http'):
                    status = "✅"
                else:
                    status = "❌"
                print(f"     {status} [{img_idx}] {img_url[:80]}...")
        else:
            print(f"     ⚠️  NO IMAGES")
        
        print()
    
    # Statistics
    print("=" * 70)
    print("📊 STATISTICS")
    print("=" * 70)
    
    total_products = len(products)
    products_with_images = sum(1 for p in products if p.get('image'))
    products_without_images = total_products - products_with_images
    total_images = sum(len(p.get('image', [])) for p in products)
    
    print(f"✓ Total products: {total_products}")
    print(f"✓ With images: {products_with_images}")
    print(f"✓ Without images: {products_without_images}")
    print(f"✓ Total images: {total_images}")
    print(f"✓ Average: {total_images/total_products:.1f} images/product")
    
    print("\n" + "=" * 70)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_product_images())
