from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.models.cart import CartAdd, CartUpdate
from app.config.database import get_collection
from app.middleware.auth_user import auth_user
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/add", response_model=dict)
async def add_to_cart(cart_item: CartAdd, request: Request, user: dict = Depends(auth_user)):
    """Add item to cart"""
    users_collection = await get_collection("users")
    products_collection = await get_collection("products")
    
    # Check if product exists
    product = await products_collection.find_one({"_id": ObjectId(cart_item.itemId), "isActive": True})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if size is valid
    if cart_item.size not in product.get("sizes", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid size"
        )
    
    # Get current cart
    cart_data = user.get("cartData", {})
    
    # Add/update item in cart
    if cart_item.itemId not in cart_data:
        cart_data[cart_item.itemId] = {}
    
    if cart_item.size not in cart_data[cart_item.itemId]:
        cart_data[cart_item.itemId][cart_item.size] = 0
    
    cart_data[cart_item.itemId][cart_item.size] += 1
    
    # Update user's cart in database
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"cartData": cart_data, "updatedAt": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "message": "Item added to cart"
    }

@router.post("/update", response_model=dict)
async def update_cart(cart_item: CartUpdate, request: Request, user: dict = Depends(auth_user)):
    """Update cart item quantity"""
    users_collection = await get_collection("users")
    
    # Get current cart
    cart_data = user.get("cartData", {})
    
    # Update quantity
    if cart_item.quantity == 0:
        # Remove item if quantity is 0
        if cart_item.itemId in cart_data and cart_item.size in cart_data[cart_item.itemId]:
            del cart_data[cart_item.itemId][cart_item.size]
            if not cart_data[cart_item.itemId]:
                del cart_data[cart_item.itemId]
    else:
        # Update quantity
        if cart_item.itemId not in cart_data:
            cart_data[cart_item.itemId] = {}
        cart_data[cart_item.itemId][cart_item.size] = cart_item.quantity
    
    # Update user's cart in database
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"cartData": cart_data, "updatedAt": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "message": "Cart updated successfully"
    }

@router.get("/get", response_model=dict)
async def get_cart(request: Request, user: dict = Depends(auth_user)):
    """Get user's cart"""
    return {
        "success": True,
        "cartData": user.get("cartData", {})
    }

@router.delete("/clear", response_model=dict)
async def clear_cart(request: Request, user: dict = Depends(auth_user)):
    """Clear user's cart"""
    users_collection = await get_collection("users")
    
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"cartData": {}, "updatedAt": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "message": "Cart cleared successfully"
    }
