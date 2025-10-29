from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from bson import ObjectId

class OrderItem(BaseModel):
    product: str  # Product ID
    quantity: int = Field(..., gt=0)
    size: str

class OrderAddress(BaseModel):
    firstName: str
    lastName: str
    email: str
    street: str
    city: str
    state: str
    zipcode: str
    country: str
    phone: str

class OrderCreate(BaseModel):
    items: List[OrderItem]
    address: OrderAddress

class Order(BaseModel):
    id: str = Field(alias="_id")
    userId: str
    items: List[Dict]  # Will be populated with product details
    amount: float
    address: OrderAddress
    status: str = "Order Placed"  # Order Placed, Processing, Shipped, Delivered, Cancelled
    paymentMethod: str = "COD"  # COD or Stripe
    isPaid: bool = False
    paidAt: Optional[datetime] = None
    stripeSessionId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class OrderResponse(BaseModel):
    id: str = Field(alias="_id")
    userId: str
    items: List[Dict]
    amount: float
    address: OrderAddress
    status: str
    paymentMethod: str
    isPaid: bool
    paidAt: Optional[datetime]
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class OrderStatusUpdate(BaseModel):
    orderId: str
    status: str
