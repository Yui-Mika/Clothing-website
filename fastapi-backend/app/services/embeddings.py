"""
Vector Embeddings Service for RAG Chatbot
Generates embeddings using Google Gemini's text-embedding-004 model
"""

from typing import List, Dict, Any, Optional
import google.generativeai as genai
import asyncio
from functools import lru_cache
import logging

from app.config.settings import settings

logger = logging.getLogger(__name__)

# Initialize Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Embedding model configuration
EMBEDDING_MODEL = settings.GEMINI_EMBEDDING_MODEL
EMBEDDING_DIMENSION = 768  # text-embedding-004 produces 768-dimensional vectors
MAX_BATCH_SIZE = 100  # Process in batches for efficiency


async def generate_embedding(text: str, task_type: str = "retrieval_document") -> List[float]:
    """
    Generate embedding vector for a single text string using Google Gemini.
    
    Args:
        text: Text to generate embedding for
        task_type: Either "retrieval_document" (for indexing) or "retrieval_query" (for search)
        
    Returns:
        List of floats representing the embedding vector (768 dimensions)
        
    Raises:
        Exception: If API call fails
    """
    if not text or not text.strip():
        logger.warning("Empty text provided for embedding generation")
        return [0.0] * EMBEDDING_DIMENSION
    
    try:
        # Clean and truncate text
        clean_text = text.strip()
        
        # Generate embedding using Gemini API
        result = await asyncio.to_thread(
            genai.embed_content,
            model=EMBEDDING_MODEL,
            content=clean_text,
            task_type=task_type
        )
        
        embedding = result['embedding']
        logger.info(f"Generated {task_type} embedding for text (length: {len(text)} chars)")
        return embedding
        
    except Exception as e:
        logger.error(f"Gemini API error generating embedding: {str(e)}")
        raise


async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for multiple texts in batch using Gemini.
    
    Args:
        texts: List of text strings to generate embeddings for
        
    Returns:
        List of embedding vectors, same order as input texts
        
    Raises:
        Exception: If API call fails
    """
    if not texts:
        return []
    
    # Filter out empty texts and keep track of original indices
    valid_texts = []
    valid_indices = []
    for i, text in enumerate(texts):
        if text and text.strip():
            valid_texts.append(text.strip())
            valid_indices.append(i)
    
    if not valid_texts:
        logger.warning("No valid texts provided for batch embedding")
        return [[0.0] * EMBEDDING_DIMENSION] * len(texts)
    
    try:
        all_embeddings = []
        
        # Process in batches
        for i in range(0, len(valid_texts), MAX_BATCH_SIZE):
            batch = valid_texts[i:i + MAX_BATCH_SIZE]
            
            logger.info(f"Processing batch {i//MAX_BATCH_SIZE + 1}, size: {len(batch)}")
            
            # Gemini supports batch embedding with embed_content
            result = await asyncio.to_thread(
                genai.embed_content,
                model=EMBEDDING_MODEL,
                content=batch,
                task_type="retrieval_document"
            )
            
            # Handle both single and batch results
            if isinstance(result['embedding'][0], list):
                batch_embeddings = result['embedding']
            else:
                batch_embeddings = [result['embedding']]
            
            all_embeddings.extend(batch_embeddings)
        
        # Reconstruct full list with zeros for empty texts
        result = []
        valid_idx = 0
        for i in range(len(texts)):
            if i in valid_indices:
                result.append(all_embeddings[valid_idx])
                valid_idx += 1
            else:
                result.append([0.0] * EMBEDDING_DIMENSION)
        
        logger.info(f"Generated {len(all_embeddings)} embeddings in batch")
        return result
        
    except Exception as e:
        logger.error(f"Gemini API error in batch embedding: {str(e)}")
        raise


def prepare_product_text(product: Dict[str, Any]) -> str:
    """
    Prepare product document text for embedding generation.
    Combines relevant fields into a searchable text representation.
    Emphasizes product name for better search accuracy.
    
    Args:
        product: Product document from MongoDB
        
    Returns:
        Formatted text string for embedding
    """
    parts = []
    
    # Product name (MOST IMPORTANT - repeat 3 times for emphasis)
    if product.get("name"):
        name = product['name']
        parts.append(f"{name}. {name}. {name}")
    
    # Category (important for categorization)
    if product.get("category"):
        cat = product['category']
        parts.append(f"Danh mục: {cat}. Thuộc loại {cat}")
    
    # Subcategory
    if product.get("subCategory"):
        parts.append(f"Loại: {product['subCategory']}")
    
    # Description
    if product.get("description"):
        parts.append(product['description'])
    
    # Detailed description (if available)
    if product.get("detailedDescription"):
        parts.append(product['detailedDescription'])
    
    # Price (for price-based queries)
    if product.get("price"):
        parts.append(f"Giá {product['price']} đồng")
    
    # Bestseller status
    if product.get("bestseller"):
        parts.append("Sản phẩm bán chạy")
    
    # Sizes
    if product.get("sizes"):
        sizes_str = ", ".join(product['sizes'])
        parts.append(f"Size: {sizes_str}")
    
    return ". ".join(parts)


def prepare_blog_text(blog: Dict[str, Any]) -> str:
    """
    Prepare blog document text for embedding generation.
    
    Args:
        blog: Blog document from MongoDB
        
    Returns:
        Formatted text string for embedding
    """
    parts = []
    
    if blog.get("title"):
        parts.append(f"Blog: {blog['title']}")
    
    if blog.get("category"):
        parts.append(f"Category: {blog['category']}")
    
    if blog.get("description"):
        parts.append(f"Summary: {blog['description']}")
    
    if blog.get("author"):
        parts.append(f"Author: {blog['author']}")
    
    return " | ".join(parts)


def prepare_category_text(category: Dict[str, Any]) -> str:
    """
    Prepare category document text for embedding generation.
    
    Args:
        category: Category document from MongoDB
        
    Returns:
        Formatted text string for embedding
    """
    parts = []
    
    if category.get("name"):
        parts.append(f"Category: {category['name']}")
    
    if category.get("description"):
        parts.append(f"Description: {category['description']}")
    
    # Include subcategories if available
    if category.get("subcategories"):
        subcats = ", ".join(category['subcategories'])
        parts.append(f"Includes: {subcats}")
    
    return " | ".join(parts)


async def generate_product_embedding(product: Dict[str, Any]) -> List[float]:
    """
    Generate embedding specifically for a product document.
    
    Args:
        product: Product document from MongoDB
        
    Returns:
        Embedding vector for the product
    """
    text = prepare_product_text(product)
    return await generate_embedding(text)


async def generate_blog_embedding(blog: Dict[str, Any]) -> List[float]:
    """
    Generate embedding specifically for a blog document.
    
    Args:
        blog: Blog document from MongoDB
        
    Returns:
        Embedding vector for the blog
    """
    text = prepare_blog_text(blog)
    return await generate_embedding(text)


async def generate_category_embedding(category: Dict[str, Any]) -> List[float]:
    """
    Generate embedding specifically for a category document.
    
    Args:
        category: Category document from MongoDB
        
    Returns:
        Embedding vector for the category
    """
    text = prepare_category_text(category)
    return await generate_embedding(text)


# Utility function to test embedding generation
async def test_embedding_generation():
    """
    Test function to verify embedding generation works correctly.
    """
    test_text = "This is a test text for embedding generation"
    
    try:
        embedding = await generate_embedding(test_text)
        logger.info(f"✅ Test embedding generated successfully")
        logger.info(f"   Dimension: {len(embedding)}")
        logger.info(f"   First 5 values: {embedding[:5]}")
        return True
    except Exception as e:
        logger.error(f"❌ Test embedding failed: {str(e)}")
        return False


if __name__ == "__main__":
    # Test the embedding service
    import asyncio
    asyncio.run(test_embedding_generation())
