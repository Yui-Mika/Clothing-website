# 🚀 Hướng Dẫn Chạy Ứng Dụng (Frontend + Backend)

## 📋 Yêu Cầu Cần Có

- **Python 3.8+** (cho FastAPI Backend)
- **Node.js 16+** (cho React Frontend)
- **MongoDB** (đang chạy ở localhost:27017)

---

## ⚙️ Bước 1: Thiết Lập Backend (FastAPI)

### 1.1. Di chuyển vào thư mục backend
```powershell
cd d:\Code\Clothing-website\fastapi-backend
```

### 1.2. Tạo môi trường ảo Python (Virtual Environment)
```powershell
python -m venv venv
```

### 1.3. Kích hoạt môi trường ảo
```powershell
.\venv\Scripts\Activate.ps1
```

💡 **Lưu ý**: Nếu gặp lỗi "cannot be loaded because running scripts is disabled", chạy lệnh này:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 1.4. Cài đặt các dependencies
```powershell
pip install -r requirements.txt
```

### 1.5. Cấu hình file .env
Đảm bảo file `.env` trong thư mục `fastapi-backend` đã được cấu hình đúng:
- MongoDB URL
- Cloudinary credentials (nếu cần upload ảnh)
- Email configuration (cho xác thực email)
- Stripe keys (cho thanh toán)

### 1.6. Chạy Backend Server
```powershell
python main.py
```

✅ Backend sẽ chạy tại: **http://localhost:8000**
- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

---

## 🎨 Bước 2: Thiết Lập Frontend (React + Vite)

### 2.1. Mở terminal mới và di chuyển vào thư mục client
```powershell
cd d:\Code\Clothing-website\client
```

### 2.2. Cài đặt dependencies (nếu chưa cài)
```powershell
npm install
```

### 2.3. Kiểm tra file .env
File `.env` trong thư mục `client` đã được cấu hình:
```
VITE_CURRENCY="$"
VITE_BACKEND_URL="http://localhost:8000"
```

### 2.4. Chạy Frontend Development Server
```powershell
npm run dev
```

✅ Frontend sẽ chạy tại: **http://localhost:5173**

---

## 🔗 Bước 3: Kết Nối Frontend - Backend

### 3.1. CORS đã được cấu hình
Backend đã được cấu hình CORS để chấp nhận requests từ:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative port)
- `http://10.7.72.114:5173` (Server IP)

### 3.2. Kiểm tra kết nối
1. Mở trình duyệt tại: http://localhost:5173
2. Mở DevTools (F12) → Console
3. Kiểm tra xem có lỗi CORS hoặc network không

---

## 📝 Các Lệnh Hữu Ích

### Backend (FastAPI)
```powershell
# Khởi động lại server
python main.py

# Kiểm tra health
curl http://localhost:8000/health

# Xem API documentation
# Mở trình duyệt: http://localhost:8000/docs
```

### Frontend (React)
```powershell
# Development mode
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

---

## 🐛 Xử Lý Lỗi Thường Gặp

### 1. Backend không khởi động được
**Lỗi:** `ModuleNotFoundError: No module named 'fastapi'`
**Giải pháp:**
```powershell
cd fastapi-backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. MongoDB connection error
**Lỗi:** `pymongo.errors.ServerSelectionTimeoutError`
**Giải pháp:**
- Đảm bảo MongoDB đang chạy
- Kiểm tra `MONGODB_URL` trong `.env`
- Chạy MongoDB: `mongod` hoặc start MongoDB service

### 3. CORS Error trên Frontend
**Lỗi:** `Access to XMLHttpRequest blocked by CORS policy`
**Giải pháp:**
- Đảm bảo backend đang chạy ở port 8000
- Kiểm tra `VITE_BACKEND_URL` trong `client/.env`
- Restart cả frontend và backend

### 4. Frontend không kết nối được backend
**Kiểm tra:**
1. Backend có chạy không? → http://localhost:8000/health
2. Frontend có đúng URL không? → Check `client/.env`
3. Browser Console có lỗi gì không?

---

## 🎯 Luồng Làm Việc Khuyến Nghị

1. **Terminal 1**: Chạy MongoDB (nếu chưa chạy)
2. **Terminal 2**: Chạy Backend FastAPI
3. **Terminal 3**: Chạy Frontend React

---

## 📦 Cấu Trúc API Endpoints

Tất cả API endpoints bắt đầu với: `http://localhost:8000`

### User APIs
- `POST /api/user/register` - Đăng ký tài khoản
- `POST /api/user/login` - Đăng nhập
- `GET /api/user/profile` - Lấy thông tin user

### Product APIs
- `GET /api/product/list` - Lấy danh sách sản phẩm
- `GET /api/product/{product_id}` - Chi tiết sản phẩm
- `POST /api/product/add` - Thêm sản phẩm (Admin)

### Cart APIs
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart/add` - Thêm vào giỏ
- `DELETE /api/cart/remove` - Xóa khỏi giỏ

### Order APIs
- `POST /api/order/place` - Đặt hàng
- `GET /api/order/user` - Lấy đơn hàng của user

Xem chi tiết API tại: http://localhost:8000/docs

---

## ✨ Hoàn Tất!

Bây giờ bạn đã có:
✅ Backend FastAPI chạy ở port 8000
✅ Frontend React chạy ở port 5173
✅ Kết nối giữa Frontend - Backend đã được thiết lập
✅ CORS đã được cấu hình

**Truy cập ứng dụng tại:** http://localhost:5173

**API Documentation:** http://localhost:8000/docs
