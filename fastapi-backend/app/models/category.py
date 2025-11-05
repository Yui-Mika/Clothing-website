from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    slug: Optional[str] = None  # Tự động tạo từ name nếu không cung cấp
    description: Optional[str] = None
    image: Optional[str] = None
    order: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class Category(BaseModel):
    id: str = Field(alias="_id")
    name: str
    slug: str
    description: Optional[str]
    image: Optional[str]
    inStock: bool = True  # Đổi từ isActive thành inStock
    order: int = 1
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    inStock: Optional[bool] = None  # Đổi từ isActive thành inStock
    order: Optional[int] = None

class CategoryResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    slug: str
    description: Optional[str]
    image: Optional[str]
    inStock: bool  # Đổi từ isActive thành inStock
    order: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
