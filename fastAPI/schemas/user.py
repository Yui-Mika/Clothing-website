from pydantic import BaseModel, EmailStr, Field
from typing import Dict


class RegisterPayload(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    name: str
    email: EmailStr
    cartData: Dict[str, Dict[str, int]] | None = None


class UserDoc(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "user"
    cartData: Dict[str, Dict[str, int]] = {}


