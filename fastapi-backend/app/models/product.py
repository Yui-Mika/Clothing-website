from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class ProductBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    price: float = Field(..., gt=0)
    offerPrice: float = Field(..., gt=0)
    category: str
    sizes: List[str] = Field(default_factory=list)
    popular: bool = False
    stock: int = Field(default=20, ge=0)

class ProductCreate(ProductBase):
    pass

class Product(BaseModel):
    id: str = Field(alias="_id")
    name: str
    description: str
    image: List[str] = Field(default_factory=list)
    price: float
    offerPrice: float
    category: str
    sizes: List[str]
    popular: bool
    stock: int = Field(default=20, ge=0)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    offerPrice: Optional[float] = None
    category: Optional[str] = None
    sizes: Optional[List[str]] = None
    popular: Optional[bool] = None
    image: Optional[List[str]] = None
    stock: Optional[int] = Field(None, ge=0)

class ProductResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    description: str
    image: List[str]
    price: float
    offerPrice: float
    category: str
    sizes: List[str]
    popular: bool
    stock: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
