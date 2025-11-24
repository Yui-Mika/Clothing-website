from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.models.cart import CartAdd, CartUpdate
from app.config.database import get_collection
from app.middleware.auth_user import auth_user
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/add")
async def add_to_cart(cart_item: CartAdd, request: Request, user: dict = Depends(auth_user)):
    """Add item to cart"""
    try:
        print("="*80)
        print("🎯 ADD_TO_CART FUNCTION CALLED!")
        print(f"📦 cart_item: itemId={cart_item.itemId}, size={cart_item.size}")
        print(f"👤 user: {user.get('email')}")
        print("="*80)
        
        users_collection = await get_collection("users")
        products_collection = await get_collection("products")
        
        print(f"🔍 Looking for product: {cart_item.itemId}")
        # Check if product exists
        product = await products_collection.find_one({"_id": ObjectId(cart_item.itemId), "isActive": True})
        print(f"🔍 Product found: {product is not None}")
        
        if not product:
            print("❌ Product not found!")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sản phẩm"
            )
        
        print(f"🔍 Product sizes: {product.get('sizes', [])}")
        # Check if size is valid
        if cart_item.size not in product.get("sizes", []):
            print(f"❌ Invalid size: {cart_item.size}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kích cỡ không hợp lệ"
            )
        
        # Get current cart
        cart_data = user.get("cartData", {})
        print(f"🔍 Current cart: {cart_data}")
        
        # Add/update item in cart
        if cart_item.itemId not in cart_data:
            cart_data[cart_item.itemId] = {}
        
        if cart_item.size not in cart_data[cart_item.itemId]:
            cart_data[cart_item.itemId][cart_item.size] = 0
        
        cart_data[cart_item.itemId][cart_item.size] += 1
        print(f"🔍 Updated cart: {cart_data}")
        
        # Update user's cart in database
        result = await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"cartData": cart_data, "updatedAt": datetime.utcnow()}}
        )
        print(f"✅ DB update result: modified_count={result.modified_count}")
        
        return {
            "success": True,
            "message": "Đã thêm sản phẩm vào giỏ hàng"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/update")
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
        "message": "Cập nhật giỏ hàng thành công"
    }

@router.get("/get")
async def get_cart(request: Request, user: dict = Depends(auth_user)):
    """Get user's cart"""
    return {
        "success": True,
        "cartData": user.get("cartData", {})
    }

@router.delete("/clear")
async def clear_cart(request: Request, user: dict = Depends(auth_user)):
    """Clear user's cart"""
    users_collection = await get_collection("users")
    
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"cartData": {}, "updatedAt": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "message": "Đã xóa giỏ hàng thành công"
    }
