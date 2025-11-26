from pydantic import BaseModel
from typing import List, Literal


class OrderItemPayload(BaseModel):
    product: str
    quantity: int
    size: str


class AddressPayload(BaseModel):
    firstName: str
    lastName: str
    email: str
    street: str
    city: str
    state: str
    zipcode: str
    country: str
    phone: str


class PlaceOrderPayload(BaseModel):
    items: List[OrderItemPayload]
    address: AddressPayload


class UpdateStatusPayload(BaseModel):
    orderId: str
    status: str


