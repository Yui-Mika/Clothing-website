from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from app.core.config import settings
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.routers.user import router as user_router
from app.routers.admin import router as admin_router
from app.routers.product import router as product_router
from app.routers.cart import router as cart_router
from app.routers.order import router as order_router
from app.routers.webhook import router as webhook_router


app = FastAPI(default_response_class=ORJSONResponse)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    await connect_to_mongo()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await close_mongo_connection()


@app.get("/")
async def root() -> dict:
    return {"message": "API successfully connected!"}


# Webhook route (raw body)
app.include_router(webhook_router, prefix="")

# API routes (mirror Node prefixes)
app.include_router(user_router, prefix="/api/user", tags=["user"])  # register/login/logout/is-auth
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])  # login/logout/is-auth
app.include_router(product_router, prefix="/api/product", tags=["product"])  # add/list/single/stock
app.include_router(cart_router, prefix="/api/cart", tags=["cart"])  # add/update
app.include_router(order_router, prefix="/api/order", tags=["order"])  # list/status/cod/stripe/userorders


