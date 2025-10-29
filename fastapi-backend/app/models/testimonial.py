from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class TestimonialBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    role: Optional[str] = "Customer"
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=10)
    image: Optional[str] = None

class TestimonialCreate(TestimonialBase):
    pass

class Testimonial(BaseModel):
    id: str = Field(alias="_id")
    name: str
    role: str
    rating: int
    comment: str
    image: Optional[str]
    isApproved: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class TestimonialUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    rating: Optional[int] = None
    comment: Optional[str] = None
    image: Optional[str] = None
    isApproved: Optional[bool] = None

class TestimonialResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    role: str
    rating: int
    comment: str
    image: Optional[str]
    isApproved: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
