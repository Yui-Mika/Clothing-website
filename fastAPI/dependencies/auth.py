from fastapi import Cookie, Depends, HTTPException, status
from app.core.config import settings
from app.core.security import decode_jwt_token


async def require_user(token: str | None = Cookie(default=None)) -> str:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authorized Login again")
    decoded = decode_jwt_token(token)
    user_id = decoded.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authorized Login again")
    return user_id


async def require_admin(adminToken: str | None = Cookie(default=None)) -> None:
    if not adminToken:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authorized Login again")
    decoded = decode_jwt_token(adminToken)
    email = decoded.get("email")
    if email != settings.admin_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authorized Login again")
    return None


