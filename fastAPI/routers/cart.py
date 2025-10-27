from fastapi import APIRouter, Depends
from app.db.mongo import db
from app.dependencies.auth import require_user
from bson import ObjectId


router = APIRouter()


@router.post("/add")
async def add_to_cart(payload: dict, user_id: str = Depends(require_user)):
    item_id = payload.get("itemId")
    size = payload.get("size")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    cart = user.get("cartData", {}) if user else {}
    cart.setdefault(item_id, {})
    cart[item_id][size] = cart[item_id].get(size, 0) + 1
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"cartData": cart}})
    return {"success": True, "message": "Added to Cart"}


@router.post("/update")
async def update_cart(payload: dict, user_id: str = Depends(require_user)):
    item_id = payload.get("itemId")
    size = payload.get("size")
    quantity = payload.get("quantity")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    cart = user.get("cartData", {}) if user else {}
    if item_id not in cart:
        cart[item_id] = {}
    cart[item_id][size] = quantity
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"cartData": cart}})
    return {"success": True, "message": "Cart Updated"}


