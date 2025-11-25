# ===== IMPORT CÁC THƯ VIỆN VÀ MODULE CẦN THIẾT =====

# Import các class và function từ FastAPI
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
# - APIRouter: Tạo router để định nghĩa các endpoint API
# - Depends: Dependency injection (tiêm phụ thuộc) để xác thực user
# - HTTPException: Ném lỗi HTTP khi có vấn đề
# - status: Các mã trạng thái HTTP chuẩn (200, 404, 401,...)
# - UploadFile, File, Form: Xử lý upload file và form data

# Import models sản phẩm (không sử dụng trong code này nhưng có sẵn để mở rộng)
from app.models.product import ProductCreate, ProductResponse, ProductUpdate

# Import hàm kết nối MongoDB
from app.config.database import get_collection

# Import middleware xác thực admin/staff
from app.middleware.auth_admin import auth_staff

# Import hàm upload ảnh lên Cloudinary
from app.config.cloudinary import upload_image

# Import ObjectId của MongoDB để làm việc với _id
from bson import ObjectId

# Import để xử lý thời gian
from datetime import datetime

# Import kiểu dữ liệu List và Optional
from typing import List, Optional

# Import Pydantic BaseModel để define request schemas
from pydantic import BaseModel, Field

# Import json để parse chuỗi JSON
import json

# ===== KHỞI TẠO ROUTER =====
# Tạo router để gom nhóm các endpoint về sản phẩm
router = APIRouter()

# ===== HELPER FUNCTION: TÍNH GIÁ SAU GIẢM =====
def calculate_offer_price(price: float, discount_percent: float) -> float:
    """
    Calculate discounted price (offer price) from original price and discount percentage.
    
    Args:
        price (float): Original product price
        discount_percent (float): Discount percentage (0-100)
        
    Returns:
        float: Calculated offer price, rounded to nearest 1000 VND
        
    Raises:
        ValueError: If discount_percent is not in valid range (0-100)
        
    Examples:
        >>> calculate_offer_price(500000, 10.0)
        450000.0
        >>> calculate_offer_price(299000, 15.0)
        254000.0
        >>> calculate_offer_price(750000, 35.0)
        488000.0
    """
    # Validate discount percentage
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError(f"Discount percent must be between 0 and 100, got {discount_percent}")
    
    # Return original price if no discount
    if discount_percent == 0:
        return price
    
    # Round discount to 2 decimal places for consistency
    discount_percent = round(discount_percent, 2)
    
    # Calculate offer price: price * (1 - discount/100)
    offer_price = price * (1 - discount_percent / 100)
    
    # Round to nearest 1000 VND for Vietnamese currency
    # Example: 254150 → 254000, 487500 → 488000
    offer_price = round(offer_price, -3)
    
    return offer_price

# ===== ENDPOINT 1: LẤY DANH SÁCH TẤT CẢ SẢN PHẨM =====
# Route: GET /api/product/list
# Công khai (không cần đăng nhập)
@router.get("/list", response_model=dict)  # Định nghĩa endpoint GET, trả về dictionary
async def get_all_products(
    # Các tham số query string (tùy chọn)
    category: Optional[str] = None,      # ?category=Men → Lọc theo danh mục
    popular: Optional[bool] = None,      # ?popular=true → Lọc sản phẩm phổ biến
    search: Optional[str] = None         # ?search=shirt → Tìm kiếm theo tên/mô tả
):
    """Get all active products with optional filters"""
    
    # Bước 1: Kết nối đến collection "products" trong MongoDB
    products_collection = await get_collection("products")
    
    # Bước 2: Tạo query filter cơ bản
    # Mặc định chỉ lấy sản phẩm đang inStock (không bị xóa mềm)
    query = {"inStock": True}
    
    # Bước 3: Thêm filter theo danh mục (nếu có)
    if category:
        query["category"] = category  # Ví dụ: {"isActive": True, "category": "Men"}
    
    # Bước 4: Thêm filter theo popular (nếu có)
    if popular is not None:  # Kiểm tra is not None vì popular có thể là False
        query["popular"] = popular  # Ví dụ: {"isActive": True, "popular": True}
    
    # Bước 5: Thêm filter tìm kiếm (nếu có)
    if search:
        # Sử dụng $or để tìm trong cả name VÀ description
        # $regex: tìm kiếm theo pattern (giống LIKE trong SQL)
        # $options: "i" → không phân biệt hoa thường (case-insensitive)
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},        # Tìm trong tên
            {"description": {"$regex": search, "$options": "i"}}  # Tìm trong mô tả
        ]
    
    # Bước 6: Thực hiện query và chuyển kết quả thành list
    # find(query): Tìm tất cả document phù hợp
    # to_list(length=None): Chuyển cursor thành list, None = không giới hạn
    products = await products_collection.find(query).to_list(length=None)
    
    # Bước 7: Chuyển ObjectId thành string để có thể serialize thành JSON
    # MongoDB dùng ObjectId cho _id, nhưng JSON không hỗ trợ ObjectId
    for product in products:
        product["_id"] = str(product["_id"])  # ObjectId("abc123") → "abc123"
    
    # Bước 8: Trả về response với format chuẩn
    return {
        "success": True,      # Đánh dấu thành công
        "products": products  # Danh sách sản phẩm
    }

# ===== ENDPOINT 2: LẤY CHI TIẾT MỘT SẢN PHẨM =====
# Route: GET /api/product/{product_id}
# Ví dụ: GET /api/product/507f1f77bcf86cd799439011
@router.get("/{product_id}", response_model=dict)
async def get_product(product_id: str):  # product_id lấy từ URL path
    """Get single product by ID"""
    
    # Bước 1: Kết nối đến collection "products"
    products_collection = await get_collection("products")
    
    # Bước 2: Tìm sản phẩm theo _id
    # find_one(): Tìm 1 document duy nhất
    # ObjectId(product_id): Chuyển string thành ObjectId của MongoDB
    # {"inStock": True}: Chỉ lấy sản phẩm đang inStock
    product = await products_collection.find_one({"_id": ObjectId(product_id), "inStock": True})
    
    # Bước 3: Kiểm tra nếu không tìm thấy
    if not product:
        # Ném lỗi HTTP 404 Not Found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,  # Mã lỗi 404
            detail="Không tìm thấy sản phẩm"              # Message lỗi
        )
    
    # Bước 4: Chuyển ObjectId thành string
    product["_id"] = str(product["_id"])
    
    # Bước 5: Trả về sản phẩm
    return {
        "success": True,
        "product": product  # Thông tin chi tiết sản phẩm
    }

# ===== ENDPOINT 3: THÊM SẢN PHẨM MỚI =====
# Route: POST /api/product/add
# Chỉ Admin/Staff mới được phép (yêu cầu xác thực)
@router.post("/add", response_model=dict)
async def add_product(
    # Nhận dữ liệu dạng form-data (vì có upload file)
    productData: str = Form(...),                    # JSON string chứa thông tin sản phẩm
    images: List[UploadFile] = File(...),            # Danh sách file ảnh
    staff: dict = Depends(auth_staff)                # Xác thực staff/admin
    # Depends(auth_staff): Tự động kiểm tra JWT token, nếu không hợp lệ → lỗi 401
):
    """Add new product (Staff/Admin only)"""
    
    # Bước 1: Kết nối đến collection "products"
    products_collection = await get_collection("products")
    
    # Bước 2: Parse JSON string thành dictionary
    # Frontend gửi: productData = '{"name":"T-Shirt","price":25,...}'
    # json.loads(): Chuyển string → dict
    product_dict = json.loads(productData)
    
    # Bước 3: Upload từng ảnh lên Cloudinary
    image_urls = []  # Mảng chứa các URL ảnh đã upload
    for image in images:
        # Đọc nội dung file ảnh (binary data)
        content = await image.read()
        
        # Upload lên Cloudinary folder "veloura/products"
        # Trả về URL ảnh đã upload: https://res.cloudinary.com/.../image.jpg
        url = await upload_image(content, folder="veloura/products")
        
        # Thêm URL vào mảng
        image_urls.append(url)
    
    # Bước 4: Tạo document sản phẩm để lưu vào MongoDB
    # Xử lý giá khuyến mãi: nếu rỗng hoặc không hợp lệ thì dùng giá gốc
    price = float(product_dict["price"])
    offer_price_str = product_dict.get("offerPrice", "").strip()
    offer_price = float(offer_price_str) if offer_price_str else price
    
    product_doc = {
        # Lấy dữ liệu từ product_dict (đã parse ở bước 2)
        "name": product_dict["name"],                    # Tên sản phẩm
        "description": product_dict["description"],      # Mô tả
        "price": price,                                   # Giá gốc (chuyển sang số thực)
        "offerPrice": offer_price,                       # Giá khuyến mãi (nếu rỗng thì = price)
        "category": product_dict["category"],            # Danh mục (Men/Women/Kids)
        "sizes": product_dict["sizes"],                  # Mảng sizes: ["S","M","L","XL"]
        
        # get("popular", False): Lấy giá trị popular, nếu không có → mặc định False
        "popular": product_dict.get("popular", False),
        
        # Số lượng tồn kho
        "quantity": int(product_dict.get("quantity", 0)),
        
        # Mảng URL ảnh đã upload ở bước 3
        "image": image_urls,
        
        # Mặc định sản phẩm mới là inStock (hiển thị trên website)
        "inStock": True,
        
        # Mặc định sản phẩm mới được kích hoạt (admin có thể ẩn sau)
        "isActive": True,
        
        # Thời gian tạo và cập nhật (UTC timezone)
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Bước 5: Insert document vào MongoDB
    # insert_one(): Thêm 1 document mới
    # Trả về object chứa inserted_id (ID của document vừa tạo)
    result = await products_collection.insert_one(product_doc)
    
    # Bước 6: Trả về response thành công
    return {
        "success": True,
        "message": "Thêm sản phẩm thành công",
        "product_id": str(result.inserted_id)  # ID của sản phẩm vừa tạo
    }

# ===== ENDPOINT 4: CẬP NHẬT SẢN PHẨM =====
# Route: PUT /api/product/{product_id}
# Ví dụ: PUT /api/product/507f1f77bcf86cd799439011
@router.put("/{product_id}", response_model=dict)
async def update_product(
    product_id: str,                                  # ID sản phẩm từ URL
    productData: Optional[str] = Form(None),          # Dữ liệu sản phẩm (tùy chọn)
    images: Optional[List[UploadFile]] = File(None),  # Ảnh mới (tùy chọn)
    staff: dict = Depends(auth_staff)                 # Xác thực staff/admin
):
    """Update product (Staff/Admin only)"""
    
    # Bước 1: Kết nối đến collection "products"
    products_collection = await get_collection("products")
    
    # Bước 2: Kiểm tra xem sản phẩm có tồn tại không
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        # Nếu không tìm thấy → ném lỗi 404
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm"
        )
    
    # Bước 3: Khởi tạo dictionary rỗng để chứa các field cần update
    update_data = {}
    
    # Bước 4: Parse và kiểm tra từng field (nếu có)
    # Chỉ update những field được gửi lên
    if productData:
        # Parse JSON string thành dict
        product_dict = json.loads(productData)
        
        # Kiểm tra từng field có trong product_dict không
        # Nếu có → thêm vào update_data
        if "name" in product_dict:
            update_data["name"] = product_dict["name"]
        if "description" in product_dict:
            update_data["description"] = product_dict["description"]
        if "price" in product_dict:
            update_data["price"] = float(product_dict["price"])
        if "offerPrice" in product_dict:
            update_data["offerPrice"] = float(product_dict["offerPrice"])
        if "category" in product_dict:
            update_data["category"] = product_dict["category"]
        if "sizes" in product_dict:
            update_data["sizes"] = product_dict["sizes"]
        if "popular" in product_dict:
            update_data["popular"] = product_dict["popular"]
        if "isActive" in product_dict:
            update_data["isActive"] = product_dict["isActive"]
    
    # Bước 5: Upload ảnh mới (nếu có)
    if images:
        image_urls = []
        for image in images:
            # Đọc và upload từng ảnh
            content = await image.read()
            url = await upload_image(content, folder="veloura/products")
            image_urls.append(url)
        
        # Thay thế mảng ảnh cũ bằng ảnh mới
        update_data["image"] = image_urls
    
    # Bước 6: Cập nhật thời gian sửa đổi
    update_data["updatedAt"] = datetime.utcnow()
    
    # Bước 7: Thực hiện update trong MongoDB
    # update_one(): Cập nhật 1 document
    # $set: Operator của MongoDB để set giá trị các field
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},  # Điều kiện: tìm theo ID
        {"$set": update_data}            # Cập nhật các field trong update_data
    )
    
    # Bước 8: Trả về response thành công
    return {
        "success": True,
        "message": "Cập nhật sản phẩm thành công"
    }

# ===== ENDPOINT 5: XÓA SẢN PHẨM (SOFT DELETE) =====
# Route: DELETE /api/product/{product_id}
# Ví dụ: DELETE /api/product/507f1f77bcf86cd799439011
@router.delete("/{product_id}", response_model=dict)
async def delete_product(product_id: str, staff: dict = Depends(auth_staff)):
    """Soft delete product (Staff/Admin only)"""
    
    # Bước 1: Kết nối đến collection "products"
    products_collection = await get_collection("products")
    
    # Bước 2: Thực hiện Soft Delete (không xóa khỏi database)
    # Chỉ set inStock = False để ẩn sản phẩm
    result = await products_collection.update_one(
        {"_id": ObjectId(product_id)},  # Tìm sản phẩm theo ID
        {"$set": {                       # Set 2 field:
            "inStock": False,           # 1. Đánh dấu không inStock
            "updatedAt": datetime.utcnow()  # 2. Cập nhật thời gian
        }}
    )
    
    # Bước 3: Kiểm tra kết quả
    # matched_count: số document tìm thấy
    # Nếu = 0 → không tìm thấy sản phẩm
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm"
        )
    
    # Bước 4: Trả về response thành công
    return {
        "success": True,
        "message": "Xóa sản phẩm thành công"
        # Lưu ý: Sản phẩm vẫn còn trong database, chỉ bị ẩn (inStock=False)
        # Lợi ích: Có thể khôi phục, giữ lịch sử đơn hàng
    }

# ===== ENDPOINT 6: LẤY SẢN PHẨM THEO DANH MỤC =====
# Route: GET /api/product/category/{category}
# Ví dụ: GET /api/product/category/Men
@router.get("/category/{category}", response_model=dict)
async def get_products_by_category(category: str):  # category từ URL path
    """Get products by category"""
    
    # Bước 1: Kết nối đến collection "products"
    products_collection = await get_collection("products")
    
    # Bước 2: Tìm sản phẩm theo 2 điều kiện
    products = await products_collection.find({
        "category": category,   # Điều kiện 1: Danh mục phải khớp
        "inStock": True        # Điều kiện 2: Sản phẩm đang inStock
    }).to_list(length=None)     # Chuyển cursor thành list
    
    # Bước 3: Chuyển ObjectId thành string cho tất cả sản phẩm
    for product in products:
        product["_id"] = str(product["_id"])
    
    # Bước 4: Trả về danh sách sản phẩm
    return {
        "success": True,
        "products": products
    }

# ===== PYDANTIC SCHEMAS CHO DISCOUNT ENDPOINTS =====
class ToggleDiscountRequest(BaseModel):
    productId: str
    hasDiscount: bool

class ApplyDiscountRequest(BaseModel):
    productIds: Optional[List[str]] = None
    category: Optional[str] = None
    applyToAll: bool = False
    discountPercent: float = Field(..., ge=0, le=100)
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None

class RemoveDiscountRequest(BaseModel):
    productIds: Optional[List[str]] = None
    category: Optional[str] = None
    removeAll: bool = False

class UpdateDiscountRequest(BaseModel):
    productIds: List[str]
    newDiscountPercent: float = Field(..., ge=0, le=100)

# ===== ENDPOINT 7: TOGGLE DISCOUNT ON/OFF =====
@router.post("/toggle-discount", response_model=dict)
async def toggle_discount(
    data: ToggleDiscountRequest,
    staff: dict = Depends(auth_staff)
):
    """Toggle discount on/off for a single product (Admin/Staff only)"""
    
    products_collection = await get_collection("products")
    
    # Find product
    product = await products_collection.find_one({"_id": ObjectId(data.productId)})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm"
        )
    
    # Update hasDiscount field
    update_data = {
        "hasDiscount": data.hasDiscount,
        "updatedAt": datetime.utcnow()
    }
    
    # If turning off discount, reset to original price
    if not data.hasDiscount:
        update_data["offerPrice"] = product["price"]
        update_data["discountPercent"] = 0.0
    
    await products_collection.update_one(
        {"_id": ObjectId(data.productId)},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "message": f"Discount {'enabled' if data.hasDiscount else 'disabled'} successfully"
    }

# ===== ENDPOINT 8: APPLY DISCOUNT =====
@router.post("/apply-discount", response_model=dict)
async def apply_discount(
    data: ApplyDiscountRequest,
    staff: dict = Depends(auth_staff)
):
    """Apply discount to products or entire category (Admin/Staff only)"""
    
    products_collection = await get_collection("products")
    
    # Build query
    query = {}
    if data.applyToAll and data.category:
        # Apply to entire category
        query = {"category": data.category, "inStock": True}
    elif data.productIds:
        # Apply to specific products
        query = {"_id": {"$in": [ObjectId(pid) for pid in data.productIds]}}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phải cung cấp productIds hoặc (category với applyToAll=true)"
        )
    
    # Find products
    products = await products_collection.find(query).to_list(length=None)
    if not products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm nào"
        )
    
    # Update each product
    updated_count = 0
    for product in products:
        # Calculate new offer price
        offer_price = calculate_offer_price(product["price"], data.discountPercent)
        
        # Prepare update data
        update_data = {
            "hasDiscount": True,
            "discountPercent": round(data.discountPercent, 2),
            "offerPrice": offer_price,
            "updatedAt": datetime.utcnow()
        }
        
        # Add dates if provided
        if data.startDate:
            update_data["discountStartDate"] = data.startDate
        if data.endDate:
            update_data["discountEndDate"] = data.endDate
        
        # Update product
        await products_collection.update_one(
            {"_id": product["_id"]},
            {"$set": update_data}
        )
        updated_count += 1
    
    return {
        "success": True,
        "message": f"Applied {data.discountPercent}% discount to {updated_count} products",
        "updatedCount": updated_count
    }

# ===== ENDPOINT 9: REMOVE DISCOUNT =====
@router.post("/remove-discount", response_model=dict)
async def remove_discount(
    data: RemoveDiscountRequest,
    staff: dict = Depends(auth_staff)
):
    """Remove discount from products or entire category (Admin/Staff only)"""
    
    products_collection = await get_collection("products")
    
    # Build query
    query = {}
    if data.removeAll and data.category:
        # Remove from entire category
        query = {"category": data.category, "hasDiscount": True}
    elif data.productIds:
        # Remove from specific products
        query = {"_id": {"$in": [ObjectId(pid) for pid in data.productIds]}}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phải cung cấp productIds hoặc (category với removeAll=true)"
        )
    
    # Find products
    products = await products_collection.find(query).to_list(length=None)
    if not products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm nào"
        )
    
    # Update each product
    updated_count = 0
    for product in products:
        # Reset to original price
        update_data = {
            "hasDiscount": False,
            "discountPercent": 0.0,
            "offerPrice": product["price"],
            "updatedAt": datetime.utcnow()
        }
        
        # Update product
        await products_collection.update_one(
            {"_id": product["_id"]},
            {"$set": update_data, "$unset": {"discountStartDate": "", "discountEndDate": ""}}
        )
        updated_count += 1
    
    return {
        "success": True,
        "message": f"Removed discount from {updated_count} products",
        "updatedCount": updated_count
    }

# ===== ENDPOINT 9B: TOGGLE PRODUCT ACTIVE STATUS =====
@router.patch("/{product_id}/toggle-active")
async def toggle_product_active(
    product_id: str,
    staff: dict = Depends(auth_staff)
):
    """Toggle product isActive status (Admin/Staff only)"""
    products_collection = await get_collection("products")
    
    # Tìm sản phẩm
    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm"
        )
    
    # Đảo ngược trạng thái isActive
    new_status = not product.get("isActive", True)
    
    # Cập nhật database
    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {
            "$set": {
                "isActive": new_status,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    status_text = "hiển thị" if new_status else "ẩn"
    return {
        "success": True,
        "message": f"Đã {status_text} sản phẩm",
        "isActive": new_status
    }

# ===== ENDPOINT 10: UPDATE DISCOUNT PERCENTAGE =====
@router.post("/update-discount", response_model=dict)
async def update_discount(
    data: UpdateDiscountRequest,
    staff: dict = Depends(auth_staff)
):
    """Update discount percentage for existing discounted products (Admin/Staff only)"""
    
    products_collection = await get_collection("products")
    
    # Find products
    query = {"_id": {"$in": [ObjectId(pid) for pid in data.productIds]}}
    products = await products_collection.find(query).to_list(length=None)
    
    if not products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy sản phẩm nào"
        )
    
    # Update each product
    updated_count = 0
    for product in products:
        # Calculate new offer price
        offer_price = calculate_offer_price(product["price"], data.newDiscountPercent)
        
        # Update product
        await products_collection.update_one(
            {"_id": product["_id"]},
            {"$set": {
                "discountPercent": round(data.newDiscountPercent, 2),
                "offerPrice": offer_price,
                "hasDiscount": True,
                "updatedAt": datetime.utcnow()
            }}
        )
        updated_count += 1
    
    return {
        "success": True,
        "message": f"Updated discount to {data.newDiscountPercent}% for {updated_count} products",
        "updatedCount": updated_count
    }

# ===== KẾT THÚC FILE =====
# Tổng cộng 10 endpoints:
# 1.  GET    /list                    → Lấy tất cả sản phẩm (có filter)
# 2.  GET    /{product_id}            → Lấy 1 sản phẩm
# 3.  POST   /add                     → Thêm sản phẩm mới (Admin/Staff)
# 4.  PUT    /{product_id}            → Cập nhật sản phẩm (Admin/Staff)
# 5.  DELETE /{product_id}            → Xóa mềm sản phẩm (Admin/Staff)
# 6.  GET    /category/{category}     → Lấy sản phẩm theo danh mục
# 7.  POST   /toggle-discount         → Bật/tắt discount (Admin/Staff)
# 8.  POST   /apply-discount          → Áp dụng discount (Admin/Staff)
# 9.  POST   /remove-discount         → Xóa discount (Admin/Staff)
# 10. POST   /update-discount         → Cập nhật % discount (Admin/Staff)
