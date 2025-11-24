# ========================================
# IMPORT CÁC THƯ VIỆN CẦN THIẾT
# ========================================

# Import các component từ FastAPI để xây dựng API
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
# - APIRouter: Tạo router để nhóm các endpoint admin lại
# - Depends: Dependency injection để xác thực admin/staff
# - HTTPException: Ném lỗi HTTP khi có vấn đề (401, 403, 404...)
# - status: Các mã status HTTP chuẩn (200, 401, 403...)
# - Response: Đối tượng response để set cookie
# - Request: Đối tượng request để đọc cookie

# Import model UserLogin (chứa email và password)
from app.models.user import UserLogin

# Import hàm kết nối MongoDB
from app.config.database import get_collection

# Import các hàm xử lý password và JWT token
from app.utils.auth import verify_password, create_access_token
# - verify_password: So sánh password nhập vào với password đã hash trong DB
# - create_access_token: Tạo JWT token để xác thực

# Import các middleware xác thực admin
from app.middleware.auth_admin import auth_admin, auth_admin_only, auth_staff
# - auth_admin: Cho phép cả admin và staff truy cập
# - auth_admin_only: Chỉ cho phép admin truy cập (không cho staff)
# - auth_staff: Cho phép cả admin và staff truy cập (giống auth_admin)

# Import ObjectId để chuyển đổi string ID thành MongoDB ObjectId
from bson import ObjectId

# Import List type để khai báo kiểu dữ liệu danh sách
from typing import List

# ========================================
# TẠO ROUTER CHO ADMIN
# ========================================
# Tạo router để nhóm tất cả các endpoint liên quan đến admin
router = APIRouter()

# ========================================
# ENDPOINT: ĐĂNG NHẬP ADMIN/STAFF
# ========================================
@router.post("/login", response_model=dict)
# Decorator này định nghĩa endpoint POST /api/admin/login
# response_model=dict: Kết quả trả về là dictionary
async def admin_login(user: UserLogin, response: Response):
    """Admin/Staff login"""
    # Hàm này xử lý đăng nhập cho admin và staff
    
    # Bước 1: Lấy collection "users" từ MongoDB
    users_collection = await get_collection("users")
    
    # Bước 2: Tìm user trong database có email khớp VÀ role là admin hoặc staff
    db_user = await users_collection.find_one({
        "email": user.email,  # Email từ request body
        "role": {"$in": ["admin", "staff"]}  # $in: role phải là "admin" HOẶC "staff"
    })
    
    # Bước 3: Kiểm tra xem có tìm thấy user không
    if not db_user:
        # Nếu không tìm thấy user -> email sai HOẶC role không phải admin/staff
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,  # 401: Không được phép
            detail="Thông tin đăng nhập không hợp lệ hoặc không phải tài khoản admin/nhân viên"  # Thông báo lỗi
        )
    
    # Bước 4: Xác thực password
    if not verify_password(user.password, db_user["password"]):
        # verify_password so sánh password nhập vào với password đã hash trong DB
        # Nếu không khớp -> password sai
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,  # 401: Không được phép
            detail="Thông tin đăng nhập không hợp lệ"  # Thông báo lỗi
        )
    
    # Bước 5: Kiểm tra tài khoản có đang active không
    if not db_user.get("isActive", True):
        # .get("isActive", True): Lấy field isActive, nếu không có thì mặc định là True
        # Nếu isActive = False -> tài khoản bị vô hiệu hóa
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,  # 403: Cấm truy cập
            detail="Tài khoản đã bị vô hiệu hóa"  # Thông báo tài khoản không active
        )
    
    # Bước 6: Tạo JWT token
    token_data = {
        "user_id": str(db_user["_id"]),  # Chuyển ObjectId thành string
        "email": db_user["email"],        # Email của admin/staff
        "role": db_user["role"]           # Role: "admin" hoặc "staff"
    }
    # Tạo JWT token chứa thông tin user_id, email, role
    access_token = create_access_token(data=token_data)
    
    # Bước 7: Lưu token vào cookie HTTP-only
    response.set_cookie(
        key="admin_token",              # Tên cookie: "admin_token"
        value=access_token,             # Giá trị: JWT token
        httponly=True,                  # httponly=True: Cookie không thể đọc bằng JavaScript (bảo mật)
        max_age=60 * 60 * 24 * 7,      # Thời gian sống: 7 ngày (tính bằng giây)
        samesite="lax"                  # samesite="lax": Chống CSRF attack
    )
    
    # Bước 8: Trả về kết quả thành công
    return {
        "success": True,                                          # Đăng nhập thành công
        "message": f"{db_user['role'].capitalize()} login successful",  # Thông báo "Admin login successful" hoặc "Staff login successful"
        "token": access_token                                     # Trả về token (có thể lưu ở frontend)
    }

# ========================================
# ENDPOINT: ĐĂNG XUẤT ADMIN/STAFF
# ========================================
@router.post("/logout", response_model=dict)
# Endpoint POST /api/admin/logout để đăng xuất
async def admin_logout(response: Response):
    """Admin/Staff logout"""
    # Hàm này xử lý đăng xuất cho admin và staff
    
    # Xóa cookie "admin_token" để đăng xuất
    response.delete_cookie(key="admin_token")
    # Khi cookie bị xóa, frontend không còn token để gửi lên backend
    
    # Trả về thông báo đăng xuất thành công
    return {
        "success": True,
        "message": "Đăng xuất thành công"
    }

# ========================================
# ENDPOINT: KIỂM TRA XÁC THỰC ADMIN/STAFF
# ========================================
@router.get("/is-auth", response_model=dict)
# Endpoint GET /api/admin/is-auth để kiểm tra xem admin/staff có đăng nhập không
async def is_admin_authenticated(request: Request):
    """Check if admin/staff is authenticated"""
    # Hàm này kiểm tra xem user có role admin/staff không
    
    try:
        # Sử dụng auth_user thay vì auth_admin vì frontend gửi token qua Authorization header
        from app.middleware.auth_user import auth_user
        user = await auth_user(request)
        # Nếu token hợp lệ -> trả về thông tin user (bao gồm role)
        
        # Kiểm tra xem user có role admin hoặc staff không
        user_role = user.get("role")
        if user_role not in ["admin", "staff"]:
            return {
                "success": False,
                "message": "Không có quyền: Chỉ admin và nhân viên mới có thể truy cập"
            }
        
        # Trả về kết quả thành công với role của user
        return {
            "success": True,           # Đã xác thực thành công
            "role": user_role          # Role: "admin" hoặc "staff"
        }
    except Exception as e:
        # Nếu có lỗi (token không hợp lệ, hết hạn, hoặc không có token)
        # Trả về success=False
        return {
            "success": False,  # Chưa xác thực hoặc token không hợp lệ
            "message": str(e)
        }

# ========================================
# CÁC ENDPOINT QUẢN LÝ KHÁCH HÀNG (CHỈ ADMIN)
# ========================================

# ========================================
# ENDPOINT: LẤY DANH SÁCH TẤT CẢ KHÁCH HÀNG
# ========================================
@router.get("/customers", response_model=dict)
# Endpoint GET /api/admin/customers để lấy danh sách khách hàng
async def get_all_customers(admin: dict = Depends(auth_admin_only)):
    """Get all customers (Admin only)"""
    # Hàm này lấy tất cả khách hàng (chỉ admin mới được truy cập)
    # admin: dict = Depends(auth_admin_only): Middleware kiểm tra xem user có phải admin không
    # Nếu không phải admin -> ném lỗi 403 Forbidden
    
    # Bước 1: Lấy collection "users" từ MongoDB
    users_collection = await get_collection("users")
    
    # Bước 2: Tìm tất cả user có role = "customer" và loại bỏ field password
    customers = await users_collection.find(
        {"role": "customer"},  # Điều kiện lọc: chỉ lấy user có role là "customer"
        {"password": 0}        # Projection: không trả về field password (bảo mật)
    ).to_list(length=None)     # Chuyển kết quả thành list, length=None: lấy tất cả
    
    # Bước 3: Chuyển đổi ObjectId thành string để frontend có thể đọc
    for customer in customers:
        customer["_id"] = str(customer["_id"])  # MongoDB _id là ObjectId -> chuyển thành string
    
    # Bước 4: Trả về danh sách khách hàng
    return {
        "success": True,
        "customers": customers  # Danh sách tất cả khách hàng
    }

# ========================================
# ENDPOINT: LẤY THÔNG TIN CHI TIẾT 1 KHÁCH HÀNG
# ========================================
@router.get("/customers/{customer_id}", response_model=dict)
# Endpoint GET /api/admin/customers/{customer_id} để lấy thông tin 1 khách hàng
# {customer_id}: Tham số đường dẫn (path parameter)
async def get_customer(customer_id: str, admin: dict = Depends(auth_admin_only)):
    """Get customer details (Admin only)"""
    # Hàm này lấy thông tin chi tiết của 1 khách hàng theo ID
    
    # Bước 1: Lấy collection "users" từ MongoDB
    users_collection = await get_collection("users")
    
    # Bước 2: Tìm khách hàng theo _id và role = "customer"
    customer = await users_collection.find_one(
        {"_id": ObjectId(customer_id), "role": "customer"},  # Tìm theo _id và role
        {"password": 0}  # Không trả về password
    )
    
    # Bước 3: Kiểm tra xem có tìm thấy khách hàng không
    if not customer:
        # Nếu không tìm thấy -> ném lỗi 404 Not Found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách hàng"
        )
    
    # Bước 4: Chuyển ObjectId thành string
    customer["_id"] = str(customer["_id"])
    
    # Bước 5: Trả về thông tin khách hàng
    return {
        "success": True,
        "customer": customer  # Thông tin chi tiết khách hàng
    }

# ========================================
# ENDPOINT: BẬT/TẮT TRẠNG THÁI KHÁCH HÀNG
# ========================================
@router.put("/customers/{customer_id}/toggle-status", response_model=dict)
# Endpoint PUT /api/admin/customers/{customer_id}/toggle-status
# Dùng để bật/tắt trạng thái active của khách hàng
async def toggle_customer_status(customer_id: str, admin: dict = Depends(auth_admin_only)):
    """Toggle customer active status (Admin only)"""
    # Hàm này chuyển đổi trạng thái isActive của khách hàng (true <-> false)
    
    # Bước 1: Lấy collection "users" từ MongoDB
    users_collection = await get_collection("users")
    
    # Bước 2: Tìm khách hàng theo _id và role = "customer"
    customer = await users_collection.find_one({"_id": ObjectId(customer_id), "role": "customer"})
    
    # Bước 3: Kiểm tra xem có tìm thấy khách hàng không
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách hàng"
        )
    
    # Bước 4: Đảo ngược trạng thái isActive (true -> false hoặc false -> true)
    new_status = not customer.get("isActive", True)
    # .get("isActive", True): Lấy field isActive, nếu không có thì mặc định là True
    # not: Đảo ngược giá trị (True -> False, False -> True)
    
    # Bước 5: Cập nhật trạng thái mới vào database
    await users_collection.update_one(
        {"_id": ObjectId(customer_id)},  # Điều kiện tìm khách hàng
        {"$set": {"isActive": new_status, "updatedAt": datetime.utcnow()}}  # Cập nhật isActive và updatedAt
    )
    
    # Bước 6: Trả về thông báo thành công
    return {
        "success": True,
        "message": f"Khách hàng đã {'kích hoạt' if new_status else 'vô hiệu hóa'} thành công"
        # Nếu new_status=True -> "kích hoạt", ngược lại -> "vô hiệu hóa"
    }

# ========================================
# ENDPOINT: XÓA KHÁCH HÀNG
# ========================================
@router.delete("/customers/{customer_id}", response_model=dict)
# Endpoint DELETE /api/admin/customers/{customer_id} để xóa khách hàng
async def delete_customer(customer_id: str, admin: dict = Depends(auth_admin_only)):
    """Delete customer (Admin only)"""
    # Hàm này xóa khách hàng khỏi database (xóa vĩnh viễn)
    
    # Bước 1: Lấy collection "users" từ MongoDB
    users_collection = await get_collection("users")
    
    # Bước 2: Xóa khách hàng theo _id và role = "customer"
    result = await users_collection.delete_one({"_id": ObjectId(customer_id), "role": "customer"})
    # delete_one: Xóa 1 document khỏi collection
    # Trả về result.deleted_count: Số lượng document đã xóa
    
    # Bước 3: Kiểm tra xem có xóa được không
    if result.deleted_count == 0:
        # Nếu deleted_count = 0 -> không tìm thấy khách hàng để xóa
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khách hàng"
        )
    
    # Bước 4: Trả về thông báo xóa thành công
    return {
        "success": True,
        "message": "Xóa khách hàng thành công"
    }

# ========================================
# CÁC ENDPOINT QUẢN LÝ STAFF (CHỈ ADMIN)
# ========================================

# ========================================
# ENDPOINT: LẤY DANH SÁCH TẤT CẢ STAFF
# ========================================
@router.get("/staff", response_model=dict)
# Endpoint GET /api/admin/staff để lấy danh sách nhân viên staff
async def get_all_staff(admin: dict = Depends(auth_admin_only)):
    """Get all staff members (Admin only)"""
    # Hàm này lấy tất cả nhân viên staff (chỉ admin mới được truy cập)
    
    # Bước 1: Lấy collection "users" từ MongoDB
    users_collection = await get_collection("users")
    
    # Bước 2: Tìm tất cả user có role = "staff" và loại bỏ field password
    staff = await users_collection.find(
        {"role": "staff"},  # Điều kiện lọc: chỉ lấy user có role là "staff"
        {"password": 0}     # Projection: không trả về field password (bảo mật)
    ).to_list(length=None)  # Chuyển kết quả thành list
    
    # Bước 3: Chuyển đổi ObjectId thành string cho từng member
    for member in staff:
        member["_id"] = str(member["_id"])  # Chuyển ObjectId thành string
    
    # Bước 4: Trả về danh sách staff
    return {
        "success": True,
        "staff": staff  # Danh sách tất cả nhân viên staff
    }

# ========================================
# IMPORT DATETIME (để dùng datetime.utcnow())
# ========================================
from datetime import datetime
# Import datetime để lấy thời gian hiện tại khi cập nhật updatedAt

# ========================================
# SETTINGS MANAGEMENT ENDPOINTS
# ========================================

# Import Settings models
from app.models.settings import SettingsCreate, SettingsUpdate, SettingsResponse

# GET /api/admin/settings - List all settings (all years)
@router.get("/settings", response_model=dict, dependencies=[Depends(auth_admin)])
async def get_all_settings():
    """
    Get all settings for all years (admin/staff only).
    Returns list sorted by year descending (newest first).
    """
    try:
        settings_collection = await get_collection("settings")
        
        # Lấy tất cả settings, sắp xếp theo năm giảm dần
        settings_list = await settings_collection.find().sort("year", -1).to_list(length=None)
        
        # Chuyển ObjectId thành string
        for setting in settings_list:
            setting["_id"] = str(setting["_id"])
        
        return {
            "success": True,
            "settings": settings_list,
            "total": len(settings_list)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching settings: {str(e)}"
        )


# POST /api/admin/settings - Create new settings for a year
@router.post("/settings", response_model=dict, dependencies=[Depends(auth_admin_only)])
async def create_settings(settings: SettingsCreate):
    """
    Create new settings for a year (admin only).
    Year must be unique - cannot create duplicate.
    """
    try:
        settings_collection = await get_collection("settings")
        
        # Kiểm tra xem năm đã tồn tại chưa
        existing = await settings_collection.find_one({"year": settings.year})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Settings for year {settings.year} already exists"
            )
        
        # Tạo document mới
        new_settings = {
            "year": settings.year,
            "shippingFee": settings.shippingFee,
            "taxRate": settings.taxRate,
            "isActive": settings.isActive,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await settings_collection.insert_one(new_settings)
        new_settings["_id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": f"Cài đặt cho năm {settings.year} đã được tạo thành công",
            "settings": new_settings
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating settings: {str(e)}"
        )


# PUT /api/admin/settings/{year} - Update settings for a specific year
@router.put("/settings/{year}", response_model=dict, dependencies=[Depends(auth_admin_only)])
async def update_settings(year: int, settings: SettingsUpdate):
    """
    Update settings for a specific year (admin only).
    Can update shippingFee, taxRate, and isActive status.
    """
    try:
        settings_collection = await get_collection("settings")
        
        # Tìm settings của năm cần update
        existing = await settings_collection.find_one({"year": year})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Settings for year {year} not found"
            )
        
        # Tạo update data (chỉ update các field được cung cấp)
        update_data = {"updatedAt": datetime.utcnow()}
        if settings.shippingFee is not None:
            update_data["shippingFee"] = settings.shippingFee
        if settings.taxRate is not None:
            update_data["taxRate"] = settings.taxRate
        if settings.isActive is not None:
            update_data["isActive"] = settings.isActive
        
        # Update trong MongoDB
        await settings_collection.update_one(
            {"year": year},
            {"$set": update_data}
        )
        
        # Lấy settings đã update
        updated_settings = await settings_collection.find_one({"year": year})
        updated_settings["_id"] = str(updated_settings["_id"])
        
        return {
            "success": True,
            "message": f"Cài đặt cho năm {year} đã được cập nhật thành công",
            "settings": updated_settings
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating settings: {str(e)}"
        )


# DELETE /api/admin/settings/{year} - Soft delete settings (set isActive=false)
@router.delete("/settings/{year}", response_model=dict, dependencies=[Depends(auth_admin_only)])
async def delete_settings(year: int):
    """
    Soft delete settings for a year (admin only).
    Sets isActive to false instead of actually deleting the record.
    This preserves historical data for orders.
    """
    try:
        settings_collection = await get_collection("settings")
        
        # Tìm settings của năm cần xóa
        existing = await settings_collection.find_one({"year": year})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Settings for year {year} not found"
            )
        
        # Soft delete: set isActive = false
        await settings_collection.update_one(
            {"year": year},
            {"$set": {
                "isActive": False,
                "updatedAt": datetime.utcnow()
            }}
        )
        
        return {
            "success": True,
            "message": f"Cài đặt cho năm {year} đã được vô hiệu hóa thành công"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting settings: {str(e)}"
        )
