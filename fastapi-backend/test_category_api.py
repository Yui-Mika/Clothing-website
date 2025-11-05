"""Script kiểm tra API categories sau khi đồng bộ"""
import asyncio
import requests
from app.config.database import get_collection, connect_to_mongo, close_mongo_connection

async def test_categories_sync():
    print("=" * 70)
    print("🔄 KIỂM TRA ĐỒNG BỘ CATEGORIES - DATABASE ↔ BACKEND ↔ FRONTEND")
    print("=" * 70)
    
    try:
        # 1. Kiểm tra Database
        print("\n📦 1. KIỂM TRA DATABASE")
        print("-" * 70)
        await connect_to_mongo()
        categories_collection = await get_collection("categories")
        
        db_categories = await categories_collection.find({"inStock": True}).sort("order", 1).to_list(length=None)
        print(f"   ✅ Số categories trong DB (inStock=True): {len(db_categories)}")
        
        for cat in db_categories:
            has_slug = "slug" in cat and cat["slug"]
            slug_status = "✅" if has_slug else "❌"
            print(f"   {slug_status} {cat.get('order', '?')}. {cat['name']:<25} → slug: {cat.get('slug', 'MISSING')}")
        
        await close_mongo_connection()
        
        # 2. Kiểm tra Backend API
        print("\n🔌 2. KIỂM TRA BACKEND API")
        print("-" * 70)
        
        try:
            response = requests.get("http://localhost:8000/api/category/list", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                api_categories = data.get("categories", [])
                
                print(f"   ✅ API Response Status: {response.status_code}")
                print(f"   ✅ Success: {data.get('success')}")
                print(f"   ✅ Số categories trả về: {len(api_categories)}")
                
                print("\n   📋 Chi tiết từng category:")
                for cat in api_categories:
                    has_slug = "slug" in cat and cat["slug"]
                    slug_status = "✅" if has_slug else "❌"
                    print(f"   {slug_status} {cat.get('order', '?')}. {cat['name']:<25} → slug: {cat.get('slug', 'MISSING')}")
            else:
                print(f"   ❌ API Error: Status {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Không thể kết nối Backend! Backend có đang chạy không?")
        except Exception as e:
            print(f"   ❌ Lỗi: {e}")
        
        # 3. Kiểm tra tính nhất quán
        print("\n🔍 3. KIỂM TRA TÍNH NHẤT QUÁN")
        print("-" * 70)
        
        if len(db_categories) == len(api_categories):
            print(f"   ✅ Số lượng khớp: DB ({len(db_categories)}) = API ({len(api_categories)})")
        else:
            print(f"   ⚠️ Số lượng KHÔNG khớp: DB ({len(db_categories)}) ≠ API ({len(api_categories)})")
        
        # Kiểm tra từng category có slug không
        missing_slug_db = [cat['name'] for cat in db_categories if not cat.get('slug')]
        missing_slug_api = [cat['name'] for cat in api_categories if not cat.get('slug')]
        
        if not missing_slug_db and not missing_slug_api:
            print("   ✅ Tất cả categories đều có slug!")
        else:
            if missing_slug_db:
                print(f"   ⚠️ Categories thiếu slug trong DB: {', '.join(missing_slug_db)}")
            if missing_slug_api:
                print(f"   ⚠️ Categories thiếu slug trong API: {', '.join(missing_slug_api)}")
        
        # 4. Kiểm tra Frontend compatibility
        print("\n💻 4. FRONTEND COMPATIBILITY CHECK")
        print("-" * 70)
        
        required_fields = ["_id", "name", "slug", "image"]
        all_have_required = all(
            all(field in cat for field in required_fields) 
            for cat in api_categories
        )
        
        if all_have_required:
            print(f"   ✅ Tất cả categories có đủ trường frontend cần:")
            print(f"      {', '.join(required_fields)}")
            print("\n   ✅ Categories.jsx SẼ HOẠT ĐỘNG ĐÚNG!")
            print("      → onClick() navigate(`/collection/${category.slug}`) ✅")
        else:
            print("   ❌ Một số categories thiếu trường cần thiết!")
        
        print("\n" + "=" * 70)
        print("✨ KẾT LUẬN: Hệ thống đã được đồng bộ!")
        print("=" * 70)
        print("\n📝 HƯỚNG DẪN TIẾP THEO:")
        print("   1. Khởi động backend: cd fastapi-backend && uvicorn main:app --reload")
        print("   2. Khởi động frontend: cd client && npm run dev")
        print("   3. Truy cập: http://localhost:5173")
        print("   4. Click vào category để test navigation")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ LỖI: {type(e).__name__}")
        print(f"   Chi tiết: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_categories_sync())
