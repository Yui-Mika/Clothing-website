#!/usr/bin/env python3
"""
Regenerate embeddings for all documents in MongoDB
This script updates existing embeddings with the correct task_type
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from app.services.embeddings import (
    generate_product_embedding,
    generate_blog_embedding, 
    generate_category_embedding
)
from pymongo import UpdateOne


async def regenerate_product_embeddings():
    """Regenerate embeddings for all products"""
    print("\n📦 Regenerating product embeddings...")
    
    client = AsyncIOMotorClient(settings.MONGODB_URL, tlsAllowInvalidCertificates=True)
    db = client[settings.DATABASE_NAME]
    collection = db['products']
    
    # Get all products
    products = await collection.find({}).to_list(length=None)
    print(f"Found {len(products)} products")
    
    # Generate embeddings
    operations = []
    for i, product in enumerate(products, 1):
        try:
            embedding = await generate_product_embedding(product)
            operations.append(
                UpdateOne(
                    {"_id": product["_id"]},
                    {"$set": {"embedding": embedding}}
                )
            )
            print(f"  ✅ {i}/{len(products)}: {product.get('name', 'Unknown')}")
        except Exception as e:
            print(f"  ❌ {i}/{len(products)}: {product.get('name', 'Unknown')} - Error: {e}")
    
    # Bulk update
    if operations:
        result = await collection.bulk_write(operations)
        print(f"\n✅ Updated {result.modified_count} products")
    
    client.close()


async def regenerate_blog_embeddings():
    """Regenerate embeddings for all blogs"""
    print("\n📝 Regenerating blog embeddings...")
    
    client = AsyncIOMotorClient(settings.MONGODB_URL, tlsAllowInvalidCertificates=True)
    db = client[settings.DATABASE_NAME]
    collection = db['blogs']
    
    # Get all blogs
    blogs = await collection.find({}).to_list(length=None)
    print(f"Found {len(blogs)} blogs")
    
    # Generate embeddings
    operations = []
    for i, blog in enumerate(blogs, 1):
        try:
            embedding = await generate_blog_embedding(blog)
            operations.append(
                UpdateOne(
                    {"_id": blog["_id"]},
                    {"$set": {"embedding": embedding}}
                )
            )
            print(f"  ✅ {i}/{len(blogs)}: {blog.get('title', 'Unknown')}")
        except Exception as e:
            print(f"  ❌ {i}/{len(blogs)}: {blog.get('title', 'Unknown')} - Error: {e}")
    
    # Bulk update
    if operations:
        result = await collection.bulk_write(operations)
        print(f"\n✅ Updated {result.modified_count} blogs")
    
    client.close()


async def regenerate_category_embeddings():
    """Regenerate embeddings for all categories"""
    print("\n📁 Regenerating category embeddings...")
    
    client = AsyncIOMotorClient(settings.MONGODB_URL, tlsAllowInvalidCertificates=True)
    db = client[settings.DATABASE_NAME]
    collection = db['categories']
    
    # Get all categories
    categories = await collection.find({}).to_list(length=None)
    print(f"Found {len(categories)} categories")
    
    # Generate embeddings
    operations = []
    for i, category in enumerate(categories, 1):
        try:
            embedding = await generate_category_embedding(category)
            operations.append(
                UpdateOne(
                    {"_id": category["_id"]},
                    {"$set": {"embedding": embedding}}
                )
            )
            print(f"  ✅ {i}/{len(categories)}: {category.get('name', 'Unknown')}")
        except Exception as e:
            print(f"  ❌ {i}/{len(categories)}: {category.get('name', 'Unknown')} - Error: {e}")
    
    # Bulk update
    if operations:
        result = await collection.bulk_write(operations)
        print(f"\n✅ Updated {result.modified_count} categories")
    
    client.close()


async def main():
    """Main function to regenerate all embeddings"""
    print("🚀 Starting embedding regeneration...")
    print(f"Database: {settings.DATABASE_NAME}")
    print(f"Model: {settings.GEMINI_EMBEDDING_MODEL}")
    
    try:
        await regenerate_product_embeddings()
        await regenerate_blog_embeddings()
        await regenerate_category_embeddings()
        
        print("\n" + "="*60)
        print("✅ All embeddings regenerated successfully!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
