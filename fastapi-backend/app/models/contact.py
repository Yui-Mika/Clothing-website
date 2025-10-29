from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class ContactBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    subject: str = Field(..., min_length=5, max_length=200)
    message: str = Field(..., min_length=10)

class ContactCreate(ContactBase):
    pass

class Contact(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    phone: Optional[str]
    subject: str
    message: str
    status: str = "pending"  # pending, in-progress, resolved
    isRead: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ContactUpdate(BaseModel):
    status: Optional[str] = None
    isRead: Optional[bool] = None

class ContactResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    phone: Optional[str]
    subject: str
    message: str
    status: str
    isRead: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
