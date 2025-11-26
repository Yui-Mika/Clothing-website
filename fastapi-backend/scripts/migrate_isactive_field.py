"""
Migration Script: Thêm field isActive cho tất cả sản phẩm thiếu field này

Chạy script:
    python scripts/migrate_isactive_field.py

Mục đích:
    - Cập nhật tất cả sản phẩm chưa có field isActive thành isActive: True
    - Đảm bảo database đồng nhất
"""

import asyncio
import sys
from pathlib import Path

# Thêm thư mục gốc vào sys.path để import được config
sys.path.append(str(Path(__file__).parent.parent))

from app.config.database import connect_db, disconnect_db, get_collection
from datetime import datetime


async def migrate_isactive_field():
    """Migration: Thêm isActive = True cho sản phẩm thiếu field"""
    
    print("🚀 Bắt đầu migration isActive field...")
    
    try:
        # Kết nối database
        await connect_db()
        
        # Kết nối collection
        products_collection = await get_collection("products")
        
        # Đếm số sản phẩm thiếu field isActive
        products_without_isactive = await products_collection.count_documents({
            "isActive": {"$exists": False}
        })
        
        print(f"📊 Tìm thấy {products_without_isactive} sản phẩm thiếu field isActive")
        
        if products_without_isactive == 0:
            print("✅ Tất cả sản phẩm đã có field isActive!")
            return
        
        # Cập nhật tất cả sản phẩm thiếu field
        result = await products_collection.update_many(
            {"isActive": {"$exists": False}},  # Điều kiện: chưa có field isActive
            {
                "$set": {
                    "isActive": True,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        print(f"✅ Đã cập nhật {result.modified_count} sản phẩm")
        print("🎉 Migration hoàn tất!")
        
        # Kiểm tra lại
        remaining = await products_collection.count_documents({
            "isActive": {"$exists": False}
        })
        
        if remaining > 0:
            print(f"⚠️  Cảnh báo: Vẫn còn {remaining} sản phẩm thiếu field")
        else:
            print("✨ Database đã đồng nhất!")
            
    except Exception as e:
        print(f"❌ Lỗi migration: {str(e)}")
        raise
    finally:
        # Ngắt kết nối
        await disconnect_db()


if __name__ == "__main__":
    # Chạy migration
    asyncio.run(migrate_isactive_field())
