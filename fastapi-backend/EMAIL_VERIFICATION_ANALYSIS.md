# 📧 Phân Tích & Đề Xuất: Xác Thực Email

## 📋 LOGIC HIỆN TẠI (Verification Link Method)

### **Flow Hiện Tại:**

```
1. User đăng ký (POST /api/user/register)
   ↓
2. Tạo user mới với emailVerified=False, isActive=False
   ↓
3. Tạo JWT token với payload: {user_id, email, purpose: "email_verification"}
   ↓
4. Gửi email chứa verification link với token
   Link: {BACKEND_URL}/api/user/verify-email?token={JWT_TOKEN}
   ↓
5. User click link trong email
   ↓
6. Backend decode JWT token, validate purpose
   ↓
7. Update user: emailVerified=True, isActive=True
   ↓
8. Redirect về frontend với success message
   ↓
9. Gửi email chào mừng
```

### **Files Liên Quan:**

1. **`app/utils/email.py`**
   - `send_verification_email()`: Tạo JWT token (60 phút expiry), gửi link xác thực
   - Token payload: `{user_id, email, purpose: "email_verification"}`
   
2. **`app/routes/user_routes.py`**
   - `POST /register`: Gọi send_verification_email() qua BackgroundTasks
   - `GET /verify-email?token=xxx`: Decode token → Update user → Redirect
   - `POST /resend-verification`: Gửi lại email cho user chưa verify
   
3. **`app/models/user.py`** (user document)
   - `emailVerified: bool` - Trạng thái xác thực email
   - `isActive: bool` - Trạng thái kích hoạt tài khoản

### **Ưu Điểm:**
✅ **Đơn giản**: User chỉ cần click 1 link  
✅ **Tự động hoàn toàn**: Không cần nhập gì thêm  
✅ **UX tốt**: Click → Redirect → Done  
✅ **Token secure**: JWT với expiry time (60 phút)  

### **Nhược Điểm:**
❌ **Email client issues**: Link có thể bị chặn, không click được  
❌ **Token trong URL**: Token hiển thị rõ trong browser history  
❌ **Phụ thuộc email**: Nếu email bị delay hoặc spam folder → User không thể verify  
❌ **Không có fallback**: Nếu link expired → Phải resend email lại  

---

## 🚀 ĐỀ XUẤT MỚI (Verification Code Method)

### **Flow Mới (OTP Code):**

```
1. User đăng ký (POST /api/user/register)
   ↓
2. Tạo user mới với emailVerified=False, isActive=False
   ↓
3. Tạo mã OTP 6 số ngẫu nhiên (VD: 582943)
   ↓
4. Lưu OTP vào database: verificationCode, codeExpiry (5-10 phút)
   ↓
5. Gửi email chứa OTP code
   ↓
6. User nhập OTP trên trang web
   ↓
7. Frontend gọi POST /api/user/verify-code {email, code}
   ↓
8. Backend so sánh OTP với database, check expiry
   ↓
9. Nếu đúng: Update emailVerified=True, isActive=True, xóa code
   ↓
10. Gửi email chào mừng
```

### **Ưu Điểm:**
✅ **UX tốt hơn**: User nhập code ngay trên web, không cần mở email nhiều lần  
✅ **Không phụ thuộc email client**: Code hiển thị plain text, dễ copy  
✅ **Secure hơn**: Code ngắn hạn (5-10 phút), không hiển thị trong URL  
✅ **Fallback dễ dàng**: Có thể implement "Resend code" button ngay trên UI  
✅ **Modern UX**: Giống OTP banking, 2FA apps  

### **Nhược Điểm:**
⚠️ **Thêm 1 bước**: User phải copy code từ email → paste vào web  
⚠️ **Rate limiting cần thiết**: Ngăn chặn brute force attacks  
⚠️ **Database update**: Cần thêm fields `verificationCode`, `codeExpiry`  

---

## 📝 IMPLEMENTATION PLAN (Code-based Verification)

### **Phase 1: Database Schema Update**

#### **Thêm fields vào User Model:**
```python
# app/models/user.py

class User(BaseModel):
    # ... existing fields ...
    emailVerified: bool = False
    isActive: bool = False
    verificationCode: Optional[str] = None  # 👈 NEW: OTP code (6 digits)
    codeExpiry: Optional[datetime] = None   # 👈 NEW: Expiry time
    codeAttempts: int = 0                   # 👈 NEW: Failed attempts counter
    lastCodeSentAt: Optional[datetime] = None  # 👈 NEW: Prevent spam
```

#### **Migration Script (nếu có users hiện tại):**
```python
# scripts/add_verification_code_fields.py

async def migrate():
    users = await get_collection("users")
    result = await users.update_many(
        {},
        {
            "$set": {
                "verificationCode": None,
                "codeExpiry": None,
                "codeAttempts": 0,
                "lastCodeSentAt": None
            }
        }
    )
    print(f"Updated {result.modified_count} users")
```

---

### **Phase 2: Backend Implementation**

#### **1. Utility Functions (`app/utils/verification.py` - NEW FILE)**

```python
import random
import string
from datetime import datetime, timedelta

def generate_verification_code(length: int = 6) -> str:
    """Generate random numeric OTP code"""
    return ''.join(random.choices(string.digits, k=length))

def is_code_expired(expiry: datetime) -> bool:
    """Check if verification code has expired"""
    return datetime.utcnow() > expiry

def can_resend_code(last_sent: datetime, cooldown_seconds: int = 60) -> bool:
    """Check if enough time passed to resend code (rate limiting)"""
    if not last_sent:
        return True
    return (datetime.utcnow() - last_sent).total_seconds() > cooldown_seconds
```

#### **2. Update Email Function (`app/utils/email.py`)**

```python
async def send_verification_code_email(email: str, name: str, code: str) -> bool:
    """Send OTP verification code to user.
    
    Args:
        email: User's email
        name: User's name
        code: 6-digit verification code
    """
    if not _can_send_email or not conf:
        print(f"[WARN] SMTP not configured! Code for {email}: {code}")
        return False

    subject = "Email Verification Code - Veloura Shop"
    body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Email Verification</h1>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #667eea;">Hello {name}!</h2>
            <p style="color: #52525b; font-size: 16px;">Thank you for registering at <strong>Veloura Shop</strong>.</p>
            <p style="color: #52525b; font-size: 16px;">Your verification code is:</p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; margin: 30px 0; border-radius: 12px; text-align: center;">
                <div style="font-size: 42px; font-weight: 700; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    {code}
                </div>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p style="color: #856404; margin: 0; font-weight: 500;">⏰ This code will expire in <strong>10 minutes</strong></p>
                <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;">If you didn't request this, please ignore this email</p>
            </div>
            
            <p style="color: #71717a; font-size: 14px;">Enter this code on the verification page to complete your registration.</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #71717a; font-size: 13px; margin: 0;">&copy; 2025 Veloura Shop. All rights reserved.</p>
        </div>
    </div>
    """

    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=body,
        subtype="html",
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"[OK] Verification code sent to {email}")
        print(f"[DEBUG] Code: {code}")
        return True
    except Exception as e:
        print(f"[ERROR] Error sending email: {str(e)}")
        print(f"[DEBUG] Code for manual verification: {code}")
        return False
```

#### **3. Update Register Endpoint (`app/routes/user_routes.py`)**

```python
from app.utils.verification import generate_verification_code

@router.post("/register", response_model=dict)
async def register_user(user: UserCreate, background_tasks: BackgroundTasks):
    """Register with OTP verification code"""
    users_collection = await get_collection("users")
    
    # Check existing email
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check existing name
    existing_name = await users_collection.find_one({"name": user.name})
    if existing_name:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Validate password (existing validation code...)
    # ...
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # 👇 NEW: Generate verification code
    verification_code = generate_verification_code(length=6)
    code_expiry = datetime.utcnow() + timedelta(minutes=10)  # 10 minutes
    
    # Create user document
    user_doc = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "phone": user.phone,
        "address": user.address,
        "dateOfBirth": user.dateOfBirth.isoformat() if user.dateOfBirth else None,
        "gender": user.gender,
        "cartData": {},
        "role": "customer",
        "emailVerified": False,
        "isActive": False,
        "verificationCode": verification_code,  # 👈 NEW
        "codeExpiry": code_expiry,             # 👈 NEW
        "codeAttempts": 0,                     # 👈 NEW
        "lastCodeSentAt": datetime.utcnow(),   # 👈 NEW
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Insert to database
    result = await users_collection.insert_one(user_doc)
    
    # 👇 Send verification code email (instead of link)
    background_tasks.add_task(
        send_verification_code_email,
        email=user.email,
        name=user.name,
        code=verification_code
    )
    
    return {
        "success": True,
        "message": "Registration successful! Please check your email for verification code.",
        "email": user.email  # 👈 Return email for frontend to show verification form
    }
```

#### **4. NEW Endpoint: Verify Code (`app/routes/user_routes.py`)**

```python
from pydantic import BaseModel

class VerifyCodeRequest(BaseModel):
    email: str
    code: str

@router.post("/verify-code", response_model=dict)
async def verify_code(request: VerifyCodeRequest, background_tasks: BackgroundTasks):
    """Verify email using OTP code"""
    users_collection = await get_collection("users")
    
    # Find user by email
    user = await users_collection.find_one({"email": request.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already verified
    if user.get("emailVerified", False):
        return {
            "success": False,
            "message": "Email is already verified. You can login now."
        }
    
    # Check code attempts (prevent brute force)
    if user.get("codeAttempts", 0) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please request a new code."
        )
    
    # Check if code exists and not expired
    stored_code = user.get("verificationCode")
    code_expiry = user.get("codeExpiry")
    
    if not stored_code or not code_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code found. Please request a new one."
        )
    
    # Check expiry
    from app.utils.verification import is_code_expired
    if is_code_expired(code_expiry):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )
    
    # Verify code
    if stored_code != request.code:
        # Increment failed attempts
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$inc": {"codeAttempts": 1}}
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {4 - user.get('codeAttempts', 0)} attempts remaining."
        )
    
    # ✅ Code is correct! Update user
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "emailVerified": True,
                "isActive": True,
                "updatedAt": datetime.utcnow()
            },
            "$unset": {
                "verificationCode": "",
                "codeExpiry": "",
                "codeAttempts": "",
                "lastCodeSentAt": ""
            }
        }
    )
    
    # Send welcome email
    background_tasks.add_task(
        send_welcome_email,
        email=user["email"],
        name=user["name"]
    )
    
    return {
        "success": True,
        "message": "Email verified successfully! You can now login."
    }
```

#### **5. NEW Endpoint: Resend Code (`app/routes/user_routes.py`)**

```python
@router.post("/resend-code", response_model=dict)
async def resend_verification_code(email: str, background_tasks: BackgroundTasks):
    """Resend verification code with rate limiting"""
    users_collection = await get_collection("users")
    
    # Find user
    user = await users_collection.find_one({"email": email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already verified
    if user.get("emailVerified", False):
        return {
            "success": False,
            "message": "Email is already verified."
        }
    
    # Rate limiting: Check last code sent time (60 seconds cooldown)
    from app.utils.verification import can_resend_code
    last_sent = user.get("lastCodeSentAt")
    
    if not can_resend_code(last_sent, cooldown_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait before requesting a new code. Try again in a minute."
        )
    
    # Generate new code
    from app.utils.verification import generate_verification_code
    new_code = generate_verification_code(length=6)
    new_expiry = datetime.utcnow() + timedelta(minutes=10)
    
    # Update user with new code
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "verificationCode": new_code,
                "codeExpiry": new_expiry,
                "codeAttempts": 0,  # Reset attempts
                "lastCodeSentAt": datetime.utcnow()
            }
        }
    )
    
    # Send email
    background_tasks.add_task(
        send_verification_code_email,
        email=user["email"],
        name=user["name"],
        code=new_code
    )
    
    return {
        "success": True,
        "message": "A new verification code has been sent to your email."
    }
```

---

### **Phase 3: Frontend Implementation**

#### **1. NEW Component: `client/src/components/VerifyEmail.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { TbMail, TbShieldCheck } from 'react-icons/tb';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    document.getElementById('code-0')?.focus();
  }, []);

  // Handle input change
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d{6}$/.test(pastedData)) {
      toast.error('Please paste a valid 6-digit code');
      return;
    }
    
    const newCode = pastedData.split('');
    setCode(newCode);
    document.getElementById('code-5')?.focus();
  };

  // Submit verification
  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/verify-code`,
        {
          email: email,
          code: verificationCode
        }
      );

      if (response.data.success) {
        toast.success('Email verified successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Verification error:', error);
      const message = error.response?.data?.detail || 'Verification failed';
      toast.error(message);
      
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    if (countdown > 0) return;

    setResendLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/resend-code`,
        null,
        { params: { email: email } }
      );

      if (response.data.success) {
        toast.success('A new code has been sent to your email');
        setCountdown(60); // 60 seconds cooldown
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (error) {
      console.error('Resend error:', error);
      const message = error.response?.data?.detail || 'Failed to resend code';
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-4 rounded-full">
            <TbMail className="text-white text-4xl" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Verify Your Email
        </h2>
        <p className="text-center text-gray-600 mb-8">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-purple-600">{email}</span>
        </p>

        {/* Code Input */}
        <div className="flex gap-2 justify-center mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || code.join('').length !== 6}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Verifying...
            </>
          ) : (
            <>
              <TbShieldCheck className="text-xl" />
              Verify Email
            </>
          )}
        </button>

        {/* Resend Code */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={resendLoading || countdown > 0}
            className="text-purple-600 font-semibold hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {resendLoading ? (
              'Sending...'
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend Code'
            )}
          </button>
        </div>

        {/* Back to Login */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
```

#### **2. Update Login Component (`client/src/components/Login.jsx`)**

```jsx
// Thêm navigation khi đăng ký thành công
const handleRegisterSubmit = async (e) => {
  e.preventDefault();
  // ... existing validation ...

  try {
    const response = await axios.post(`${backendUrl}/api/user/register`, registerData);
    
    if (response.data.success) {
      toast.success(response.data.message);
      
      // 👇 Navigate to verification page with email
      navigate('/verify-email', { 
        state: { email: registerData.email }
      });
    }
  } catch (error) {
    // ... error handling ...
  }
};
```

#### **3. Update App Routes (`client/src/App.jsx`)**

```jsx
import VerifyEmail from './components/VerifyEmail';

// Add route
<Route path='/verify-email' element={<VerifyEmail />} />
```

---

## 🔐 Security Considerations

### **Rate Limiting:**
- **Resend Code**: 60 seconds cooldown
- **Verify Attempts**: Max 5 attempts per code
- **Implementation**: Track in database (`codeAttempts`, `lastCodeSentAt`)

### **Code Expiry:**
- **Duration**: 10 minutes (configurable)
- **Auto-cleanup**: Clear expired codes on verification attempt

### **Brute Force Protection:**
- After 5 failed attempts → Force user to request new code
- Consider IP-based rate limiting for high-security apps

---

## 📊 Comparison Table

| Feature | Link Method (Current) | Code Method (Proposed) |
|---------|----------------------|------------------------|
| **User Steps** | 1. Open email → 2. Click link | 1. Open email → 2. Copy code → 3. Paste in web |
| **UX Complexity** | ⭐⭐⭐⭐⭐ Very Simple | ⭐⭐⭐⭐ Simple |
| **Security** | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Better (short-lived, rate-limited) |
| **Email Client Issues** | ❌ High impact (link blocking) | ✅ Low impact (plain text code) |
| **Fallback Options** | Limited (resend email) | Easy (resend code button in UI) |
| **Token in URL** | ❌ Yes (browser history) | ✅ No (only in email) |
| **Implementation Effort** | ⭐ Easy (already done) | ⭐⭐⭐ Medium (need UI changes) |
| **Modern UX** | ⭐⭐⭐ Standard | ⭐⭐⭐⭐⭐ Modern (like 2FA apps) |

---

## 🎯 Recommendation

### **Option 1: Switch Completely to Code Method** ✅ RECOMMENDED
- **Best for**: Modern apps prioritizing UX and security
- **Effort**: Medium (2-3 hours implementation)
- **Benefit**: Better UX, more secure, easier debugging

### **Option 2: Hybrid Approach** (Both Methods)
- Send email with **both link AND code**
- User can choose: click link OR enter code
- **Pros**: Flexibility, backward compatibility
- **Cons**: More complex, confusing for users

### **Option 3: Keep Current Method**
- **Best for**: Simple apps with low user volume
- **Pros**: Already working, simple
- **Cons**: Potential email client issues

---

## 📝 Next Steps (If Choosing Code Method)

1. ✅ Review this document
2. ⬜ Approve implementation plan
3. ⬜ Create `app/utils/verification.py` with helper functions
4. ⬜ Update `app/models/user.py` with new fields
5. ⬜ Run migration script to add fields to existing users
6. ⬜ Update `app/utils/email.py` with code email template
7. ⬜ Update `/register` endpoint in `app/routes/user_routes.py`
8. ⬜ Create `/verify-code` endpoint
9. ⬜ Create `/resend-code` endpoint
10. ⬜ Create frontend `VerifyEmail.jsx` component
11. ⬜ Update `Login.jsx` to redirect to verification page
12. ⬜ Update `App.jsx` with new route
13. ⬜ Test full flow: Register → Receive code → Verify → Login
14. ⬜ Deploy to production

---

## 💡 Tips for Implementation

- **Start with development environment** first
- **Test rate limiting thoroughly** (60s cooldown, 5 attempts)
- **Handle edge cases**: expired codes, invalid email, already verified
- **Add logging** for debugging (print code in dev, hide in prod)
- **Consider SMS backup** for critical apps (Twilio, AWS SNS)
- **Monitor email deliverability** (check spam rates)

---

## 📮 Questions?

If you need help implementing this, I can:
1. Create the complete code files step by step
2. Help with testing and debugging
3. Suggest additional security measures
4. Optimize the user flow

**Would you like me to proceed with the implementation?** 🚀
