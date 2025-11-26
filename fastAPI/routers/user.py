from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.db.mongo import db
from app.schemas.user import RegisterPayload, LoginPayload, UserPublic, UserDoc
from app.core.security import hash_password, verify_password, create_jwt_token
from app.dependencies.auth import require_user


router = APIRouter()


cookie_opts = {
    "httponly": True,
    "secure": False,
    "samesite": "lax",
    "max_age": 7 * 24 * 60 * 60,
}


@router.post("/register")
async def register(payload: RegisterPayload, response: Response):
    exists = await db.users.find_one({"email": payload.email})
    if exists:
        return {"success": False, "message": "User already exists"}
    if len(payload.password) < 8:
        return {"success": False, "message": "Please Enter a Strong password"}
    user = UserDoc(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
    ).model_dump()
    res = await db.users.insert_one(user)
    token = create_jwt_token({"id": str(res.inserted_id)})
    response.set_cookie("token", token, **cookie_opts)
    return {"success": True, "user": {"email": payload.email, "name": payload.name}}


@router.post("/login")
async def login(payload: LoginPayload, response: Response):
    user = await db.users.find_one({"email": payload.email})
    if not user:
        return {"success": False, "message": "User doesn't Exist"}
    if not verify_password(payload.password, user.get("password")):
        return {"success": False, "message": "Invalid credentials"}
    token = create_jwt_token({"id": str(user.get("_id"))})
    response.set_cookie("token", token, **cookie_opts)
    return {"success": True, "user": {"email": user.get("email"), "name": user.get("name")}}


@router.get("/is-auth")
async def is_auth(user_id: str = Depends(require_user)):
    user = await db.users.find_one({"_id": {"$oid": user_id}})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authorized Login again")
    user.pop("password", None)
    return {"success": True, "user": user}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("token")
    return {"success": True, "message": "Successfully Logged Out"}


