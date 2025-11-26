from fastapi import APIRouter, Header, Request
from app.core.config import settings
from app.db.mongo import db
from bson import ObjectId
import stripe


router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_signature: str | None = Header(default=None)):
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret,
        )
    except Exception as e:
        return {"success": False, "message": f"Webhook Error: {str(e)}"}

    if event.get("type") == "payment_intent.succeeded":
        client = stripe.StripeClient(api_key=settings.stripe_secret_key)
        payment_intent_id = event["data"]["object"]["id"]
        sessions = client.checkout.sessions.list(payment_intent=payment_intent_id)
        if sessions.data:
            meta = sessions.data[0].metadata
            order_id = meta.get("orderId")
            user_id = meta.get("userId")
            if order_id:
                await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"isPaid": True}})
            if user_id:
                await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"cartData": {}}})
    elif event.get("type") == "payment_intent.payment_failed":
        client = stripe.StripeClient(api_key=settings.stripe_secret_key)
        payment_intent_id = event["data"]["object"]["id"]
        sessions = client.checkout.sessions.list(payment_intent=payment_intent_id)
        if sessions.data:
            meta = sessions.data[0].metadata
            order_id = meta.get("orderId")
            if order_id:
                await db.orders.delete_one({"_id": ObjectId(order_id)})

    return {"received": True}


