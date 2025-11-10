from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List
from datetime import datetime, date
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    address: Optional[str] = Field(None, max_length=200)
    dateOfBirth: Optional[date] = Field(None, description="Date of birth (YYYY-MM-DD)")
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")

class UserCreate(UserBase):
    pass

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    dateOfBirth: Optional[date] = None
    gender: Optional[str] = None
    cartData: Dict[str, Dict[str, int]] = Field(default_factory=dict)
    role: str = "customer"  # customer, staff, admin
    emailVerified: bool = False  # 👈 Thêm field xác thực email
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    dateOfBirth: Optional[date] = None
    gender: Optional[str] = None
    role: str
    cartData: Dict[str, Dict[str, int]] = Field(default_factory=dict)
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    dateOfBirth: Optional[date] = None
    gender: Optional[str] = None
    role: Optional[str] = None
    isActive: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str
    email: str
    role: str

class VerifyCodeRequest(BaseModel):
    """Request model for email verification with OTP code"""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern="^[0-9]{6}$")

class ResendCodeRequest(BaseModel):
    """Request model for resending verification code"""
    email: EmailStr
