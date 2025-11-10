"""
Wishlist Model
- Mỗi user có 1 wishlist document duy nhất
- Chứa array các productId mà user yêu thích
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class WishlistProduct(BaseModel):
    """Model cho mỗi product trong wishlist"""
    productId: str = Field(..., description="ID của sản phẩm")
    addedAt: datetime = Field(default_factory=datetime.utcnow, description="Thời gian thêm vào wishlist")

class Wishlist(BaseModel):
    """Model cho wishlist document trong MongoDB"""
    userId: str = Field(..., description="ID của user sở hữu wishlist")
    products: List[WishlistProduct] = Field(default=[], description="Danh sách sản phẩm trong wishlist")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "690cd1522ef08cb266263c2d",
                "products": [
                    {
                        "productId": "507f1f77bcf86cd799439011",
                        "addedAt": "2025-11-10T10:30:00Z"
                    }
                ],
                "createdAt": "2025-11-10T10:00:00Z",
                "updatedAt": "2025-11-10T10:30:00Z"
            }
        }

class AddToWishlistRequest(BaseModel):
    """Request model cho thêm sản phẩm vào wishlist"""
    productId: str = Field(..., description="ID của sản phẩm cần thêm")

class RemoveFromWishlistRequest(BaseModel):
    """Request model cho xóa sản phẩm khỏi wishlist"""
    productId: str = Field(..., description="ID của sản phẩm cần xóa")
