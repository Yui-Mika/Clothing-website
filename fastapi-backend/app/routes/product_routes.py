from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from app.models.product import ProductCreate, ProductResponse, ProductUpdate
from app.config.database import get_collection
from app.middleware.auth_admin import auth_staff
from app.config.cloudinary import upload_image
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
import json

router = APIRouter()

@router.get("/list", response_model=dict)
async def get_all_products(
    category: Optional[str] = None,
    popular: Optional[bool] = None,
    search: Optional[str] = None
):
    """Get all active products with optional filters"""
    products_collection = await get_collection("products")
    
    # Build filter query - only show products with stock > 0
    query = {"stock": {"$gt": 0}}
    
    if category:
        query["category"] = category
    
    if popular is not None:
        query["popular"] = popular
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await products_collection.find(query).to_list(length=None)
    
    # Convert ObjectId to string
    for product in products:
        product["_id"] = str(product["_id"])
    
    return {
        "success": True,
        "products": products
    }

@router.get("/{product_id}", response_model=dict)
async def get_product(product_id: str):
    """Get single product by ID"""
    products_collection = await get_collection("products")
    
    product = await products_collection.find_one({"_id": ObjectId(product_id), "stock": {"$gt": 0}})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    product["_id"] = str(product["_id"])
    
    return {
        "success": True,
        "product": product
    }

@router.post("/add", response_model=dict)
async def add_product(
    productData: str = Form(...),
    images: List[UploadFile] = File(...),
    staff: dict = Depends(auth_staff)
):
    """Add new product (Staff/Admin only)"""
    products_collection = await get_collection("products")
    
    # Parse product data
    product_dict = json.loads(productData)
    
    # Upload images to Cloudinary
    image_urls = []
    for image in images:
        content = await image.read()
        url = await upload_image(content, folder="veloura/products")
        image_urls.append(url)
    
    # Create product document
    product_doc = {
        "name": product_dict["name"],
        "description": product_dict["description"],
        "price": float(product_dict["price"]),
        "offerPrice": float(product_dict["offerPrice"]),
        "category": product_dict["category"],
        "sizes": product_dict["sizes"],
        "popular": product_dict.get("popular", False),
        "image": image_urls,
        "stock": product_dict.get("stock", 20),  # Default stock is 20
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await products_collection.insert_one(product_doc)
    
    return {
        "success": True,
        "message": "Product added successfully",
        "productId": str(result.inserted_id)
    }

@router.put("/{product_id}", response_model=dict)
async def update_product(
    product_id: str,
    productData: Optional[str] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    staff: dict = Depends(auth_staff)
):
    """Update product (Staff/Admin only)"""
    products_collection = await get_collection("products")
    
    # Check if product exists
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    update_data = {}
    
    # Parse product data if provided
    if productData:
        product_dict = json.loads(productData)
        if "name" in product_dict:
            update_data["name"] = product_dict["name"]
        if "description" in product_dict:
            update_data["description"] = product_dict["description"]
        if "price" in product_dict:
            update_data["price"] = float(product_dict["price"])
        if "offerPrice" in product_dict:
            update_data["offerPrice"] = float(product_dict["offerPrice"])
        if "category" in product_dict:
            update_data["category"] = product_dict["category"]
        if "sizes" in product_dict:
            update_data["sizes"] = product_dict["sizes"]
        if "popular" in product_dict:
            update_data["popular"] = product_dict["popular"]
        if "stock" in product_dict:
            update_data["stock"] = int(product_dict["stock"])
    
    # Upload new images if provided
    if images:
        image_urls = []
        for image in images:
            content = await image.read()
            url = await upload_image(content, folder="veloura/products")
            image_urls.append(url)
        update_data["image"] = image_urls
    
    update_data["updatedAt"] = datetime.utcnow()
    
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "message": "Product updated successfully"
    }

@router.delete("/{product_id}", response_model=dict)
async def delete_product(product_id: str, staff: dict = Depends(auth_staff)):
    """Soft delete product by setting stock to 0 (Staff/Admin only)"""
    products_collection = await get_collection("products")
    
    result = await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"stock": 0, "updatedAt": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return {
        "success": True,
        "message": "Product deleted successfully"
    }

@router.get("/category/{category}", response_model=dict)
async def get_products_by_category(category: str):
    """Get products by category"""
    products_collection = await get_collection("products")
    
    products = await products_collection.find({
        "category": category,
        "stock": {"$gt": 0}
    }).to_list(length=None)
    
    for product in products:
        product["_id"] = str(product["_id"])
    
    return {
        "success": True,
        "products": products
    }
