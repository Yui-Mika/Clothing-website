import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "Shop")

async def import_reviews():
    """Import reviews from JSON file to MongoDB"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    reviews_collection = db["reviews"]
    
    print(f"Connected to MongoDB database: {DATABASE_NAME}")
    
    # Read reviews from JSON file
    json_file_path = "mongodb_collections/reviews.json"
    
    with open(json_file_path, 'r', encoding='utf-8') as file:
        reviews_data = json.load(file)
    
    print(f"\nFound {len(reviews_data)} reviews in {json_file_path}")
    
    # Drop existing reviews collection (optional - comment out if you want to keep existing reviews)
    await reviews_collection.drop()
    print("Dropped existing reviews collection")
    
    # Convert string dates to datetime objects and handle ObjectId
    for review in reviews_data:
        # Convert _id
        if "_id" in review and "$oid" in review["_id"]:
            review["_id"] = ObjectId(review["_id"]["$oid"])
        
        # Convert productId
        if "productId" in review and "$oid" in review["productId"]:
            review["productId"] = ObjectId(review["productId"]["$oid"])
        
        # Convert userId
        if "userId" in review and "$oid" in review["userId"]:
            review["userId"] = ObjectId(review["userId"]["$oid"])
        
        # Convert dates
        if "purchaseDate" in review and review["purchaseDate"] and "$date" in review["purchaseDate"]:
            review["purchaseDate"] = datetime.fromisoformat(review["purchaseDate"]["$date"].replace("Z", "+00:00"))
        
        if "createdAt" in review and "$date" in review["createdAt"]:
            review["createdAt"] = datetime.fromisoformat(review["createdAt"]["$date"].replace("Z", "+00:00"))
        
        if "updatedAt" in review and "$date" in review["updatedAt"]:
            review["updatedAt"] = datetime.fromisoformat(review["updatedAt"]["$date"].replace("Z", "+00:00"))
    
    # Insert reviews
    if reviews_data:
        result = await reviews_collection.insert_many(reviews_data)
        print(f"\n✅ Successfully imported {len(result.inserted_ids)} reviews!")
        
        # Create indexes for better query performance
        await reviews_collection.create_index([("productId", 1)])
        await reviews_collection.create_index([("userId", 1)])
        await reviews_collection.create_index([("createdAt", -1)])
        await reviews_collection.create_index([("rating", -1)])
        await reviews_collection.create_index([("verified", -1)])
        print("✅ Created indexes on reviews collection")
        
        # Show sample reviews
        print("\n📊 Sample reviews:")
        sample_reviews = await reviews_collection.find().limit(3).to_list(length=3)
        for i, review in enumerate(sample_reviews, 1):
            print(f"\n{i}. {review['title']}")
            print(f"   Rating: {'⭐' * review['rating']} ({review['rating']}/5)")
            print(f"   By: {review['userName']} {'✓ Verified Purchase' if review['verified'] else ''}")
            print(f"   Product ID: {review['productId']}")
    else:
        print("❌ No reviews to import")
    
    # Close connection
    client.close()
    print("\n✅ Import completed!")

if __name__ == "__main__":
    print("=" * 60)
    print("IMPORTING REVIEWS TO MONGODB")
    print("=" * 60)
    asyncio.run(import_reviews())
