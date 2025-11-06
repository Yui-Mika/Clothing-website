from fastapi import Request, HTTPException, status
from app.utils.auth import verify_token
from app.config.database import get_collection
from bson import ObjectId

async def auth_user(request: Request):
    """Middleware to authenticate regular user from token cookie"""
    token = request.cookies.get("user_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User authentication required. Please login."
        )
    
    token_data = verify_token(token)
    
    # Get user from database
    users_collection = await get_collection("users")
    user = await users_collection.find_one({"_id": ObjectId(token_data.user_id)})
    
    if not user or not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Add user to request state
    request.state.user = user
    return user

async def auth_admin(request: Request):
    """Middleware to authenticate admin from token cookie"""
    token = request.cookies.get("admin_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin authentication required"
        )
    
    token_data = verify_token(token)
    
    # Check if user is admin
    if token_data.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Staff access required"
        )
    
    # Get user from database
    users_collection = await get_collection("users")
    user = await users_collection.find_one({"_id": ObjectId(token_data.user_id)})
    
    if not user or not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin not found or inactive"
        )
    
    # Add admin to request state
    request.state.admin = user
    return user

async def auth_staff(request: Request):
    """Middleware to authenticate staff or admin"""
    user = await auth_admin(request)
    return user

async def auth_admin_only(request: Request):
    """Middleware to authenticate admin only (not staff)"""
    token = request.cookies.get("admin_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin authentication required"
        )
    
    token_data = verify_token(token)
    
    # Check if user is admin (not staff)
    if token_data.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access only"
        )
    
    # Get user from database
    users_collection = await get_collection("users")
    user = await users_collection.find_one({"_id": ObjectId(token_data.user_id)})
    
    if not user or not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin not found or inactive"
        )
    
    request.state.admin = user
    return user
