from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.models.order import OrderCreate, OrderStatusUpdate
from app.config.database import get_collection
from app.middleware.auth_user import auth_user
from app.middleware.auth_admin import auth_staff
from app.config.settings import settings
from bson import ObjectId
from datetime import datetime
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter()

@router.post("/cod", response_model=dict)
async def place_cod_order(order_data: OrderCreate, request: Request, user: dict = Depends(auth_user)):
    """Place order with Cash on Delivery"""
    products_collection = await get_collection("products")
    orders_collection = await get_collection("orders")
    users_collection = await get_collection("users")
    
    # Get product details and calculate total
    order_items = []
    total_amount = 0
    
    for item in order_data.items:
        product = await products_collection.find_one({"_id": ObjectId(item.product), "isActive": True})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product} not found"
            )
        
        item_total = product["offerPrice"] * item.quantity
        total_amount += item_total
        
        order_items.append({
            "product": {
                "_id": str(product["_id"]),
                "name": product["name"],
                "image": product["image"],
                "offerPrice": product["offerPrice"]
            },
            "quantity": item.quantity,
            "size": item.size
        })
    
    # Add delivery charges
    total_amount += settings.DELIVERY_CHARGES
    
    # Create order
    order_doc = {
        "userId": str(user["_id"]),
        "items": order_items,
        "amount": total_amount,
        "address": order_data.address.model_dump(),
        "status": "Order Placed",
        "paymentMethod": "COD",
        "isPaid": False,
        "paidAt": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await orders_collection.insert_one(order_doc)
    
    # Clear user's cart
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"cartData": {}, "updatedAt": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "message": "Order placed successfully",
        "orderId": str(result.inserted_id)
    }

@router.post("/stripe", response_model=dict)
async def place_stripe_order(order_data: OrderCreate, request: Request, user: dict = Depends(auth_user)):
    """Place order with Stripe payment"""
    products_collection = await get_collection("products")
    orders_collection = await get_collection("orders")
    
    # Get product details and calculate total
    order_items = []
    total_amount = 0
    line_items = []
    
    for item in order_data.items:
        product = await products_collection.find_one({"_id": ObjectId(item.product), "isActive": True})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product} not found"
            )
        
        item_total = product["offerPrice"] * item.quantity
        total_amount += item_total
        
        order_items.append({
            "product": {
                "_id": str(product["_id"]),
                "name": product["name"],
                "image": product["image"],
                "offerPrice": product["offerPrice"]
            },
            "quantity": item.quantity,
            "size": item.size
        })
        
        # Add to Stripe line items
        line_items.append({
            "price_data": {
                "currency": "usd",
                "product_data": {
                    "name": product["name"],
                },
                "unit_amount": int(product["offerPrice"] * 100),  # Convert to cents
            },
            "quantity": item.quantity,
        })
    
    # Add delivery charges
    total_amount += settings.DELIVERY_CHARGES
    line_items.append({
        "price_data": {
            "currency": "usd",
            "product_data": {
                "name": "Delivery Charges",
            },
            "unit_amount": int(settings.DELIVERY_CHARGES * 100),
        },
        "quantity": 1,
    })
    
    # Create order (pending payment)
    order_doc = {
        "userId": str(user["_id"]),
        "items": order_items,
        "amount": total_amount,
        "address": order_data.address.model_dump(),
        "status": "Pending Payment",
        "paymentMethod": "Stripe",
        "isPaid": False,
        "paidAt": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await orders_collection.insert_one(order_doc)
    order_id = str(result.inserted_id)
    
    # Create Stripe checkout session
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{settings.FRONTEND_URL}/my-orders?success=true&orderId={order_id}",
            cancel_url=f"{settings.FRONTEND_URL}/cart?cancelled=true",
            metadata={
                "orderId": order_id,
                "userId": str(user["_id"])
            }
        )
        
        # Update order with session ID
        await orders_collection.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"stripeSessionId": session.id}}
        )
        
        return {
            "success": True,
            "url": session.url,
            "sessionId": session.id
        }
    except Exception as e:
        # Delete order if Stripe session creation fails
        await orders_collection.delete_one({"_id": ObjectId(order_id)})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment processing failed: {str(e)}"
        )

@router.post("/userorders", response_model=dict)
async def get_user_orders(request: Request, user: dict = Depends(auth_user)):
    """Get all orders for logged-in user"""
    orders_collection = await get_collection("orders")
    
    orders = await orders_collection.find({"userId": str(user["_id"])}).sort("createdAt", -1).to_list(length=None)
    
    for order in orders:
        order["_id"] = str(order["_id"])
    
    return {
        "success": True,
        "orders": orders
    }

@router.post("/list", response_model=dict)
async def get_all_orders(staff: dict = Depends(auth_staff)):
    """Get all orders (Staff/Admin only)"""
    orders_collection = await get_collection("orders")
    
    orders = await orders_collection.find({}).sort("createdAt", -1).to_list(length=None)
    
    for order in orders:
        order["_id"] = str(order["_id"])
    
    return {
        "success": True,
        "orders": orders
    }

@router.post("/status", response_model=dict)
async def update_order_status(status_update: OrderStatusUpdate, staff: dict = Depends(auth_staff)):
    """Update order status (Staff/Admin only)"""
    orders_collection = await get_collection("orders")
    
    # Validate status
    valid_statuses = ["Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
    
    result = await orders_collection.update_one(
        {"_id": ObjectId(status_update.orderId)},
        {"$set": {"status": status_update.status, "updatedAt": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return {
        "success": True,
        "message": "Order status updated successfully"
    }

@router.post("/verify-stripe", response_model=dict)
async def verify_stripe_payment(session_id: str, request: Request, user: dict = Depends(auth_user)):
    """Verify Stripe payment and update order"""
    orders_collection = await get_collection("orders")
    users_collection = await get_collection("users")
    
    try:
        # Retrieve session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == "paid":
            # Update order
            result = await orders_collection.update_one(
                {"stripeSessionId": session_id},
                {
                    "$set": {
                        "isPaid": True,
                        "paidAt": datetime.utcnow(),
                        "status": "Order Placed",
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            # Clear cart
            await users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"cartData": {}, "updatedAt": datetime.utcnow()}}
            )
            
            return {
                "success": True,
                "message": "Payment verified successfully"
            }
        else:
            return {
                "success": False,
                "message": "Payment not completed"
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}"
        )
