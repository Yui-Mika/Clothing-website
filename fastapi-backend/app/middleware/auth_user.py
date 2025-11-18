from fastapi import Request, HTTPException, status
from app.utils.auth import verify_token
from app.config.database import get_collection
from bson import ObjectId

async def auth_user(request: Request):
    """Middleware to authenticate regular user from Authorization header or cookie"""
    print("=" * 60)
    print("🔍 AUTH_USER MIDDLEWARE CALLED")
    print("=" * 60)
    
    # Log tất cả headers để debug
    print(f"🔍 ALL HEADERS: {dict(request.headers)}")
    
    # Ưu tiên lấy token từ Authorization header (Bearer token)
    auth_header = request.headers.get("Authorization")
    auth_header_lower = request.headers.get("authorization")  # Try lowercase
    auth_token_header = request.headers.get("auth-token")  # Custom header for direct requests
    
    print(f"🔍 Authorization header (capital A): {auth_header}")
    print(f"🔍 authorization header (lowercase a): {auth_header_lower}")
    print(f"🔍 auth-token header (custom): {auth_token_header}")
    
    token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        # Lấy token từ header: "Bearer <token>"
        token = auth_header.replace("Bearer ", "")
        print(f"✅ Token extracted from Authorization header")
    elif auth_header_lower and auth_header_lower.startswith("Bearer "):
        token = auth_header_lower.replace("Bearer ", "")
        print(f"✅ Token extracted from authorization header (lowercase)")
    elif auth_token_header:
        # Lấy token từ custom header "auth-token"
        token = auth_token_header
        print(f"✅ Token extracted from auth-token header (custom)")
    else:
        # Fallback: Lấy token từ cookie (để tương thích ngược)
        token = request.cookies.get("user_token")
        if token:
            print(f"⚠️ Token extracted from cookie (fallback)")
    
    if token:
        print(f"🔍 Token (first 50 chars): {token[:50]}...")
        print(f"🔍 Token length: {len(token)}")
    else:
        print(f"❌ NO TOKEN FOUND!")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User authentication required. Please login."
        )
    
    # Wrap verify_token in try-catch để bắt lỗi
    try:
        token_data = verify_token(token)
        print(f"✅ Token verified successfully!")
        print(f"✅ User ID: {token_data.user_id}")
        print(f"✅ Email: {token_data.email}")
        print(f"✅ Role: {token_data.role}")
    except Exception as e:
        print(f"❌ verify_token() FAILED: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    
    # Get user from database
    users_collection = await get_collection("users")
    user = await users_collection.find_one({"_id": ObjectId(token_data.user_id)})
    
    if user:
        print(f"✅ User found in database: {user.get('email')}")
        print(f"✅ User isActive: {user.get('isActive', True)}")
    else:
        print(f"❌ User NOT FOUND in database with ID: {token_data.user_id}")
    
    if not user or not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Add user to request state
    request.state.user = user
    print(f"✅ User successfully authenticated: {user.get('email')}")
    print("=" * 60)
    return user
