# Hướng dẫn cài đặt FastAPI Backend cho Veloura

## Bước 1: Chuẩn bị môi trường

### 1.1 Cài đặt Python
- Yêu cầu: Python 3.8 trở lên
- Kiểm tra: `python --version`

### 1.2 Cài đặt MongoDB
**Windows:**
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Cài đặt và chạy MongoDB service
3. Kiểm tra: `mongosh` trong terminal

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### 1.3 Cài đặt MongoDB Compass (Optional, GUI Tool)
Download: https://www.mongodb.com/try/download/compass

## Bước 2: Cài đặt Project

### 2.1 Di chuyển vào thư mục backend
```bash
cd fastapi-backend
```

### 2.2 Tạo môi trường ảo
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2.3 Cài đặt dependencies
```bash
pip install -r requirements.txt
```

## Bước 3: Cấu hình môi trường

### 3.1 Tạo file .env
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

### 3.2 Chỉnh sửa file .env

#### MongoDB Configuration
```env
MONGODB_URL=mongodb://localhost:27017/
DATABASE_NAME=veloura_db
```

#### JWT Secret (Tạo secret key mạnh)
```bash
# Dùng Python để generate secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copy kết quả vào `JWT_SECRET` trong .env

#### Cloudinary Setup
1. Đăng ký tại: https://cloudinary.com/users/register/free
2. Vào Dashboard
3. Copy Cloud Name, API Key, API Secret
4. Paste vào .env:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret
```

#### Stripe Setup (cho Payment)
1. Đăng ký tại: https://dashboard.stripe.com/register
2. Vào Developers → API Keys
3. Copy Secret Key (Test mode)
4. Paste vào .env:
```env
STRIPE_SECRET_KEY=sk_test_51Abc...xyz
```

## Bước 4: Import dữ liệu MongoDB

### 4.1 Sử dụng MongoDB Compass (Cách dễ nhất)
1. Mở MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Tạo database mới: `veloura_db`
4. Cho mỗi collection:
   - Click "CREATE COLLECTION"
   - Nhập tên collection (users, products, orders, etc.)
   - Click "ADD DATA" → "Import JSON or CSV file"
   - Chọn file JSON tương ứng từ `mongodb_collections/`
   - Click "Import"

### 4.2 Sử dụng Command Line
```bash
cd mongodb_collections

# Windows (PowerShell)
Get-ChildItem *.json | ForEach-Object {
    mongoimport --db veloura_db --collection ($_.BaseName) --file $_.Name --jsonArray
}

# Mac/Linux
for file in *.json; do
    collection="${file%.json}"
    mongoimport --db veloura_db --collection "$collection" --file "$file" --jsonArray
done
```

### 4.3 Tạo Admin và Staff users
```bash
cd ..
python create_admin.py
```

## Bước 5: Chạy Server

### 5.1 Development Mode (với auto-reload)
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5.2 Kiểm tra server
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Bước 6: Test API

### 6.1 Test Health Check
```bash
curl http://localhost:8000/health
```

### 6.2 Test Admin Login
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/api/admin/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@veloura.com","password":"admin123"}'

# Mac/Linux
curl -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veloura.com","password":"admin123"}'
```

### 6.3 Sử dụng Swagger UI
1. Mở: http://localhost:8000/docs
2. Click vào endpoint bất kỳ
3. Click "Try it out"
4. Điền parameters và click "Execute"

## Bước 7: Kết nối với Frontend

### 7.1 Cập nhật Frontend URL
Trong file `.env`:
```env
FRONTEND_URL=http://localhost:5173
```

### 7.2 Cập nhật CORS settings (nếu cần)
Trong `main.py`, thêm frontend URL vào `allow_origins`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "your-frontend-url"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Bước 8: Troubleshooting

### Lỗi MongoDB Connection
```
Error: MongoNetworkError
```
**Giải pháp:**
- Kiểm tra MongoDB service đang chạy
- Windows: Services → MongoDB Server → Start
- Mac/Linux: `sudo systemctl status mongod`

### Lỗi Import Error
```
ModuleNotFoundError: No module named 'fastapi'
```
**Giải pháp:**
```bash
# Activate virtual environment trước
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Cài lại dependencies
pip install -r requirements.txt
```

### Lỗi Cloudinary Upload
```
Error: Authentication failed
```
**Giải pháp:**
- Kiểm tra lại credentials trong .env
- Đảm bảo không có dấu cách thừa
- API Secret phải chính xác

### Port 8000 đã được sử dụng
```
Error: Address already in use
```
**Giải pháp:**
```bash
# Đổi port khác
uvicorn main:app --reload --port 8001

# Hoặc kill process đang dùng port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

## Bước 9: Production Deployment

### 9.1 Environment Variables
- Đổi `JWT_SECRET` thành giá trị mạnh và unique
- Sử dụng production MongoDB (MongoDB Atlas)
- Sử dụng production Stripe keys
- Set `DEBUG=False`

### 9.2 Run với Gunicorn (Production)
```bash
pip install gunicorn

gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 9.3 Deploy lên Cloud
- **Heroku**: https://devcenter.heroku.com/articles/deploying-python
- **Railway**: https://railway.app/
- **Render**: https://render.com/
- **DigitalOcean**: https://www.digitalocean.com/

## Tài liệu tham khảo

- FastAPI: https://fastapi.tiangolo.com/
- MongoDB Motor: https://motor.readthedocs.io/
- Pydantic: https://docs.pydantic.dev/
- Cloudinary Python: https://cloudinary.com/documentation/python_integration
- Stripe Python: https://stripe.com/docs/api?lang=python

## Liên hệ hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs trong terminal
2. Xem lại các bước cài đặt
3. Tham khảo API docs: http://localhost:8000/docs
4. Tạo issue trên GitHub
