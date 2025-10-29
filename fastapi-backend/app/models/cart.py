from pydantic import BaseModel, Field
from typing import Dict

class CartAdd(BaseModel):
    itemId: str
    size: str

class CartUpdate(BaseModel):
    itemId: str
    size: str
    quantity: int = Field(..., ge=0)

class CartResponse(BaseModel):
    cartData: Dict[str, Dict[str, int]]
    message: str
