"""
Script to add detailedDescription field to products in MongoDB
Run this script to update existing products with detailed descriptions
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "Shop")
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]
products_collection = db["products"]

# Detailed descriptions for different product types
DETAILED_DESCRIPTIONS = {
    "Shirts & Polos": """This premium shirt is crafted with meticulous attention to detail, ensuring both style and comfort for the modern gentleman. Made from the finest materials, it offers exceptional breathability and a luxurious feel against the skin.

The fabric has been carefully selected for its durability and color retention, ensuring that your shirt maintains its pristine appearance wash after wash. The construction features reinforced seams and high-quality stitching that stands up to daily wear while maintaining its elegant appearance.

Perfect for both professional settings and casual occasions, this versatile piece effortlessly transitions from office meetings to evening social events. The timeless design ensures it remains a wardrobe staple for years to come, while the superior craftsmanship guarantees lasting satisfaction with every wear.""",

    "Bottoms": """These expertly tailored bottoms represent the perfect fusion of contemporary style and traditional craftsmanship. Designed with the modern lifestyle in mind, they offer unparalleled comfort without compromising on sophistication.

The carefully engineered fabric blend provides just the right amount of stretch, allowing for freedom of movement throughout your day while maintaining a crisp, polished appearance. Advanced weaving techniques ensure the fabric breathes naturally, keeping you comfortable in any climate.

The precision fit has been refined through extensive testing to ensure a flattering silhouette for a wide range of body types. From the waistband to the hem, every detail has been thoughtfully considered to create bottoms that feel as good as they look, making them an essential addition to any discerning wardrobe.""",

    "Outerwear": """This exceptional outerwear piece combines cutting-edge functionality with timeless aesthetic appeal. Engineered to protect you from the elements while maintaining a sleek, sophisticated profile, it represents the pinnacle of modern garment design.

The construction utilizes advanced materials that provide superior insulation without bulk, ensuring you stay warm and comfortable without sacrificing style. Special attention has been paid to breathability, preventing moisture buildup during active use while maintaining optimal temperature regulation.

Thoughtfully placed pockets offer convenient storage without disrupting the clean lines of the design. The versatile styling allows it to complement both casual and dressy outfits, making it an invaluable piece for any wardrobe. Whether you're braving harsh weather or simply seeking an elegant layering option, this outerwear delivers exceptional performance and enduring style.""",

    "Accessories": """This meticulously crafted accessory elevates any outfit with its perfect blend of functionality and refined aesthetics. Created using premium materials and time-honored techniques, it represents an investment in quality that pays dividends through years of reliable use.

The design philosophy emphasizes both practicality and visual appeal, ensuring that this piece serves your daily needs while adding a touch of sophistication to your overall look. Careful attention to proportions and finishing details results in an accessory that feels substantial yet comfortable.

Whether you're dressing for success in a professional environment or adding the perfect finishing touch to your weekend attire, this versatile accessory adapts seamlessly to any occasion. The superior construction ensures it maintains its appearance and functionality through daily use, making it a worthy addition to your collection of essential accessories.""",

    "Innerwear & Underwear": """Experience unparalleled comfort with this premium innerwear, designed with an obsessive focus on fit, feel, and functionality. Utilizing advanced fabric technology, it provides all-day comfort that you'll barely notice you're wearing.

The innovative material blend wicks moisture efficiently, keeping you dry and comfortable regardless of your activity level. The breathable construction ensures optimal air circulation, while the soft, non-irritating fabric remains gentle against even the most sensitive skin.

The ergonomic design conforms naturally to your body's contours, providing support where you need it without any restrictive feeling. Reinforced construction ensures these essentials maintain their shape and performance through countless wash cycles, offering exceptional value and long-lasting satisfaction. This is innerwear reimagined for the demands of modern life.""",

    "Shoes": """These exceptional shoes represent the perfect marriage of style, comfort, and durability. Crafted with premium materials and expert construction techniques, they're designed to support your feet through every step of your day while maintaining an impressive appearance.

The carefully engineered sole provides excellent cushioning and shock absorption, reducing fatigue during extended wear. Advanced traction patterns ensure confident footing on various surfaces, while the breathable upper keeps your feet comfortable in any weather.

The versatile design transitions effortlessly between different settings, making them ideal for both active pursuits and more relaxed occasions. Meticulous attention to detail in the finishing ensures these shoes maintain their good looks through regular use. With proper care, they'll remain a reliable and stylish component of your footwear collection for years to come."""
}

async def add_detailed_descriptions():
    """Add detailedDescription to all products based on their category"""
    try:
        # Get all products
        products = await products_collection.find({}).to_list(length=None)
        
        print(f"Found {len(products)} products to update")
        
        updated_count = 0
        for product in products:
            category = product.get("category", "")
            
            # Get the appropriate detailed description
            detailed_desc = DETAILED_DESCRIPTIONS.get(
                category, 
                DETAILED_DESCRIPTIONS["Accessories"]  # Default fallback
            )
            
            # Update the product with detailedDescription
            result = await products_collection.update_one(
                {"_id": product["_id"]},
                {
                    "$set": {
                        "detailedDescription": detailed_desc
                    }
                }
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"✓ Updated: {product.get('name', 'Unknown')} ({category})")
            else:
                print(f"○ Skipped: {product.get('name', 'Unknown')} (already has detailed description)")
        
        print(f"\n✅ Successfully updated {updated_count} products!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 Starting to add detailed descriptions to products...\n")
    asyncio.run(add_detailed_descriptions())
