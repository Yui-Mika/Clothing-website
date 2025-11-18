from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class TestimonialCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: str = Field(..., min_length=10, max_length=500, description="Review comment")

class TestimonialUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = Field(None, min_length=10, max_length=500, description="Review comment")

class TestimonialResponse(BaseModel):
    id: str = Field(alias="_id")
    userId: str
    userName: str
    userAvatar: str
    rating: int
    comment: str
    status: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "_id": "673b1234567890abcdef0001",
                "userId": "673b1234567890abcdef0001",
                "userName": "John Doe",
                "userAvatar": "https://i.pravatar.cc/150?img=1",
                "rating": 5,
                "comment": "Great service! Fast delivery and excellent quality.",
                "status": "approved",
                "createdAt": "2025-11-18T10:00:00Z",
                "updatedAt": "2025-11-18T12:00:00Z"
            }
        }

        populate_by_name = True
        json_encoders = {ObjectId: str}
