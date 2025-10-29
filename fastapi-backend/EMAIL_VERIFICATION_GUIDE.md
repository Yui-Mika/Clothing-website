# 📧 HƯỚNG DẪN TRIỂN KHAI XÁC THỰC EMAIL

## 🎯 Tổng quan
Hướng dẫn này sẽ giúp bạn triển khai tính năng xác thực email khi đăng ký tài khoản sử dụng:
- **Gmail SMTP** để gửi email
- **JWT Token** để xác thực link
- **FastAPI Background Tasks** để gửi email bất đồng bộ

---

## 📋 Bước 1: Cài đặt thư viện cần thiết

```bash
pip install python-multipart aiosmtplib email-validator
```

Thêm vào file `requirements.txt`:
```
aiosmtplib==3.0.2
email-validator==2.1.0
```

---

## 🔧 Bước 2: Cấu hình Email trong settings.py

Mở file `fastapi-backend/app/config/settings.py` và thêm:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ... các settings hiện tại ...
    
    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "your-email@gmail.com"  # Email của bạn
    SMTP_PASSWORD: str = "your-app-password"  # App Password của Gmail
    SMTP_FROM_EMAIL: str = "your-email@gmail.com"
    SMTP_FROM_NAME: str = "Veloura Shop"
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:5173"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 🔐 Bước 3: Tạo App Password cho Gmail

### Cách lấy App Password từ Gmail:

1. **Đăng nhập Gmail** của bạn
2. Vào **Google Account Settings**: https://myaccount.google.com/
3. Chọn **Security** (Bảo mật)
4. Bật **2-Step Verification** (Xác minh 2 bước) nếu chưa bật
5. Sau khi bật 2-Step, tìm **App passwords** (Mật khẩu ứng dụng)
6. Chọn **Mail** và **Other (Custom name)**
7. Nhập tên: `Veloura Backend`
8. Click **Generate**
9. **Copy mật khẩu 16 ký tự** (dạng: xxxx xxxx xxxx xxxx)

### Thêm vào file `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Veloura Shop
FRONTEND_URL=http://localhost:5173
```

---

## 📧 Bước 4: Tạo Email Utility

Tạo file `fastapi-backend/app/utils/email.py`:

```python
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import settings
from app.utils.auth import create_access_token

async def send_verification_email(email: str, name: str, user_id: str):
    """
    Gửi email xác thực đến user mới đăng ký
    """
    # Tạo verification token (expire sau 1 giờ)
    token_data = {
        "user_id": user_id,
        "email": email,
        "purpose": "email_verification"
    }
    verification_token = create_access_token(
        data=token_data,
        expires_delta_minutes=60  # Token hết hạn sau 1 giờ
    )
    
    # URL xác thực
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    
    # Tạo nội dung email HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #4A90E2; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9f9f9; }}
            .button {{ 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #4A90E2; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Xác thực Email - Veloura Shop</h1>
            </div>
            <div class="content">
                <h2>Xin chào {name}!</h2>
                <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Veloura Shop</strong>.</p>
                <p>Để hoàn tất đăng ký, vui lòng nhấn vào nút bên dưới để xác thực email của bạn:</p>
                
                <div style="text-align: center;">
                    <a href="{verification_url}" class="button">Xác thực Email</a>
                </div>
                
                <p>Hoặc copy link sau vào trình duyệt:</p>
                <p style="word-break: break-all; color: #4A90E2;">{verification_url}</p>
                
                <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau <strong>1 giờ</strong>.</p>
                
                <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Veloura Shop. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Tạo message
    message = MIMEMultipart("alternative")
    message["Subject"] = "Xác thực Email - Veloura Shop"
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = email
    
    # Thêm HTML content
    html_part = MIMEText(html_content, "html")
    message.attach(html_part)
    
    # Gửi email
    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True
        )
        print(f"✅ Email xác thực đã được gửi đến {email}")
        return True
    except Exception as e:
        print(f"❌ Lỗi gửi email: {str(e)}")
        return False
```

---

## 🔄 Bước 5: Cập nhật User Model

Mở file `fastapi-backend/app/models/user.py` và thêm field `emailVerified`:

```python
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserInDB(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "customer"
    emailVerified: bool = False  # 👈 Thêm field này
    cartData: dict = {}
    isActive: bool = True
```

---

## 🛠️ Bước 6: Cập nhật Register Endpoint

Mở file `fastapi-backend/app/routes/user_routes.py` và cập nhật:

```python
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, BackgroundTasks
from app.utils.email import send_verification_email

@router.post("/register", response_model=dict)
async def register_user(user: UserCreate, background_tasks: BackgroundTasks):
    """
    Đăng ký tài khoản customer mới với xác thực email
    """
    users_collection = await get_collection("users")
    
    # Kiểm tra email đã tồn tại
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password (giữ nguyên code validation)
    # ... code validation password ...
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Tạo user document
    user_doc = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "cartData": {},
        "role": "customer",
        "emailVerified": False,  # 👈 Chưa xác thực
        "isActive": False,        # 👈 Tài khoản chưa active (đợi xác thực email)
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Lưu vào MongoDB
    result = await users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # 👉 Gửi email xác thực (background task - không block response)
    background_tasks.add_task(
        send_verification_email,
        email=user.email,
        name=user.name,
        user_id=user_id
    )
    
    return {
        "success": True,
        "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản."
    }
```

---

## ✅ Bước 7: Tạo Endpoint Verify Email

Thêm endpoint mới vào `user_routes.py`:

```python
@router.get("/verify-email", response_model=dict)
async def verify_email(token: str):
    """
    Xác thực email từ link trong email
    """
    from app.utils.auth import decode_access_token
    
    try:
        # Decode token
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        email = payload.get("email")
        purpose = payload.get("purpose")
        
        # Kiểm tra token đúng mục đích
        if purpose != "email_verification":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
        
        # Cập nhật user trong database
        users_collection = await get_collection("users")
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id), "email": email},
            {
                "$set": {
                    "emailVerified": True,
                    "isActive": True,  # Kích hoạt tài khoản
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "success": True,
            "message": "Email verified successfully! You can now login."
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
```

---

## 🎨 Bước 8: Tạo Frontend Verify Page

Tạo file `client/src/pages/VerifyEmail.jsx`:

```jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      
      if (!token) {
        setStatus("error");
        toast.error("Missing verification token");
        return;
      }

      try {
        const { data } = await axios.get(`/api/user/verify-email?token=${token}`);
        
        if (data.success) {
          setStatus("success");
          toast.success(data.message);
          setTimeout(() => navigate("/"), 3000);
        }
      } catch (error) {
        setStatus("error");
        toast.error(error.response?.data?.detail || "Verification failed");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8">
        {status === "verifying" && (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold mb-2">Đang xác thực email...</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">Xác thực thành công!</h2>
            <p className="text-gray-600">Tài khoản của bạn đã được kích hoạt</p>
            <p className="text-sm text-gray-500 mt-2">Đang chuyển hướng...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">Xác thực thất bại</h2>
            <p className="text-gray-600">Link xác thực không hợp lệ hoặc đã hết hạn</p>
            <button 
              onClick={() => navigate("/")}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Về trang chủ
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
```

Thêm route vào `client/src/App.jsx`:

```jsx
import VerifyEmail from './pages/VerifyEmail';

// Trong component App, thêm route:
<Route path="/verify-email" element={<VerifyEmail />} />
```

---

## 🔧 Bước 9: Cập nhật Login Endpoint

Cập nhật login để kiểm tra email đã xác thực chưa:

```python
@router.post("/login", response_model=dict)
async def login_user(user: UserLogin, response: Response):
    users_collection = await get_collection("users")
    
    db_user = await users_collection.find_one({"email": user.email})
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # 👉 Kiểm tra email đã xác thực chưa
    if not db_user.get("emailVerified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in"
        )
    
    # Tiếp tục logic login như cũ...
```

---

## 🧪 Bước 10: Test Email Verification

### 1. Test gửi email:
```bash
cd fastapi-backend
python -c "
import asyncio
from app.utils.email import send_verification_email
asyncio.run(send_verification_email('test@example.com', 'Test User', '123456'))
"
```

### 2. Test flow đầy đủ:
1. Đăng ký tài khoản mới
2. Kiểm tra email (inbox hoặc spam)
3. Click link xác thực
4. Đăng nhập thành công

---

## 🎯 Các tính năng bổ sung (Optional)

### 1. Gửi lại email xác thực:
```python
@router.post("/resend-verification", response_model=dict)
async def resend_verification(email: str, background_tasks: BackgroundTasks):
    users_collection = await get_collection("users")
    
    user = await users_collection.find_one({"email": email})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("emailVerified", False):
        return {"success": False, "message": "Email already verified"}
    
    background_tasks.add_task(
        send_verification_email,
        email=user["email"],
        name=user["name"],
        user_id=str(user["_id"])
    )
    
    return {"success": True, "message": "Verification email sent"}
```

### 2. Email template với logo và branding:
- Upload logo lên Cloudinary
- Thêm vào email HTML
- Customize màu sắc theo brand

### 3. Thông báo email welcome sau khi verify:
- Gửi email chào mừng
- Giới thiệu features
- Discount code cho đơn đầu tiên

---

## 🚨 Lưu ý bảo mật

1. **Không commit App Password vào Git**:
   - Thêm `.env` vào `.gitignore`
   - Sử dụng environment variables

2. **Rate limiting**:
   - Giới hạn số lần gửi email xác thực
   - Tránh spam

3. **Token expiration**:
   - Link xác thực hết hạn sau 1 giờ
   - User phải request gửi lại nếu hết hạn

4. **Validation**:
   - Kiểm tra email format
   - Validate token purpose

---

## 📚 Tài liệu tham khảo

- [Gmail SMTP Setup](https://support.google.com/mail/answer/7126229)
- [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)
- [aiosmtplib Documentation](https://aiosmtplib.readthedocs.io/)

---

## ✅ Checklist triển khai

- [ ] Cài đặt `aiosmtplib` và `email-validator`
- [ ] Tạo App Password từ Gmail
- [ ] Cập nhật `settings.py` và `.env`
- [ ] Tạo `app/utils/email.py`
- [ ] Cập nhật User model thêm `emailVerified`
- [ ] Cập nhật register endpoint
- [ ] Tạo verify-email endpoint
- [ ] Tạo VerifyEmail page (frontend)
- [ ] Thêm route `/verify-email` vào App.jsx
- [ ] Test gửi email thành công
- [ ] Test verify email thành công
- [ ] Test login với email chưa verify (bị chặn)
- [ ] Deploy lên production

---

**Chúc bạn triển khai thành công! 🎉**
