from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.config.database import connect_to_mongo, close_mongo_connection
from app.routes import user_routes, product_routes, cart_routes, order_routes, admin_routes, category_routes, blog_routes, testimonial_routes, report_routes, contact_routes, review_routes, wishlist_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Veloura E-commerce API",
    description="FastAPI backend for Veloura fashion e-commerce platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
# Cho phép frontend truy cập từ localhost và IP server (192.168.1.6)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Development local
        "http://localhost:3000",      # Alternative port
        "http://10.7.72.114:5173",    # Old server IP (backup)
        "http://192.168.1.6:5173",    # Current server IP
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user_routes.router, prefix="/api/user", tags=["Users"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Admin"])
app.include_router(product_routes.router, prefix="/api/product", tags=["Products"])
app.include_router(category_routes.router, prefix="/api/category", tags=["Categories"])
app.include_router(cart_routes.router, prefix="/api/cart", tags=["Cart"])
app.include_router(order_routes.router, prefix="/api/order", tags=["Orders"])
app.include_router(blog_routes.router, prefix="/api/blog", tags=["Blogs"])
app.include_router(testimonial_routes.router, prefix="/api/testimonial", tags=["Testimonials"])
app.include_router(contact_routes.router, prefix="/api/contact", tags=["Contact"])
app.include_router(report_routes.router, prefix="/api/report", tags=["Reports"])
app.include_router(review_routes.router, prefix="/api/review", tags=["Reviews"])
app.include_router(wishlist_routes.router, prefix="/api", tags=["Wishlist"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Veloura E-commerce API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
