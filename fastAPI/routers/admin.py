from fastapi import APIRouter, Response
from app.core.config import settings
from app.core.security import create_jwt_token


router = APIRouter()


cookie_opts = {
    "httponly": True,
    "secure": False,
    "samesite": "lax",
    "max_age": 7 * 24 * 60 * 60,
}


@router.post("/login")
async def admin_login(payload: dict, response: Response):
    email = payload.get("email")
    password = payload.get("password")
    if email == settings.admin_email and password == settings.admin_pass:
        token = create_jwt_token({"email": email})
        response.set_cookie("adminToken", token, **cookie_opts)
        return {"success": True, "message": "Admin Logged in"}
    return {"success": False, "message": "Invalid Credentials"}


@router.get("/is-auth")
async def is_admin_auth():
    return {"success": True}


@router.post("/logout")
async def admin_logout(response: Response):
    response.delete_cookie("adminToken")
    return {"success": True, "message": "Admin Logged Out"}


