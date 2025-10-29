from fastapi import Request, HTTPException, status
from app.utils.auth import verify_token
from app.config.database import get_collection
from bson import ObjectId

async def auth_user(request: Request):
    """Middleware to authenticate user from token cookie"""
    token = request.cookies.get("token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
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
