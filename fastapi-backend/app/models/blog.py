from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class BlogBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    category: str
    content: str = Field(..., min_length=50)
    image: Optional[str] = None
    author: Optional[str] = "Admin"

class BlogCreate(BlogBase):
    pass

class Blog(BaseModel):
    id: str = Field(alias="_id")
    title: str
    category: str
    content: str
    image: Optional[str]
    author: str
    isPublished: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class BlogUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    image: Optional[str] = None
    author: Optional[str] = None
    isPublished: Optional[bool] = None

class BlogResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    category: str
    content: str
    image: Optional[str]
    author: str
    isPublished: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
