# Veloura E-commerce Backend (FastAPI)

FastAPI backend cho ứng dụng thương mại điện tử Veloura với MongoDB và Cloudinary.

## 📋 Tính năng

### 🔐 Phân quyền 3 cấp:
- **Customer**: Khách hàng
  - Đăng ký/Đăng nhập
  - Xem và tìm kiếm sản phẩm
  - Quản lý giỏ hàng
  - Đặt hàng (COD/Stripe)
  - Xem đơn hàng của mình
  - Xem blogs và testimonials
  - Gửi form liên hệ

- **Staff**: Nhân viên
  - Quản lý sản phẩm (Thêm/Sửa/Xóa)
  - Quản lý danh mục
  - Quản lý đơn hàng (Xem/Cập nhật trạng thái)
  - Quản lý blogs (Thêm/Sửa/Xóa)

- **Admin**: Quản trị viên
  - Tất cả quyền của Staff
  - Quản lý khách hàng (Xem/Khóa/Xóa)
  - Quản lý nhân viên
  - Xem báo cáo (Dashboard, Sales, Products, Revenue, Customers)

### 🛍️ Chức năng chính:
1. **Authentication**: JWT-based với cookies
2. **Products**: CRUD operations với upload ảnh Cloudinary
3. **Categories**: Quản lý danh mục sản phẩm
4. **Cart**: Quản lý giỏ hàng realtime
5. **Orders**: Đặt hàng với COD và Stripe payment
6. **Blogs**: Hệ thống blog đầy đủ
7. **Testimonials**: Đánh giá của khách hàng (cần duyệt)
8. **Contact**: Form liên hệ
9. **Reports**: Báo cáo chi tiết cho admin

## 🗂️ Cấu trúc thư mục

```
fastapi-backend/
├── app/
│   ├── __init__.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py        # Cấu hình môi trường
│   │   ├── database.py        # MongoDB connection
│   │   └── cloudinary.py      # Cloudinary setup
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py           # User, Auth models
│   │   ├── product.py        # Product models
│   │   ├── category.py       # Category models
│   │   ├── cart.py           # Cart models
│   │   ├── order.py          # Order models
│   │   ├── blog.py           # Blog models
│   │   ├── testimonial.py    # Testimonial models
│   │   └── contact.py        # Contact models
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── user_routes.py        # Customer auth & profile
│   │   ├── admin_routes.py       # Admin/Staff auth & management
│   │   ├── product_routes.py     # Product CRUD
│   │   ├── category_routes.py    # Category CRUD
│   │   ├── cart_routes.py        # Cart operations
│   │   ├── order_routes.py       # Order management
│   │   ├── blog_routes.py        # Blog CRUD
│   │   ├── testimonial_routes.py # Testimonial management
│   │   ├── contact_routes.py     # Contact form
│   │   └── report_routes.py      # Admin reports
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth_user.py      # Customer authentication
│   │   └── auth_admin.py     # Admin/Staff authentication
│   └── utils/
│       ├── __init__.py
│       └── auth.py           # JWT, password hashing
├── mongodb_collections/
│   ├── README.md
│   ├── users.json
│   ├── products.json
│   ├── orders.json
│   ├── categories.json
│   ├── blogs.json
│   ├── testimonials.json
│   └── contacts.json
├── main.py                   # FastAPI application
├── requirements.txt          # Python dependencies
├── .env.example             # Environment variables template
└── README.md                # This file
```

## 🚀 Cài đặt

### 1. Clone repository
```bash
cd fastapi-backend
```

### 2. Tạo môi trường ảo Python
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Cài đặt dependencies
```bash
pip install -r requirements.txt
```

### 4. Cấu hình môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Chỉnh sửa `.env` với thông tin của bạn:
```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017/
DATABASE_NAME=veloura_db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Admin credentials
ADMIN_EMAIL=admin@veloura.com
ADMIN_PASSWORD=admin123

# Delivery charges
DELIVERY_CHARGES=10.0
```

### 5. Import dữ liệu MongoDB
```bash
cd mongodb_collections
# Xem README.md trong thư mục này để import data
```

### 6. Chạy server
```bash
# Development mode với auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

Server sẽ chạy tại: http://localhost:8000

## 📚 API Documentation

Sau khi chạy server, truy cập:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔑 API Endpoints

### Authentication
- `POST /api/user/register` - Đăng ký customer
- `POST /api/user/login` - Đăng nhập customer
- `POST /api/user/logout` - Đăng xuất customer
- `GET /api/user/is-auth` - Kiểm tra auth
- `GET /api/user/profile` - Xem profile

### Admin Auth
- `POST /api/admin/login` - Đăng nhập admin/staff
- `POST /api/admin/logout` - Đăng xuất
- `GET /api/admin/is-auth` - Kiểm tra auth

### Products (Public + Staff)
- `GET /api/product/list` - Lấy danh sách sản phẩm
- `GET /api/product/{id}` - Chi tiết sản phẩm
- `POST /api/product/add` - Thêm sản phẩm [Staff]
- `PUT /api/product/{id}` - Cập nhật sản phẩm [Staff]
- `DELETE /api/product/{id}` - Xóa sản phẩm [Staff]

### Categories (Public + Staff)
- `GET /api/category/list` - Lấy danh sách danh mục
- `POST /api/category/add` - Thêm danh mục [Staff]
- `PUT /api/category/{id}` - Cập nhật [Staff]
- `DELETE /api/category/{id}` - Xóa [Staff]

### Cart (Customer)
- `POST /api/cart/add` - Thêm vào giỏ
- `POST /api/cart/update` - Cập nhật số lượng
- `GET /api/cart/get` - Xem giỏ hàng
- `DELETE /api/cart/clear` - Xóa giỏ hàng

### Orders (Customer + Staff)
- `POST /api/order/cod` - Đặt hàng COD [Customer]
- `POST /api/order/stripe` - Đặt hàng Stripe [Customer]
- `POST /api/order/userorders` - Đơn hàng của tôi [Customer]
- `POST /api/order/list` - Tất cả đơn hàng [Staff]
- `POST /api/order/status` - Cập nhật trạng thái [Staff]

### Blogs (Public + Staff)
- `GET /api/blog/list` - Lấy danh sách blogs
- `GET /api/blog/{id}` - Chi tiết blog
- `POST /api/blog/add` - Thêm blog [Staff]
- `PUT /api/blog/{id}` - Cập nhật [Staff]
- `DELETE /api/blog/{id}` - Xóa [Staff]

### Testimonials (Public + Staff)
- `GET /api/testimonial/list` - Lấy testimonials
- `POST /api/testimonial/add` - Thêm testimonial
- `PUT /api/testimonial/{id}/approve` - Duyệt [Staff]
- `DELETE /api/testimonial/{id}` - Xóa [Staff]

### Contact (Public + Staff)
- `POST /api/contact/submit` - Gửi liên hệ
- `GET /api/contact/list` - Xem tất cả [Staff]
- `GET /api/contact/{id}` - Chi tiết [Staff]
- `PUT /api/contact/{id}/status` - Cập nhật trạng thái [Staff]

### Admin Management
- `GET /api/admin/customers` - Quản lý khách hàng [Admin]
- `GET /api/admin/customers/{id}` - Chi tiết khách hàng [Admin]
- `PUT /api/admin/customers/{id}/toggle-status` - Khóa/Mở khóa [Admin]
- `DELETE /api/admin/customers/{id}` - Xóa khách hàng [Admin]

### Reports (Admin Only)
- `GET /api/report/dashboard` - Dashboard statistics
- `GET /api/report/sales` - Báo cáo doanh thu
- `GET /api/report/products` - Báo cáo sản phẩm
- `GET /api/report/customers` - Báo cáo khách hàng
- `GET /api/report/revenue` - Báo cáo revenue theo thời gian

## 🗄️ MongoDB Collections

1. **users** - Người dùng (customer, staff, admin)
2. **products** - Sản phẩm
3. **categories** - Danh mục
4. **orders** - Đơn hàng
5. **blogs** - Bài viết blog
6. **testimonials** - Đánh giá khách hàng
7. **contacts** - Liên hệ

Chi tiết về cấu trúc collections xem tại: `mongodb_collections/README.md`

## 🔒 Authentication Flow

### Customer Authentication:
1. Login → Nhận JWT token → Lưu vào cookie `token`
2. Mọi request customer gửi cookie `token`
3. Middleware `auth_user` verify token

### Admin/Staff Authentication:
1. Login → Nhận JWT token → Lưu vào cookie `admin_token`
2. Mọi request admin/staff gửi cookie `admin_token`
3. Middleware `auth_admin` verify token và role

## 🎨 Cloudinary Setup

1. Đăng ký tài khoản tại: https://cloudinary.com
2. Lấy Cloud Name, API Key, API Secret
3. Cấu hình trong `.env`
4. Upload ảnh sẽ tự động lên Cloudinary

## 💳 Stripe Payment Setup

1. Đăng ký tài khoản tại: https://stripe.com
2. Lấy Secret Key (Test mode)
3. Cấu hình trong `.env`
4. Test với card: `4242 4242 4242 4242`

## 🛠️ Development

### Cấu trúc Code:
- **Models**: Pydantic models cho validation
- **Routes**: API endpoints
- **Middleware**: Authentication và authorization
- **Utils**: Helper functions (JWT, password hashing)

### Best Practices:
- Sử dụng async/await cho tất cả database operations
- Validate input với Pydantic
- Handle errors properly
- Use proper HTTP status codes
- Document APIs với docstrings

## 📝 License

MIT License

## 👥 Contributors

- Backend Developer: FastAPI + MongoDB + Cloudinary + Stripe

## 🤝 Support

Nếu có vấn đề, vui lòng tạo issue trên GitHub.
