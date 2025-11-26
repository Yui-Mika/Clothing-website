#!/usr/bin/env python3
"""
Test specific queries
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.services.rag_service import vector_search
from app.config.database import connect_to_mongo, close_mongo_connection


async def test():
    await connect_to_mongo()
    
    queries = ["áo polo", "áo thun nam", "tìm áo thun"]
    
    for query in queries:
        print(f"\n{'='*60}")
        print(f"🔍 Query: '{query}'")
        print(f"{'='*60}")
        
        results = await vector_search(query, "products", top_k=5)
        
        for i, product in enumerate(results, 1):
            print(f"{i}. {product.get('name', 'Unknown')}")
            print(f"   Category: {product.get('category', 'N/A')}")
            print(f"   Score: {product.get('score', 0):.4f}")
            print()
    
    await close_mongo_connection()

asyncio.run(test())
