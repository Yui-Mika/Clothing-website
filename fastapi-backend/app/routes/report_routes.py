from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.config.database import get_collection
from app.middleware.auth_admin import auth_admin_only
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()

@router.get("/dashboard", response_model=dict)
async def get_dashboard_stats(admin: dict = Depends(auth_admin_only)):
    """Get dashboard statistics (Admin only)"""
    users_collection = await get_collection("users")
    products_collection = await get_collection("products")
    orders_collection = await get_collection("orders")
    
    # Total counts
    total_customers = await users_collection.count_documents({"role": "customer"})
    total_products = await products_collection.count_documents({"isActive": True})
    total_orders = await orders_collection.count_documents({})
    
    # Total revenue
    pipeline = [
        {"$match": {"isPaid": True}},
        {"$group": {"_id": None, "totalRevenue": {"$sum": "$amount"}}}
    ]
    revenue_result = await orders_collection.aggregate(pipeline).to_list(length=1)
    total_revenue = revenue_result[0]["totalRevenue"] if revenue_result else 0
    
    # Recent orders count (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_orders = await orders_collection.count_documents({
        "createdAt": {"$gte": thirty_days_ago}
    })
    
    # Order status breakdown
    order_statuses = await orders_collection.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]).to_list(length=None)
    
    return {
        "success": True,
        "stats": {
            "totalCustomers": total_customers,
            "totalProducts": total_products,
            "totalOrders": total_orders,
            "totalRevenue": round(total_revenue, 2),
            "recentOrders": recent_orders,
            "orderStatuses": {item["_id"]: item["count"] for item in order_statuses}
        }
    }

@router.get("/sales", response_model=dict)
async def get_sales_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    admin: dict = Depends(auth_admin_only)
):
    """Get sales report (Admin only)"""
    orders_collection = await get_collection("orders")
    
    # Build date filter
    date_filter = {"isPaid": True}
    if start_date:
        date_filter["createdAt"] = {"$gte": datetime.fromisoformat(start_date)}
    if end_date:
        if "createdAt" not in date_filter:
            date_filter["createdAt"] = {}
        date_filter["createdAt"]["$lte"] = datetime.fromisoformat(end_date)
    
    # Total sales
    pipeline = [
        {"$match": date_filter},
        {"$group": {
            "_id": None,
            "totalSales": {"$sum": "$amount"},
            "totalOrders": {"$sum": 1}
        }}
    ]
    sales_result = await orders_collection.aggregate(pipeline).to_list(length=1)
    
    if sales_result:
        total_sales = sales_result[0]["totalSales"]
        total_orders = sales_result[0]["totalOrders"]
    else:
        total_sales = 0
        total_orders = 0
    
    # Sales by date
    daily_sales_pipeline = [
        {"$match": date_filter},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "sales": {"$sum": "$amount"},
            "orders": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    daily_sales = await orders_collection.aggregate(daily_sales_pipeline).to_list(length=None)
    
    return {
        "success": True,
        "report": {
            "totalSales": round(total_sales, 2),
            "totalOrders": total_orders,
            "dailySales": [
                {
                    "date": item["_id"],
                    "sales": round(item["sales"], 2),
                    "orders": item["orders"]
                }
                for item in daily_sales
            ]
        }
    }

@router.get("/products", response_model=dict)
async def get_product_report(admin: dict = Depends(auth_admin_only)):
    """Get product performance report (Admin only)"""
    orders_collection = await get_collection("orders")
    products_collection = await get_collection("products")
    
    # Most sold products
    pipeline = [
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product._id",
            "productName": {"$first": "$items.product.name"},
            "totalQuantity": {"$sum": "$items.quantity"},
            "totalRevenue": {"$sum": {"$multiply": ["$items.product.offerPrice", "$items.quantity"]}}
        }},
        {"$sort": {"totalQuantity": -1}},
        {"$limit": 10}
    ]
    top_products = await orders_collection.aggregate(pipeline).to_list(length=None)
    
    # Category-wise sales
    category_pipeline = [
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product.category",
            "totalSales": {"$sum": {"$multiply": ["$items.product.offerPrice", "$items.quantity"]}},
            "totalOrders": {"$sum": 1}
        }},
        {"$sort": {"totalSales": -1}}
    ]
    
    # Get unique categories from orders
    category_sales = await orders_collection.aggregate(category_pipeline).to_list(length=None)
    
    # Total active products
    total_active_products = await products_collection.count_documents({"isActive": True})
    
    # Products by category
    products_by_category = await products_collection.aggregate([
        {"$match": {"isActive": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]).to_list(length=None)
    
    return {
        "success": True,
        "report": {
            "totalActiveProducts": total_active_products,
            "topProducts": [
                {
                    "productId": item["_id"],
                    "productName": item["productName"],
                    "quantitySold": item["totalQuantity"],
                    "revenue": round(item["totalRevenue"], 2)
                }
                for item in top_products
            ],
            "categorySales": [
                {
                    "category": item["_id"],
                    "totalSales": round(item["totalSales"], 2),
                    "totalOrders": item["totalOrders"]
                }
                for item in category_sales
            ],
            "productsByCategory": {item["_id"]: item["count"] for item in products_by_category}
        }
    }

@router.get("/customers", response_model=dict)
async def get_customer_report(admin: dict = Depends(auth_admin_only)):
    """Get customer report (Admin only)"""
    users_collection = await get_collection("users")
    orders_collection = await get_collection("orders")
    
    # Total customers
    total_customers = await users_collection.count_documents({"role": "customer", "isActive": True})
    
    # New customers (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_customers = await users_collection.count_documents({
        "role": "customer",
        "createdAt": {"$gte": thirty_days_ago}
    })
    
    # Customers with orders
    customers_with_orders = await orders_collection.distinct("userId")
    customers_with_orders_count = len(customers_with_orders)
    
    # Top customers by order value
    top_customers_pipeline = [
        {"$group": {
            "_id": "$userId",
            "totalSpent": {"$sum": "$amount"},
            "totalOrders": {"$sum": 1}
        }},
        {"$sort": {"totalSpent": -1}},
        {"$limit": 10}
    ]
    top_customers = await orders_collection.aggregate(top_customers_pipeline).to_list(length=None)
    
    # Get customer details
    top_customers_with_details = []
    for customer in top_customers:
        user = await users_collection.find_one({"_id": ObjectId(customer["_id"])})
        if user:
            top_customers_with_details.append({
                "customerId": customer["_id"],
                "customerName": user.get("name", "Unknown"),
                "customerEmail": user.get("email", ""),
                "totalSpent": round(customer["totalSpent"], 2),
                "totalOrders": customer["totalOrders"]
            })
    
    return {
        "success": True,
        "report": {
            "totalCustomers": total_customers,
            "newCustomers": new_customers,
            "customersWithOrders": customers_with_orders_count,
            "topCustomers": top_customers_with_details
        }
    }

@router.get("/revenue", response_model=dict)
async def get_revenue_report(
    period: str = Query("monthly", regex="^(daily|weekly|monthly|yearly)$"),
    admin: dict = Depends(auth_admin_only)
):
    """Get revenue report by period (Admin only)"""
    orders_collection = await get_collection("orders")
    
    # Define date format based on period
    date_formats = {
        "daily": "%Y-%m-%d",
        "weekly": "%Y-W%U",
        "monthly": "%Y-%m",
        "yearly": "%Y"
    }
    
    date_format = date_formats.get(period, "%Y-%m")
    
    # Revenue by period
    pipeline = [
        {"$match": {"isPaid": True}},
        {"$group": {
            "_id": {"$dateToString": {"format": date_format, "date": "$createdAt"}},
            "revenue": {"$sum": "$amount"},
            "orders": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    revenue_data = await orders_collection.aggregate(pipeline).to_list(length=None)
    
    return {
        "success": True,
        "report": {
            "period": period,
            "data": [
                {
                    "period": item["_id"],
                    "revenue": round(item["revenue"], 2),
                    "orders": item["orders"]
                }
                for item in revenue_data
            ]
        }
    }
