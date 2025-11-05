from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class ProductDetails(BaseModel):
    material: str
    fit: str
    care: str
    features: List[str] = Field(default_factory=list)
    weight: str
    origin: str

class ProductBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    price: float = Field(..., gt=0)
    offerPrice: float = Field(..., gt=0)
    category: str
    sizes: List[str] = Field(default_factory=list)
    colors: Optional[List[str]] = Field(default_factory=list)
    details: Optional[ProductDetails] = None
    popular: bool = False

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
    colors: Optional[List[str]] = Field(default_factory=list)
    details: Optional[ProductDetails] = None
    popular: bool
    inStock: bool = True
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
    colors: Optional[List[str]] = None
    details: Optional[ProductDetails] = None
    popular: Optional[bool] = None
    image: Optional[List[str]] = None
    inStock: Optional[bool] = None

class ProductResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    description: str
    image: List[str]
    price: float
    offerPrice: float
    category: str
    sizes: List[str]
    colors: Optional[List[str]] = Field(default_factory=list)
    details: Optional[ProductDetails] = None
    popular: bool
    inStock: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
