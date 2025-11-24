"""
Wishlist Routes
Các endpoint để quản lý wishlist của user:
- GET /api/wishlist - Lấy danh sách sản phẩm trong wishlist
- GET /api/wishlist/count - Đếm số lượng sản phẩm
- GET /api/wishlist/check/{productId} - Kiểm tra sản phẩm có trong wishlist
- POST /api/wishlist/add - Thêm sản phẩm vào wishlist
- DELETE /api/wishlist/remove - Xóa sản phẩm khỏi wishlist
- DELETE /api/wishlist/clear - Xóa toàn bộ wishlist
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.middleware.auth_user import auth_user
from app.config.database import get_collection
from app.models.wishlist import AddToWishlistRequest, RemoveFromWishlistRequest
from bson import ObjectId
from datetime import datetime
from typing import List, Dict

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

# ============================================================================
# GET WISHLIST - Lấy danh sách sản phẩm trong wishlist
# ============================================================================
@router.get("", response_model=dict)
async def get_wishlist(request: Request, user=Depends(auth_user)):
    """
    Lấy toàn bộ sản phẩm trong wishlist của user
    - Protected endpoint (cần login)
    - Trả về danh sách sản phẩm với đầy đủ thông tin (join với products collection)
    """
    try:
        print(f"🔍 Getting wishlist for user: {user.get('email')}")
        
        # Lấy wishlist collection
        wishlist_collection = await get_collection("wishlists")
        products_collection = await get_collection("products")
        
        # Tìm wishlist của user
        user_id = str(user["_id"])
        wishlist = await wishlist_collection.find_one({"userId": user_id})
        
        if not wishlist or not wishlist.get("products"):
            print(f"✅ User has empty wishlist")
            return {
                "success": True,
                "count": 0,
                "products": []
            }
        
        # Lấy danh sách productId từ wishlist
        product_ids = [ObjectId(item["productId"]) for item in wishlist["products"]]
        
        # Query tất cả products từ database
        products_cursor = products_collection.find({"_id": {"$in": product_ids}})
        products = await products_cursor.to_list(length=None)
        
        # Format products data và thêm addedAt timestamp
        formatted_products = []
        for product in products:
            # Tìm addedAt từ wishlist
            wishlist_item = next((item for item in wishlist["products"] if item["productId"] == str(product["_id"])), None)
            
            product["_id"] = str(product["_id"])
            product["addedAt"] = wishlist_item["addedAt"] if wishlist_item else datetime.utcnow()
            formatted_products.append(product)
        
        # Sort theo thời gian thêm (mới nhất lên đầu)
        formatted_products.sort(key=lambda x: x.get("addedAt", datetime.min), reverse=True)
        
        print(f"✅ Found {len(formatted_products)} products in wishlist")
        
        return {
            "success": True,
            "count": len(formatted_products),
            "products": formatted_products
        }
        
    except Exception as e:
        print(f"❌ Error getting wishlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get wishlist: {str(e)}"
        )

# ============================================================================
# GET WISHLIST COUNT - Đếm số lượng sản phẩm
# ============================================================================
@router.get("/count", response_model=dict)
async def get_wishlist_count(request: Request, user=Depends(auth_user)):
    """
    Đếm số lượng sản phẩm trong wishlist
    - Dùng để hiển thị badge số lượng ở icon wishlist
    """
    try:
        wishlist_collection = await get_collection("wishlists")
        user_id = str(user["_id"])
        
        wishlist = await wishlist_collection.find_one({"userId": user_id})
        
        count = len(wishlist.get("products", [])) if wishlist else 0
        
        print(f"✅ Wishlist count for {user.get('email')}: {count}")
        
        return {
            "success": True,
            "count": count
        }
        
    except Exception as e:
        print(f"❌ Error getting wishlist count: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get wishlist count: {str(e)}"
        )

# ============================================================================
# CHECK PRODUCT IN WISHLIST - Kiểm tra sản phẩm có trong wishlist
# ============================================================================
@router.get("/check/{productId}", response_model=dict)
async def check_in_wishlist(productId: str, request: Request, user=Depends(auth_user)):
    """
    Kiểm tra xem một sản phẩm có trong wishlist hay không
    - Dùng để hiển thị trạng thái button wishlist (filled/outline heart)
    """
    try:
        wishlist_collection = await get_collection("wishlists")
        user_id = str(user["_id"])
        
        wishlist = await wishlist_collection.find_one({"userId": user_id})
        
        in_wishlist = False
        if wishlist and wishlist.get("products"):
            in_wishlist = any(item["productId"] == productId for item in wishlist["products"])
        
        print(f"✅ Product {productId} in wishlist: {in_wishlist}")
        
        return {
            "success": True,
            "inWishlist": in_wishlist
        }
        
    except Exception as e:
        print(f"❌ Error checking product in wishlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check product: {str(e)}"
        )

# ============================================================================
# ADD TO WISHLIST - Thêm sản phẩm vào wishlist
# ============================================================================
@router.post("/add", response_model=dict)
async def add_to_wishlist(request_data: AddToWishlistRequest, request: Request, user=Depends(auth_user)):
    """
    Thêm sản phẩm vào wishlist
    - Validate productId tồn tại
    - Kiểm tra duplicate (không thêm sản phẩm đã có)
    - Tự động tạo wishlist mới nếu user chưa có
    """
    try:
        product_id = request_data.productId
        print(f"🔍 Adding product {product_id} to wishlist for user {user.get('email')}")
        
        # Validate product tồn tại
        products_collection = await get_collection("products")
        product = await products_collection.find_one({"_id": ObjectId(product_id)})
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sản phẩm"
            )
        
        wishlist_collection = await get_collection("wishlists")
        user_id = str(user["_id"])
        
        # Tìm wishlist của user
        wishlist = await wishlist_collection.find_one({"userId": user_id})
        
        if not wishlist:
            # Tạo wishlist mới nếu chưa có
            new_wishlist = {
                "userId": user_id,
                "products": [
                    {
                        "productId": product_id,
                        "addedAt": datetime.utcnow()
                    }
                ],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            await wishlist_collection.insert_one(new_wishlist)
            print(f"✅ Created new wishlist and added product")
            
            return {
                "success": True,
                "message": "Đã thêm sản phẩm vào danh sách yêu thích",
                "count": 1
            }
        
        # Kiểm tra duplicate
        existing_products = [item["productId"] for item in wishlist.get("products", [])]
        if product_id in existing_products:
            print(f"⚠️ Product already in wishlist")
            return {
                "success": False,
                "message": "Product already in wishlist",
                "count": len(existing_products)
            }
        
        # Thêm product vào wishlist
        await wishlist_collection.update_one(
            {"userId": user_id},
            {
                "$push": {
                    "products": {
                        "productId": product_id,
                        "addedAt": datetime.utcnow()
                    }
                },
                "$set": {
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        new_count = len(existing_products) + 1
        print(f"✅ Product added to wishlist. New count: {new_count}")
        
        return {
            "success": True,
            "message": "Đã thêm sản phẩm vào danh sách yêu thích",
            "count": new_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error adding to wishlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add to wishlist: {str(e)}"
        )

# ============================================================================
# REMOVE FROM WISHLIST - Xóa sản phẩm khỏi wishlist
# ============================================================================
@router.delete("/remove", response_model=dict)
async def remove_from_wishlist(request_data: RemoveFromWishlistRequest, request: Request, user=Depends(auth_user)):
    """
    Xóa sản phẩm khỏi wishlist
    - Xóa productId khỏi products array
    - Cập nhật updatedAt timestamp
    """
    try:
        product_id = request_data.productId
        print(f"🔍 Removing product {product_id} from wishlist for user {user.get('email')}")
        
        wishlist_collection = await get_collection("wishlists")
        user_id = str(user["_id"])
        
        # Xóa product khỏi wishlist
        result = await wishlist_collection.update_one(
            {"userId": user_id},
            {
                "$pull": {
                    "products": {"productId": product_id}
                },
                "$set": {
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            print(f"⚠️ Product not found in wishlist or wishlist doesn't exist")
            return {
                "success": False,
                "message": "Product not in wishlist",
                "count": 0
            }
        
        # Lấy count mới
        wishlist = await wishlist_collection.find_one({"userId": user_id})
        new_count = len(wishlist.get("products", [])) if wishlist else 0
        
        print(f"✅ Product removed from wishlist. New count: {new_count}")
        
        return {
            "success": True,
            "message": "Đã xóa sản phẩm khỏi danh sách yêu thích",
            "count": new_count
        }
        
    except Exception as e:
        print(f"❌ Error removing from wishlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove from wishlist: {str(e)}"
        )

# ============================================================================
# CLEAR WISHLIST - Xóa toàn bộ wishlist
# ============================================================================
@router.delete("/clear", response_model=dict)
async def clear_wishlist(request: Request, user=Depends(auth_user)):
    """
    Xóa toàn bộ sản phẩm trong wishlist
    - Xóa hết products array nhưng giữ wishlist document
    """
    try:
        print(f"🔍 Clearing wishlist for user {user.get('email')}")
        
        wishlist_collection = await get_collection("wishlists")
        user_id = str(user["_id"])
        
        # Xóa tất cả products
        await wishlist_collection.update_one(
            {"userId": user_id},
            {
                "$set": {
                    "products": [],
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        print(f"✅ Wishlist cleared")
        
        return {
            "success": True,
            "message": "Wishlist cleared",
            "count": 0
        }
        
    except Exception as e:
        print(f"❌ Error clearing wishlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear wishlist: {str(e)}"
        )
