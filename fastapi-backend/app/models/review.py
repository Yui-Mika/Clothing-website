from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from bson import ObjectId

class ReviewCreate(BaseModel):
    productId: str
    rating: int = Field(..., ge=1, le=5)
    title: str = Field(..., min_length=5, max_length=100)
    comment: str = Field(..., min_length=20, max_length=1000)

    @validator('title')
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

    @validator('comment')
    def comment_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Comment cannot be empty')
        return v.strip()

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, min_length=5, max_length=100)
    comment: Optional[str] = Field(None, min_length=20, max_length=1000)

class Review(BaseModel):
    id: str = Field(alias="_id")
    productId: str
    userId: str
    rating: int
    title: str
    comment: str
    userName: str
    userAvatar: str
    verified: bool
    purchaseDate: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ReviewResponse(BaseModel):
    id: str = Field(alias="_id")
    productId: str
    userId: str
    rating: int
    title: str
    comment: str
    userName: str
    userAvatar: str
    verified: bool
    purchaseDate: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True

class ReviewStats(BaseModel):
    averageRating: float
    totalReviews: int
    ratingDistribution: dict  # {1: count, 2: count, 3: count, 4: count, 5: count}
