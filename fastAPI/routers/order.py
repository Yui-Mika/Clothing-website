from typing import List
from fastapi import APIRouter, Depends, Request
from bson import ObjectId
from app.db.mongo import db
from app.schemas.order import PlaceOrderPayload, UpdateStatusPayload
from app.dependencies.auth import require_user, require_admin


router = APIRouter()


CURRENCY = "pkr"
DELIVERY_CHARGES = 10
TAX_PERCENTAGE = 0.02


async def compute_subtotal(items: List[dict]) -> float:
    subtotal = 0.0
    for item in items:
        prod = await db.products.find_one({"_id": ObjectId(item["product"])})
        if not prod:
            continue
        subtotal += float(prod.get("offerPrice", 0)) * int(item.get("quantity", 0))
    return subtotal


@router.post("/cod")
async def place_order_cod(payload: PlaceOrderPayload, user_id: str = Depends(require_user)):
    if len(payload.items) == 0:
        return {"success": False, "message": "Please add product first"}
    subtotal = await compute_subtotal([i.model_dump() for i in payload.items])
    tax_amount = subtotal * TAX_PERCENTAGE
    total_amount = subtotal + tax_amount + DELIVERY_CHARGES
    await db.orders.insert_one({
        "userId": ObjectId(user_id),
        "items": [i.model_dump() for i in payload.items],
        "amount": total_amount,
        "address": payload.address.model_dump(),
        "paymentMethod": "COD",
        "isPaid": True,
        "status": "Pending",
    })
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"cartData": {}}})
    return {"success": True, "message": "Order Placed"}


@router.post("/stripe")
async def place_order_stripe(payload: PlaceOrderPayload, request: Request, user_id: str = Depends(require_user)):
    if len(payload.items) == 0:
        return {"success": False, "message": "Please add product first"}
    subtotal = await compute_subtotal([i.model_dump() for i in payload.items])
    tax_amount = subtotal * TAX_PERCENTAGE
    amount = subtotal + tax_amount + DELIVERY_CHARGES
    order_res = await db.orders.insert_one({
        "userId": ObjectId(user_id),
        "items": [i.model_dump() for i in payload.items],
        "amount": amount,
        "address": payload.address.model_dump(),
        "paymentMethod": "stripe",
        "isPaid": False,
        "status": "Pending",
    })
    # For simplicity, redirect URL placeholder (integrate Stripe later)
    origin = request.headers.get("origin", "http://localhost:5173")
    url = f"{origin}/loader?next=my-orders"
    return {"success": True, "url": url}


@router.post("/userorders")
async def user_orders(user_id: str = Depends(require_user)):
    pipeline = [
        {"$match": {"userId": ObjectId(user_id), "$or": [{"paymentMethod": "COD"}, {"isPaid": True}] }},
        {"$sort": {"createdAt": -1}},
        {"$lookup": {"from": "products", "localField": "items.product", "foreignField": "_id", "as": "products_join"}},
    ]
    orders = [o async for o in db.orders.aggregate(pipeline)]
    # Map joined products back into items
    by_id = {}
    for o in orders:
        by_id.clear()
        for p in o.get("products_join", []):
            by_id[str(p.get("_id"))] = p
        for it in o.get("items", []):
            prod_id = str(it.get("product")) if isinstance(it.get("product"), ObjectId) else it.get("product")
            it["product"] = by_id.get(prod_id) or {}
    return {"success": True, "orders": orders}


@router.post("/list")
async def all_orders(_: None = Depends(require_admin)):
    pipeline = [
        {"$match": {"$or": [{"paymentMethod": "COD"}, {"isPaid": True}]}},
        {"$sort": {"createdAt": -1}},
        {"$lookup": {"from": "products", "localField": "items.product", "foreignField": "_id", "as": "products_join"}},
    ]
    orders = [o async for o in db.orders.aggregate(pipeline)]
    by_id = {}
    for o in orders:
        by_id.clear()
        for p in o.get("products_join", []):
            by_id[str(p.get("_id"))] = p
        for it in o.get("items", []):
            prod_id = str(it.get("product")) if isinstance(it.get("product"), ObjectId) else it.get("product")
            it["product"] = by_id.get(prod_id) or {}
    return {"success": True, "orders": orders}


@router.post("/status")
async def update_status(payload: UpdateStatusPayload, _: None = Depends(require_admin)):
    await db.orders.update_one({"_id": ObjectId(payload.orderId)}, {"$set": {"status": payload.status}})
    return {"success": True, "message": "Order Status Updated"}


