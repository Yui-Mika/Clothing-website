#!/usr/bin/env python3
"""
Test vector search to debug search results
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.services.rag_service import vector_search
from app.config.database import connect_to_mongo, close_mongo_connection


async def test_search():
    """Test vector search with different queries"""
    
    await connect_to_mongo()
    
    test_queries = [
        "áo thun nam",
        "tìm áo thun",
        "quần nam",
        "áo khoác"
    ]
    
    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"🔍 Query: '{query}'")
        print(f"{'='*60}")
        
        try:
            results = await vector_search(query, "products", top_k=5)
            
            if results:
                print(f"✅ Found {len(results)} results:\n")
                for i, product in enumerate(results, 1):
                    print(f"{i}. {product.get('name', 'Unknown')}")
                    print(f"   Category: {product.get('category', 'N/A')}")
                    print(f"   Score: {product.get('score', 0):.4f}")
                    print(f"   ID: {product.get('_id', 'N/A')}")
                    print()
            else:
                print("❌ No results found")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
    
    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(test_search())
