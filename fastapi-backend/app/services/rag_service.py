"""
RAG (Retrieval-Augmented Generation) Service
Performs vector search across MongoDB collections and formats results for LLM context
"""

from typing import List, Dict, Any, Optional
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config.database import get_database
from app.services.embeddings import generate_embedding, EMBEDDING_DIMENSION
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Vector search index names (must match MongoDB Atlas Search index names)
VECTOR_INDEXES = {
    "products": "vector_index_products",
    "blogs": "vector_index_blogs",
    "categories": "vector_index_categories"
}


async def vector_search(
    query: str,
    collection_name: str,
    top_k: int = 5,
    filters: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Perform hybrid search: keyword + vector similarity search on a MongoDB collection.
    
    Args:
        query: User's search query text
        collection_name: Name of collection to search ('products', 'blogs', 'categories')
        top_k: Number of top results to return (default: 5)
        filters: Optional MongoDB filters to combine with vector search
        
    Returns:
        List of documents with relevance scores, sorted by similarity
        
    Raises:
        ValueError: If collection_name is invalid
        Exception: If vector search fails
    """
    if collection_name not in VECTOR_INDEXES:
        raise ValueError(f"Invalid collection: {collection_name}. Must be one of {list(VECTOR_INDEXES.keys())}")
    
    try:
        # Get database and collection
        database = await get_database()
        collection = database[collection_name]
        
        # Extract keywords from query for keyword matching
        import re
        # Clean query and extract meaningful keywords (remove common words)
        query_lower = query.lower()
        stop_words = {'tìm', 'cho', 'tôi', 'mua', 'xem', 'có', 'gì', 'không', 'muốn', 'cần', 'được'}
        keywords = [w for w in re.findall(r'\b[\w]+\b', query_lower) if w not in stop_words and len(w) > 1]
        
        # Try keyword search first for exact matches
        keyword_results = []
        if keywords:
            # Build more precise keyword filters
            or_conditions = []
            for kw in keywords:
                # Use word boundary for more precise matching
                or_conditions.extend([
                    {"name": {"$regex": f"\\b{kw}", "$options": "i"}},
                    {"category": {"$regex": f"\\b{kw}", "$options": "i"}},
                ])
            
            if or_conditions:
                async for doc in collection.find({"$or": or_conditions}).limit(top_k * 2):
                    if "_id" in doc:
                        doc["_id"] = str(doc["_id"])
                    
                    # Calculate keyword match score with priority on name
                    name_lower = doc.get("name", "").lower()
                    category_lower = doc.get("category", "").lower()
                    
                    # Count matches in name (higher weight) and category (lower weight)
                    name_matches = sum(3 for kw in keywords if kw in name_lower)  # 3x weight for name matches
                    category_matches = sum(1 for kw in keywords if kw in category_lower)  # 1x weight for category
                    
                    total_score = name_matches + category_matches
                    
                    # Only include if there's at least one name match OR 2+ category matches
                    if name_matches > 0 or category_matches >= 2:
                        doc["score"] = 0.9 + (total_score * 0.05)
                        keyword_results.append(doc)
                
                # Sort by score (name matches prioritized)
                keyword_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        
        # If we have good keyword results, return them
        if len(keyword_results) >= top_k:
            logger.info(f"Keyword search found {len(keyword_results)} results for '{query}' in {collection_name}")
            return keyword_results[:top_k]
        
        # Otherwise, combine with vector search
        logger.info(f"Generating embedding for query: '{query[:50]}...'")
        query_embedding = await generate_embedding(query, task_type="retrieval_query")
        
        # Build vector search pipeline
        pipeline = [
            {
                "$vectorSearch": {
                    "index": VECTOR_INDEXES[collection_name],
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": top_k * 10,
                    "limit": top_k * 2  # Get more candidates
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "name": 1,
                    "title": 1,
                    "description": 1,
                    "category": 1,
                    "subCategory": 1,
                    "price": 1,
                    "image": 1,
                    "author": 1,
                    "date": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ]
        
        # Add filters if provided
        if filters:
            pipeline.insert(1, {"$match": filters})
        
        # Execute vector search
        vector_results = []
        async for doc in collection.aggregate(pipeline):
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            vector_results.append(doc)
        
        # Combine results: keyword matches first, then vector results
        seen_ids = {doc["_id"] for doc in keyword_results}
        combined = keyword_results.copy()
        
        for doc in vector_results:
            if doc["_id"] not in seen_ids:
                combined.append(doc)
                seen_ids.add(doc["_id"])
        
        results = combined[:top_k]
        logger.info(f"Hybrid search found {len(results)} results for '{query}' in {collection_name}")
        return results
        
    except Exception as e:
        logger.error(f"Search error in {collection_name}: {str(e)}")
        raise


async def search_all_collections(
    query: str,
    top_k_per_collection: int = 3
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Search across all collections (products, blogs, categories) simultaneously.
    
    Args:
        query: User's search query
        top_k_per_collection: Number of results per collection
        
    Returns:
        Dictionary with collection names as keys and search results as values
    """
    results = {}
    
    for collection_name in VECTOR_INDEXES.keys():
        try:
            results[collection_name] = await vector_search(
                query=query,
                collection_name=collection_name,
                top_k=top_k_per_collection
            )
        except Exception as e:
            logger.error(f"Failed to search {collection_name}: {str(e)}")
            results[collection_name] = []
    
    return results


def format_product_context(product: Dict[str, Any]) -> str:
    """Format product document for LLM context."""
    parts = []
    
    if product.get("name"):
        parts.append(f"**{product['name']}**")
    
    if product.get("category") or product.get("subCategory"):
        cat_info = []
        if product.get("category"):
            cat_info.append(product["category"])
        if product.get("subCategory"):
            cat_info.append(product["subCategory"])
        parts.append(f"Danh mục: {' - '.join(cat_info)}")
    
    if product.get("description"):
        parts.append(product["description"])
    
    if product.get("price"):
        parts.append(f"Giá: {product['price']:,}₫")
    
    # Add product link
    if product.get("_id"):
        product_link = f"{settings.FRONTEND_URL}/product/{product['_id']}"
        parts.append(f"🔗 Link: {product_link}")
    
    if product.get("score"):
        parts.append(f"(Độ liên quan: {product['score']:.2f})")
    
    return "\n".join(parts)


def format_blog_context(blog: Dict[str, Any]) -> str:
    """Format blog document for LLM context."""
    parts = []
    
    if blog.get("title"):
        parts.append(f"**{blog['title']}**")
    
    if blog.get("category"):
        parts.append(f"Danh mục: {blog['category']}")
    
    if blog.get("description"):
        parts.append(blog["description"])
    
    if blog.get("author"):
        parts.append(f"Tác giả: {blog['author']}")
    
    if blog.get("score"):
        parts.append(f"(Độ liên quan: {blog['score']:.2f})")
    
    return "\n".join(parts)


def format_category_context(category: Dict[str, Any]) -> str:
    """Format category document for LLM context."""
    parts = []
    
    if category.get("name"):
        parts.append(f"**{category['name']}**")
    
    if category.get("description"):
        parts.append(category["description"])
    
    if category.get("score"):
        parts.append(f"(Độ liên quan: {category['score']:.2f})")
    
    return "\n".join(parts)


def format_context_for_llm(search_results: Dict[str, List[Dict[str, Any]]]) -> str:
    """
    Format all search results into a structured context string for LLM.
    
    Args:
        search_results: Dictionary with collection names and their search results
        
    Returns:
        Formatted context string ready for LLM prompt
    """
    context_parts = []
    
    # Format products
    if search_results.get("products"):
        context_parts.append("## SẢN PHẨM LIÊN QUAN:")
        for i, product in enumerate(search_results["products"], 1):
            context_parts.append(f"\n{i}. {format_product_context(product)}")
    
    # Format blogs
    if search_results.get("blogs"):
        context_parts.append("\n\n## BÀI VIẾT LIÊN QUAN:")
        for i, blog in enumerate(search_results["blogs"], 1):
            context_parts.append(f"\n{i}. {format_blog_context(blog)}")
    
    # Format categories
    if search_results.get("categories"):
        context_parts.append("\n\n## DANH MỤC LIÊN QUAN:")
        for i, category in enumerate(search_results["categories"], 1):
            context_parts.append(f"\n{i}. {format_category_context(category)}")
    
    if not context_parts:
        return "Không tìm thấy thông tin liên quan trong cơ sở dữ liệu."
    
    return "\n".join(context_parts)


async def retrieve_context(query: str, top_k: int = 3) -> str:
    """
    Main function to retrieve and format context for RAG.
    
    Args:
        query: User's question/query
        top_k: Number of results per collection
        
    Returns:
        Formatted context string ready for LLM
    """
    logger.info(f"Retrieving context for query: '{query}'")
    
    # Search all collections
    search_results = await search_all_collections(query, top_k_per_collection=top_k)
    
    # Format for LLM
    context = format_context_for_llm(search_results)
    
    logger.info(f"Context retrieved with {sum(len(v) for v in search_results.values())} total results")
    
    return context


# Utility function for testing
async def test_vector_search():
    """Test vector search functionality."""
    test_query = "áo thun nam cotton"
    
    try:
        logger.info(f"Testing vector search with query: '{test_query}'")
        
        # Test product search
        products = await vector_search(test_query, "products", top_k=3)
        logger.info(f"✅ Found {len(products)} products")
        
        # Test retrieve_context
        context = await retrieve_context(test_query, top_k=2)
        logger.info(f"✅ Generated context ({len(context)} chars)")
        logger.info(f"Context preview:\n{context[:500]}...")
        
        return True
    except Exception as e:
        logger.error(f"❌ Vector search test failed: {str(e)}")
        return False


if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO)
    asyncio.run(test_vector_search())
