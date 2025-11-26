from pydantic import BaseModel
from typing import List, Dict


class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    price: float
    offerPrice: float
    sizes: List[str]
    popular: bool = False


class ProductPublic(BaseModel):
    _id: str
    name: str
    description: str
    category: str
    price: float
    offerPrice: float
    sizes: List[str]
    popular: bool
    image: List[str]


