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
from fastapi.responses import RedirectResponse

# UserCreate: Model cho data đăng ký (name, email, password)
# UserLogin: Model cho data đăng nhập (email, password)
# UserResponse, Token: Models cho response data
# VerifyCodeRequest: Model cho verify OTP code
# ResendCodeRequest: Model cho resend OTP code
from app.models.user import UserCreate, UserLogin, UserResponse, Token, VerifyCodeRequest, ResendCodeRequest

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
            detail="Email đã được đăng ký"  # Thông báo lỗi
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
            detail="Tên người dùng đã tồn tại. Vui lòng chọn tên khác."  # Thông báo lỗi
        )
    
    # ========================================================================
    # BƯỚC 1.5: Validate password mạnh
    # ========================================================================
    password = user.password
    
    # Kiểm tra độ dài tối thiểu 8 ký tự
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải có ít nhất 8 ký tự"
        )
    
    # Kiểm tra có ít nhất 1 chữ cái in hoa
    if not any(char.isupper() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải có ít nhất một chữ in hoa"
        )
    
    # Kiểm tra có ít nhất 1 chữ cái thường
    if not any(char.islower() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải có ít nhất một chữ thường"
        )
    
    # Kiểm tra có ít nhất 1 chữ số
    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải có ít nhất một chữ số"
        )
    
    # Kiểm tra có ít nhất 1 ký tự đặc biệt
    special_characters = "!@#$%^&*()_+-=[]{}|;:,.<>?/"
    if not any(char in special_characters for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải có ít nhất một ký tự đặc biệt (!@#$%^&*()_+-=[]{}|;:,.<>?/)"
        )
    
    # ========================================================================
    # BƯỚC 2: Mã hóa password
    # ========================================================================
    # Hash password bằng bcrypt để bảo mật (không lưu plain text)
    hashed_password = get_password_hash(user.password)
    
    # ========================================================================
    # BƯỚC 2.5: Tạo mã OTP verification code
    # ========================================================================
    from app.utils.verification import generate_verification_code
    from datetime import timedelta
    
    verification_code = generate_verification_code(length=6)  # Mã 6 số
    code_expiry = datetime.utcnow() + timedelta(minutes=10)  # Hết hạn sau 10 phút
    
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
        "verificationCode": verification_code,  # 👈 Mã OTP 6 số
        "codeExpiry": code_expiry,      # 👈 Thời gian hết hạn code
        "codeAttempts": 0,              # 👈 Số lần thử sai (max 5)
        "lastCodeSentAt": datetime.utcnow(),  # 👈 Thời gian gửi code (rate limiting)
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
    # BƯỚC 5: Gửi email với mã OTP (background task - không block response)
    # ========================================================================
    from app.utils.email import send_verification_code_email
    
    # BackgroundTasks cho phép gửi email bất đồng bộ sau khi trả response
    # User không phải đợi email gửi xong mới nhận được response
    background_tasks.add_task(
        send_verification_code_email,
        email=user.email,
        name=user.name,
        code=verification_code
    )
    
    # ========================================================================
    # BƯỚC 6: Trả về response thành công
    # ========================================================================
    return {
        "success": True,
        "message": "Đăng ký thành công! Vui lòng kiểm tra email để nhận mã xác thực.",
        "email": user.email  # 👈 Trả về email để frontend redirect đến trang verify
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
            detail="Email hoặc mật khẩu không đúng"  # Message chung (bảo mật)
        )
    
    # ========================================================================
    # BƯỚC 2: Verify password
    # ========================================================================
    # So sánh password người dùng nhập với password đã hash trong DB
    # verify_password(plain_text, hashed_password) → True/False
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,  # Status code 401
            detail="Email hoặc mật khẩu không đúng"  # Message chung (bảo mật)
        )
    
    # ========================================================================
    # BƯỚC 3: Kiểm tra email đã xác thực chưa
    # ========================================================================
    # Kiểm tra field emailVerified (nếu không có field này thì mặc định là True cho user cũ)
    if not db_user.get("emailVerified", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,  # Status code 403
            detail="Vui lòng xác thực email trước khi đăng nhập. Kiểm tra hộp thư của bạn."
        )
    
    # ========================================================================
    # BƯỚC 4: Kiểm tra tài khoản có active không
    # ========================================================================
    # Lấy field isActive, default = True nếu không có field này
    if not db_user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,  # Status code 403
            detail="Tài khoản đã bị vô hiệu hóa"  # Tài khoản bị vô hiệu hóa
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
    # BƯỚC 6: Trả về response thành công với token
    # ========================================================================
    # KHÔNG dùng cookie nữa - Frontend sẽ lưu token vào localStorage
    # và gửi qua Authorization header
    return {
        "success": True,           # Flag thành công
        "message": "Đăng nhập thành công",  # Thông báo
        "token": access_token      # Token để frontend lưu vào localStorage
    }

# ============================================================================
# LOGOUT ENDPOINT - API Đăng xuất
# ============================================================================
@router.post("/logout", response_model=dict)  # POST /api/user/logout
async def logout_user():
    """
    Đăng xuất user
    - Frontend sẽ tự xóa token khỏi localStorage
    """
    # ========================================================================
    # KHÔNG cần xóa cookie nữa - Frontend tự xóa localStorage
    # ========================================================================
    return {
        "success": True,              # Flag thành công
        "message": "Đăng xuất thành công"  # Thông báo
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
        print("🔍 /is-auth endpoint called - calling auth_user()...")
        user = await auth_user(request)
        print(f"✅ auth_user() returned user: {user.get('email')}")
        
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
    except Exception as e:
        # ====================================================================
        # Nếu auth_user throw error → user chưa login hoặc token invalid
        # ====================================================================
        print(f"❌ /is-auth error: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"❌ Traceback:\n{traceback.format_exc()}")
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
@router.get("/verify-email")  # GET /api/user/verify-email?token=xxx
async def verify_email(token: str, background_tasks: BackgroundTasks):
    """
    Xác thực email từ link trong email
    - Decode JWT token từ query parameter
    - Kiểm tra token hợp lệ và đúng mục đích
    - Cập nhật emailVerified=True và isActive=True
    - Redirect về frontend với success message
    """
    from app.utils.auth import decode_access_token
    from app.config.settings import Settings
    settings = Settings()
    
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
        # BƯỚC 4: Redirect về frontend với success message
        # ====================================================================
        # Redirect về trang login với thông báo thành công
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/?verified=true",
            status_code=status.HTTP_303_SEE_OTHER
        )
        
    except HTTPException as e:
        # Redirect về frontend với error message
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/?verified=false&error={e.detail}",
            status_code=status.HTTP_303_SEE_OTHER
        )
    except Exception as e:
        # Các lỗi khác (token expired, invalid format...)
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/?verified=false&error=Invalid or expired token",
            status_code=status.HTTP_303_SEE_OTHER
        )

# ============================================================================
# VERIFY CODE ENDPOINT - API Xác thực email bằng OTP code
# ============================================================================
@router.post("/verify-code", response_model=dict)
async def verify_code(request: VerifyCodeRequest, background_tasks: BackgroundTasks):
    """
    Xác thực email bằng mã OTP 6 số
    - Kiểm tra email và code
    - Validate code chưa hết hạn
    - Check số lần thử (max 5 attempts)
    - Cập nhật emailVerified=True, isActive=True
    - Xóa code sau khi verify thành công
    """
    from app.utils.verification import is_code_expired
    
    users_collection = await get_collection("users")
    
    # ========================================================================
    # BƯỚC 1: Tìm user theo email
    # ========================================================================
    user = await users_collection.find_one({"email": request.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with this email"
        )
    
    # ========================================================================
    # BƯỚC 2: Kiểm tra đã verify chưa
    # ========================================================================
    if user.get("emailVerified", False):
        return {
            "success": False,
            "message": "Email is already verified. You can login now."
        }
    
    # ========================================================================
    # BƯỚC 3: Kiểm tra số lần thử (prevent brute force)
    # ========================================================================
    code_attempts = user.get("codeAttempts", 0)
    
    if code_attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Quá nhiều lần thử sai. Vui lòng yêu cầu mã xác thực mới."
        )
    
    # ========================================================================
    # BƯỚC 4: Kiểm tra code tồn tại
    # ========================================================================
    stored_code = user.get("verificationCode")
    code_expiry = user.get("codeExpiry")
    
    if not stored_code or not code_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không tìm thấy mã xác thực. Vui lòng yêu cầu mã mới."
        )
    
    # ========================================================================
    # BƯỚC 5: Kiểm tra code đã hết hạn chưa
    # ========================================================================
    if is_code_expired(code_expiry):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới."
        )
    
    # ========================================================================
    # BƯỚC 6: So sánh code
    # ========================================================================
    if stored_code != request.code:
        # Tăng số lần thử sai
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$inc": {"codeAttempts": 1}}
        )
        
        remaining_attempts = 4 - code_attempts
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã xác thực không đúng. Còn {remaining_attempts} lần thử."
        )
    
    # ========================================================================
    # BƯỚC 7: ✅ Code đúng! Cập nhật user
    # ========================================================================
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "emailVerified": True,      # Đã xác thực email
                "isActive": True,           # Kích hoạt tài khoản
                "updatedAt": datetime.utcnow()
            },
            "$unset": {
                "verificationCode": "",     # Xóa code
                "codeExpiry": "",           # Xóa expiry
                "codeAttempts": "",         # Xóa attempts counter
                "lastCodeSentAt": ""        # Xóa last sent time
            }
        }
    )
    
    # ========================================================================
    # BƯỚC 8: Gửi email chào mừng
    # ========================================================================
    background_tasks.add_task(
        send_welcome_email,
        email=user["email"],
        name=user["name"]
    )
    
    return {
        "success": True,
        "message": "Xác thực email thành công! Bây giờ bạn có thể đăng nhập vào tài khoản."
    }

# ============================================================================
# RESEND VERIFICATION CODE ENDPOINT - Gửi lại mã OTP xác thực
# ============================================================================
@router.post("/resend-code", response_model=dict)
async def resend_verification_code(request: ResendCodeRequest, background_tasks: BackgroundTasks):
    """
    Gửi lại mã OTP verification code với rate limiting
    - Tìm user theo email
    - Kiểm tra chưa verify
    - Check rate limiting (60 giây cooldown)
    - Tạo code mới và gửi email
    """
    from app.utils.verification import can_resend_code, generate_verification_code, get_remaining_cooldown
    from app.utils.email import send_verification_code_email
    from datetime import timedelta
    
    users_collection = await get_collection("users")
    
    # ========================================================================
    # BƯỚC 1: Tìm user theo email
    # ========================================================================
    user = await users_collection.find_one({"email": request.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with this email"
        )
    
    # ========================================================================
    # BƯớc 2: Kiểm tra đã verify chưa
    # ========================================================================
    if user.get("emailVerified", False):
        return {
            "success": False,
            "message": "Email đã được xác thực. Bạn có thể đăng nhập ngay bây giờ."
        }
    
    # ========================================================================
    # BƯớc 3: Rate limiting - Kiểm tra cooldown
    # ========================================================================
    last_sent = user.get("lastCodeSentAt")
    
    if not can_resend_code(last_sent, cooldown_seconds=60):
        remaining = get_remaining_cooldown(last_sent, cooldown_seconds=60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Vui lòng đợi {remaining} giây trước khi yêu cầu mã mới."
        )
    
    # ========================================================================
    # BƯỚC 4: Tạo mã OTP mới
    # ========================================================================
    new_code = generate_verification_code(length=6)
    new_expiry = datetime.utcnow() + timedelta(minutes=10)
    
    # ========================================================================
    # BƯỚC 5: Cập nhật database với code mới
    # ========================================================================
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "verificationCode": new_code,
                "codeExpiry": new_expiry,
                "codeAttempts": 0,  # Reset số lần thử
                "lastCodeSentAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    # ========================================================================
    # BƯỚC 6: Gửi email với code mới
    # ========================================================================
    background_tasks.add_task(
        send_verification_code_email,
        email=user["email"],
        name=user["name"],
        code=new_code
    )
    
    return {
        "success": True,
        "message": "Một mã xác thực mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư."
    }

# ============================================================================
# RESEND VERIFICATION EMAIL ENDPOINT - Gửi lại email xác thực (OLD METHOD - Keep for backward compatibility)
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
            detail="Không tìm thấy người dùng với email này"
        )
    
    # ========================================================================
    # BƯớc 2: Kiểm tra email đã verify chưa
    # ========================================================================
    if user.get("emailVerified", False):
        return {
            "success": False,
            "message": "Email đã được xác thực. Bạn có thể đăng nhập ngay bây giờ."
        }
    
    # ========================================================================
    # BƯớc 3: Gửi lại email xác thực
    # ========================================================================
    background_tasks.add_task(
        send_verification_email,
        email=user["email"],
        name=user["name"],
        user_id=str(user["_id"])
    )
    
    return {
        "success": True,
        "message": "Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn."
    }

# ============================================================================
# LIST ALL USERS ENDPOINT - Lấy danh sách tất cả users (Admin only)
# ============================================================================
@router.get("/list-all", response_model=dict)
async def list_all_users(request: Request):
    """
    Lấy danh sách tất cả users trong hệ thống (Admin only)
    - Chỉ admin/staff mới có quyền
    - Trả về thông tin cơ bản của users
    """
    # Import auth_admin middleware
    from app.middleware.auth_admin import auth_admin
    
    # ========================================================================
    # BƯỚC 1: Xác thực admin
    # ========================================================================
    admin = await auth_admin(request)
    
    # ========================================================================
    # BƯỚC 2: Lấy danh sách users
    # ========================================================================
    users_collection = await get_collection("users")
    
    # Lấy tất cả users, loại bỏ password và chỉ lấy các trường cần thiết
    users = await users_collection.find(
        {},
        {
            "password": 0,  # Không trả về password
            "verificationCode": 0,  # Không trả về verification code
            "verificationCodeExpiry": 0  # Không trả về expiry
        }
    ).to_list(length=None)
    
    # Chuyển ObjectId thành string
    for user in users:
        user["_id"] = str(user["_id"])
    
    return {
        "success": True,
        "users": users
    }

# ============================================================================
# UPDATE PROFILE ENDPOINT - API Cập nhật thông tin cá nhân
# ============================================================================
@router.post("/update-profile", response_model=dict)
async def update_profile(
    request: Request,
    current_user: dict = Depends(auth_user)
):
    """
    Cập nhật thông tin cá nhân của user
    - Chỉ cho phép user cập nhật thông tin của chính họ
    - Có thể cập nhật: name
    - Không cho phép thay đổi: email, password (cần endpoint riêng)
    """
    # Lấy collection 'users' từ MongoDB
    users_collection = await get_collection("users")
    
    # Lấy data từ request body
    body = await request.json()
    
    # Validate: Chỉ cho phép cập nhật name
    allowed_fields = ["name"]
    update_data = {}
    
    for field in allowed_fields:
        if field in body and body[field]:
            update_data[field] = body[field]
    
    # Nếu không có field nào để cập nhật
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không có thông tin nào để cập nhật"
        )
    
    # Kiểm tra nếu name đã tồn tại (của user khác)
    if "name" in update_data:
        existing_name = await users_collection.find_one({
            "name": update_data["name"],
            "_id": {"$ne": ObjectId(current_user["_id"])}  # Loại trừ user hiện tại
        })
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tên người dùng đã tồn tại. Vui lòng chọn tên khác."
            )
    
    # Thêm updatedAt timestamp
    update_data["updatedAt"] = datetime.utcnow()
    
    # Update user trong database
    result = await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể cập nhật thông tin"
        )
    
    # Lấy thông tin user đã cập nhật
    updated_user = await users_collection.find_one(
        {"_id": ObjectId(current_user["_id"])},
        {"password": 0, "verificationCode": 0, "verificationCodeExpiry": 0}
    )
    
    updated_user["_id"] = str(updated_user["_id"])
    
    return {
        "success": True,
        "message": "Cập nhật thông tin thành công",
        "user": updated_user
    }

