# MongoDB Vector Search Setup Guide

This guide explains how to set up MongoDB Atlas Vector Search for the RAG chatbot system.

## Overview

We need to add vector embeddings to three collections and create Atlas Search vector indexes:
- **products** - E-commerce product catalog
- **blogs** - Blog articles and content
- **categories** - Product categories

Each document will have an `embedding` field containing a 768-dimensional vector (from Google Gemini's text-embedding-004 model).

## Step 1: Update MongoDB Collections

### Add Embedding Field

The `embedding` field will be added automatically when you run the sync script (Task 8). The field structure:

```json
{
  "_id": ObjectId("..."),
  // ... existing fields ...
  "embedding": [0.123, -0.456, 0.789, ... ] // 768 floats
}
```

**Note:** You don't need to manually add this field. The embedding sync script will handle it.

## Step 2: Create Atlas Search Vector Indexes

You need to create Vector Search indexes in MongoDB Atlas for each collection.

### Access Atlas Search

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to your cluster: `veloura-cluster`
3. Click on **"Search"** tab
4. Click **"Create Search Index"**

### Index Configuration for Products Collection

**Index Name:** `vector_index_products`

**Definition (JSON):**

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    },
    {
      "type": "filter",
      "path": "subCategory"
    },
    {
      "type": "filter",
      "path": "bestseller"
    }
  ]
}
```

**Target Collection:** `products`

**Explanation:**
- `vector` field on `embedding` enables semantic search
- `numDimensions`: 768 for Google Gemini text-embedding-004 model
- `filter` fields allow combining vector search with metadata filters (e.g., search only "Men" category)
- `cosine` similarity is ideal for Gemini embeddings

### Index Configuration for Blogs Collection

**Index Name:** `vector_index_blogs`

**Definition (JSON):**

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    },
    {
      "type": "filter",
      "path": "author"
    }
  ]
}
```

**Target Collection:** `blogs`

### Index Configuration for Categories Collection

**Index Name:** `vector_index_categories`

**Definition (JSON):**

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

**Target Collection:** `categories`

## Step 3: Verify Indexes

After creating indexes, verify they are active:

1. In Atlas Search tab, you should see all three indexes with status **"Active"**
2. Index build time: Usually 1-5 minutes depending on collection size
3. If status shows **"Building"**, wait for it to complete

## Step 4: Test Vector Search

Once indexes are active and embeddings are synced, test with this MongoDB aggregation:

```javascript
db.products.aggregate([
  {
    "$vectorSearch": {
      "index": "vector_index_products",
      "path": "embedding",
      "queryVector": [/* 1536-dimensional query vector */],
      "numCandidates": 100,
      "limit": 5
    }
  },
  {
    "$project": {
      "name": 1,
      "category": 1,
      "description": 1,
      "price": 1,
      "score": { "$meta": "vectorSearchScore" }
    }
  }
])
```

## Troubleshooting

### Index Creation Failed

**Problem:** "Field type 'vector' is not supported"

**Solution:** 
- Ensure your MongoDB Atlas cluster is M10 or higher (Vector Search requires dedicated clusters)
- Update to the latest MongoDB version (6.0.11+ or 7.0+)

### No Results from Vector Search

**Problem:** Query returns empty results

**Check:**
1. Are embeddings populated? Run: `db.products.findOne({embedding: {$exists: true}})`
2. Is index status "Active"?
3. Are you using the correct index name in `$vectorSearch`?

### Slow Search Performance

**Problem:** Vector search takes >2 seconds

**Solutions:**
- Increase `numCandidates` (trade-off: accuracy vs speed)
- Use pre-filtering with `filter` field to narrow search space
- Consider upgrading cluster tier for better performance

## Next Steps

After completing this setup:

1. ✅ Vector indexes created in Atlas
2. ⏳ Run embedding sync script (Task 8) to populate embeddings
3. ⏳ Build RAG retrieval service (Task 4) to use these indexes
4. ⏳ Create chat API routes (Task 5) for user interaction

## Additional Resources

- [MongoDB Atlas Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/)
- [Atlas Search Index JSON Syntax](https://www.mongodb.com/docs/atlas/atlas-search/define-field-mappings/)
- [Google Gemini Embeddings Guide](https://ai.google.dev/gemini-api/docs/embeddings)

---

**Important Notes:**

1. **Atlas Tier Requirement:** Vector Search requires M10+ cluster (not available on M0/M2/M5 free tiers)
2. **Embedding Sync:** Must run sync script before vector search works
3. **Index Names:** Use exact names (`vector_index_products`, etc.) - the RAG service depends on these
4. **Dimension:** Google Gemini text-embedding-004 uses 768 dimensions (different from OpenAI's 1536)
