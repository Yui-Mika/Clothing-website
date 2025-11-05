# ============================================================================
# IMPORT LIBRARIES - Nhập các thư viện cần thiết
# ============================================================================

# APIRouter: Tạo router để định nghĩa các API endpoints
# Depends: Dependency injection - tiêm phụ thuộc cho authentication
# HTTPException: Throw HTTP errors với status code
# status: HTTP status codes (200, 401, 403...)
# Response: Đối tượng response để set cookies
# Request: Đối tượng request để đọc cookies/headers
# BackgroundTasks: Chạy tác vụ nền (gửi email) sau khi response
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, BackgroundTasks

# UserCreate: Model cho data đăng ký (name, email, password)
# UserLogin: Model cho data đăng nhập (email, password)
# UserResponse, Token: Models cho response data
from app.models.user import UserCreate, UserLogin, UserResponse, Token

# get_collection: Hàm lấy collection từ MongoDB
from app.config.database import get_collection

# get_password_hash: Hash password với bcrypt
# verify_password: So sánh password đã hash
# create_access_token: Tạo JWT token
from app.utils.auth import get_password_hash, verify_password, create_access_token

# send_verification_email: Gửi email xác thực
# send_welcome_email: Gửi email chào mừng
from app.utils.email import send_verification_email, send_welcome_email

# auth_user: Middleware xác thực user từ JWT token
from app.middleware.auth_user import auth_user

# ObjectId: Kiểu dữ liệu _id của MongoDB
from bson import ObjectId

# datetime: Xử lý ngày giờ (createdAt, updatedAt)
from datetime import datetime

# ============================================================================
# ROUTER INITIALIZATION - Khởi tạo router
# ============================================================================
router = APIRouter()  # Tạo router instance cho user routes

# ============================================================================
# REGISTER ENDPOINT - API Đăng ký tài khoản
# ============================================================================
@router.post("/register", response_model=dict)  # POST /api/user/register
async def register_user(user: UserCreate, background_tasks: BackgroundTasks):
    """
    Đăng ký tài khoản customer mới với xác thực email
    - Kiểm tra email đã tồn tại chưa
    - Validate password mạnh (ít nhất 8 ký tự, có chữ hoa, ký tự đặc biệt)
    - Hash password trước khi lưu
    - Gửi email xác thực
    - Tạo account với role = customer (chưa active, đợi xác thực email)
    """
    # Lấy collection 'users' từ MongoDB
    users_collection = await get_collection("users")
    
    # ========================================================================
    # BƯỚC 1: Kiểm tra email đã tồn tại chưa
    # ========================================================================
    # Tìm user có email trùng trong database
    existing_user = await users_collection.find_one({"email": user.email})
    
    # Nếu email đã tồn tại → throw error 400 Bad Request
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,  # Status code 400
            detail="Email already registered"  # Thông báo lỗi
        )
    
    # ========================================================================
    # BƯỚC 1.1: Kiểm tra name đã tồn tại chưa
    # ========================================================================
    # Tìm user có name trùng trong database
    existing_name = await users_collection.find_one({"name": user.name})
    
    # Nếu name đã tồn tại → throw error 400 Bad Request
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,  # Status code 400
            detail="Username already taken. Please choose another name."  # Thông báo lỗi
        )
    
    # ========================================================================
    # BƯỚC 1.5: Validate password mạnh
    # ========================================================================
    password = user.password
    
    # Kiểm tra độ dài tối thiểu 8 ký tự
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Kiểm tra có ít nhất 1 chữ cái in hoa
    if not any(char.isupper() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter"
        )
    
    # Kiểm tra có ít nhất 1 chữ cái thường
    if not any(char.islower() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter"
        )
    
    # Kiểm tra có ít nhất 1 chữ số
    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number"
        )
    
    # Kiểm tra có ít nhất 1 ký tự đặc biệt
    special_characters = "!@#$%^&*()_+-=[]{}|;:,.<>?/"
    if not any(char in special_characters for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?/)"
        )
    
    # ========================================================================
    # BƯỚC 2: Mã hóa password
    # ========================================================================
    # Hash password bằng bcrypt để bảo mật (không lưu plain text)
    hashed_password = get_password_hash(user.password)
    
    # ========================================================================
    # BƯỚC 3: Tạo document user mới
    # ========================================================================
    user_doc = {
        "name": user.name,              # Tên người dùng
        "email": user.email,            # Email (unique)
        "password": hashed_password,    # Password đã được hash
        "phone": user.phone,            # Số điện thoại (optional)
        "address": user.address,        # Địa chỉ (optional)
        "dateOfBirth": user.dateOfBirth.isoformat() if user.dateOfBirth else None,  # Ngày sinh (YYYY-MM-DD)
        "gender": user.gender,          # Giới tính (optional)
        "cartData": {},                 # Giỏ hàng trống {}
        "role": "customer",             # Role mặc định là customer
        "emailVerified": False,         # 👈 Chưa xác thực email
        "isActive": False,              # 👈 Tài khoản chưa active (đợi xác thực email)
        "createdAt": datetime.utcnow(), # Thời gian tạo (UTC)
        "updatedAt": datetime.utcnow()  # Thời gian cập nhật
    }
    
    # ========================================================================
    # BƯỚC 4: Lưu vào MongoDB
    # ========================================================================
    # Insert document vào collection users
    result = await users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)  # Lấy ID của user vừa tạo
    
    # ========================================================================
    # BƯỚC 5: Gửi email xác thực (background task - không block response)
    # ========================================================================
    # BackgroundTasks cho phép gửi email bất đồng bộ sau khi trả response
    # User không phải đợi email gửi xong mới nhận được response
    background_tasks.add_task(
        send_verification_email,
        email=user.email,
        name=user.name,
        user_id=user_id
    )
    
    # ========================================================================
    # BƯỚC 6: Trả về response thành công
    # ========================================================================
    return {
        "success": True,
        "message": "Registration successful! Please check your email to verify your account."
    }

# ============================================================================
# LOGIN ENDPOINT - API Đăng nhập
# ============================================================================
@router.post("/login", response_model=dict)  # POST /api/user/login
async def login_user(user: UserLogin, response: Response):
    """
    Đăng nhập customer
    - Kiểm tra email & password
    - Tạo JWT token
    - Lưu token vào HTTP-only cookie
    """
    # Lấy collection 'users' từ MongoDB
    users_collection = await get_collection("users")
    
    # ========================================================================
    # BƯỚC 1: Tìm user theo email
    # ========================================================================
    # Tìm user có email khớp trong database
    db_user = await users_collection.find_one({"email": user.email})
    
    # Nếu không tìm thấy email → throw error 401 Unauthorized
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,  # Status code 401
            detail="Invalid email or password"  # Message chung (bảo mật)
        )
    
    # ========================================================================
    # BƯỚC 2: Verify password
    # ========================================================================
    # So sánh password người dùng nhập với password đã hash trong DB
    # verify_password(plain_text, hashed_password) → True/False
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,  # Status code 401
            detail="Invalid email or password"  # Message chung (bảo mật)
        )
    
    # ========================================================================
    # BƯỚC 3: Kiểm tra email đã xác thực chưa
    # ========================================================================
    # Kiểm tra field emailVerified (nếu không có field này thì mặc định là True cho user cũ)
    if not db_user.get("emailVerified", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,  # Status code 403
            detail="Please verify your email before logging in. Check your inbox for verification link."
        )
    
    # ========================================================================
    # BƯỚC 4: Kiểm tra tài khoản có active không
    # ========================================================================
    # Lấy field isActive, default = True nếu không có field này
    if not db_user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,  # Status code 403
            detail="Account is inactive"  # Tài khoản bị vô hiệu hóa
        )
    
    # ========================================================================
    # BƯỚC 5: Tạo JWT access token
    # ========================================================================
    # Payload data sẽ được encode vào token
    token_data = {
        "user_id": str(db_user["_id"]),  # Convert ObjectId → string
        "email": db_user["email"],        # Email của user
        "role": db_user.get("role", "customer")  # Role (customer/admin/staff)
    }
    
    # Tạo JWT token với payload trên
    # Token sẽ có expiry time (default 7 days)
    access_token = create_access_token(data=token_data)
    
    # ========================================================================
    # BƯỚC 6: Lưu token vào HTTP-only cookie
    # ========================================================================
    response.set_cookie(
        key="token",              # Tên cookie
        value=access_token,       # Giá trị = JWT token
        httponly=True,            # Không cho JS đọc (bảo mật XSS)
        max_age=60 * 60 * 24 * 7, # Expire sau 7 ngày (giây)
        samesite="lax"            # CSRF protection
    )
    
    # ========================================================================
    # BƯỚC 7: Trả về response thành công
    # ========================================================================
    return {
        "success": True,           # Flag thành công
        "message": "Login successful",  # Thông báo
        "token": access_token      # Token (cho client nếu cần)
    }

# ============================================================================
# LOGOUT ENDPOINT - API Đăng xuất
# ============================================================================
@router.post("/logout", response_model=dict)  # POST /api/user/logout
async def logout_user(response: Response):
    """
    Đăng xuất user
    - Xóa token cookie
    """
    # ========================================================================
    # Xóa cookie "token" khỏi browser
    # ========================================================================
    response.delete_cookie(key="token")  # Delete cookie có tên "token"
    
    return {
        "success": True,              # Flag thành công
        "message": "Logout successful"  # Thông báo
    }

# ============================================================================
# CHECK AUTH ENDPOINT - API Kiểm tra trạng thái đăng nhập
# ============================================================================
@router.get("/is-auth", response_model=dict)  # GET /api/user/is-auth
async def is_authenticated(request: Request):
    """
    Kiểm tra user có đang login không
    - Đọc token từ cookie
    - Verify JWT token
    - Trả về user info nếu valid
    """
    try:
        # ====================================================================
        # BƯỚC 1: Gọi middleware auth_user
        # ====================================================================
        # auth_user sẽ:
        # 1. Đọc token từ cookie
        # 2. Decode JWT token
        # 3. Tìm user trong DB
        # 4. Return user document
        user = await auth_user(request)
        
        # ====================================================================
        # BƯỚC 2: Format user data
        # ====================================================================
        # Convert ObjectId → string để JSON serialize được
        user["_id"] = str(user["_id"])
        
        # Xóa field password khỏi response (bảo mật)
        user.pop("password", None)
        
        # ====================================================================
        # BƯỚC 3: Trả về user info
        # ====================================================================
        return {
            "success": True,  # User đã login
            "user": user      # Thông tin user (không có password)
        }
    except:
        # ====================================================================
        # Nếu auth_user throw error → user chưa login hoặc token invalid
        # ====================================================================
        return {
            "success": False,  # User chưa login
            "user": None       # Không có user info
        }

# ============================================================================
# GET PROFILE ENDPOINT - API Lấy thông tin user (Protected)
# ============================================================================
@router.get("/profile", response_model=dict)  # GET /api/user/profile
async def get_profile(request: Request, user: dict = Depends(auth_user)):
    """
    Lấy thông tin profile của user đang login
    - Route này PROTECTED (cần login)
    - Depends(auth_user) sẽ tự động verify token
    """
    # ========================================================================
    # Depends(auth_user) đã verify token và lấy user từ DB
    # Nếu token invalid → auth_user throw 401 error tự động
    # ========================================================================
    
    # Convert ObjectId → string
    user["_id"] = str(user["_id"])
    
    # Xóa password khỏi response
    user.pop("password", None)
    
    # Trả về user info
    return {
        "success": True,  # Thành công
        "user": user      # Thông tin user (có role, cartData, ...)
    }

# ============================================================================
# VERIFY EMAIL ENDPOINT - API Xác thực email
# ============================================================================
@router.get("/verify-email", response_model=dict)  # GET /api/user/verify-email?token=xxx
async def verify_email(token: str, background_tasks: BackgroundTasks):
    """
    Xác thực email từ link trong email
    - Decode JWT token từ query parameter
    - Kiểm tra token hợp lệ và đúng mục đích
    - Cập nhật emailVerified=True và isActive=True
    - Gửi email chào mừng (optional)
    """
    from app.utils.auth import decode_access_token
    
    try:
        # ====================================================================
        # BƯỚC 1: Decode và validate token
        # ====================================================================
        # Decode JWT token để lấy payload
        payload = decode_access_token(token)
        
        # Lấy thông tin từ payload
        user_id = payload.get("user_id")
        email = payload.get("email")
        purpose = payload.get("purpose")
        
        # Kiểm tra token có đúng mục đích "email_verification" không
        if purpose != "email_verification":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token purpose"
            )
        
        # ====================================================================
        # BƯỚC 2: Cập nhật user trong database
        # ====================================================================
        users_collection = await get_collection("users")
        
        # Cập nhật emailVerified=True và isActive=True
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id), "email": email},  # Tìm user theo _id và email
            {
                "$set": {
                    "emailVerified": True,        # Đã xác thực email
                    "isActive": True,             # Kích hoạt tài khoản
                    "updatedAt": datetime.utcnow()  # Cập nhật timestamp
                }
            }
        )
        
        # Kiểm tra xem có update được không
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or email mismatch"
            )
        
        # ====================================================================
        # BƯỚC 3: Lấy thông tin user để gửi email chào mừng
        # ====================================================================
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if user:
            # Gửi email chào mừng (background task)
            background_tasks.add_task(
                send_welcome_email,
                email=user["email"],
                name=user["name"]
            )
        
        # ====================================================================
        # BƯỚC 4: Trả về response thành công
        # ====================================================================
        return {
            "success": True,
            "message": "Email verified successfully! Your account is now active. You can login now."
        }
        
    except HTTPException:
        # Re-raise HTTPException (đã có status code và detail)
        raise
    except Exception as e:
        # Các lỗi khác (token expired, invalid format...)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )

# ============================================================================
# RESEND VERIFICATION EMAIL ENDPOINT - Gửi lại email xác thực
# ============================================================================
@router.post("/resend-verification", response_model=dict)
async def resend_verification_email(email: str, background_tasks: BackgroundTasks):
    """
    Gửi lại email xác thực cho user chưa verify
    - Tìm user theo email
    - Kiểm tra chưa verify
    - Gửi lại email xác thực
    """
    users_collection = await get_collection("users")
    
    # ========================================================================
    # BƯỚC 1: Tìm user theo email
    # ========================================================================
    user = await users_collection.find_one({"email": email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with this email"
        )
    
    # ========================================================================
    # BƯỚC 2: Kiểm tra email đã verify chưa
    # ========================================================================
    if user.get("emailVerified", False):
        return {
            "success": False,
            "message": "Email is already verified. You can login now."
        }
    
    # ========================================================================
    # BƯỚC 3: Gửi lại email xác thực
    # ========================================================================
    background_tasks.add_task(
        send_verification_email,
        email=user["email"],
        name=user["name"],
        user_id=str(user["_id"])
    )
    
    return {
        "success": True,
        "message": "Verification email has been sent. Please check your inbox."
    }
