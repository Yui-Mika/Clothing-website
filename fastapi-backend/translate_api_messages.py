"""
Script to translate all English API messages to Vietnamese in route files
"""

import re
from pathlib import Path

# Translation dictionary
TRANSLATIONS = {
    # Product messages
    "Product not found": "Không tìm thấy sản phẩm",
    "Product added successfully": "Thêm sản phẩm thành công",
    "Product updated successfully": "Cập nhật sản phẩm thành công",
    "Product deleted successfully": "Xóa sản phẩm thành công",
    "Discount.*enabled.*successfully": "Giảm giá đã được bật thành công",
    "Discount.*disabled.*successfully": "Giảm giá đã được tắt thành công",
    "Must provide either productIds or \\(category with applyToAll=true\\)": "Phải cung cấp productIds hoặc (category với applyToAll=true)",
    "No products found": "Không tìm thấy sản phẩm nào",
    "Applied.*discount to.*products": lambda m: f"Đã áp dụng {m.group(1)}% giảm giá cho {m.group(2)} sản phẩm",
    "Must provide either productIds or \\(category with removeAll=true\\)": "Phải cung cấp productIds hoặc (category với removeAll=true)",
    "Removed discount from.*products": lambda m: f"Đã xóa giảm giá khỏi {m.group(1)} sản phẩm",
    "Updated discount to.*for.*products": lambda m: f"Đã cập nhật giảm giá thành {m.group(1)}% cho {m.group(2)} sản phẩm",
    
    # Cart messages
    "Invalid size": "Kích cỡ không hợp lệ",
    "Item added to cart": "Đã thêm sản phẩm vào giỏ hàng",
    "Cart updated successfully": "Cập nhật giỏ hàng thành công",
    "Cart cleared successfully": "Đã xóa giỏ hàng thành công",
    
    # Order messages
    "Order placed successfully": "Đặt hàng thành công",
    "Invalid status": "Trạng thái không hợp lệ",
    "Order not found": "Không tìm thấy đơn hàng",
    "Order status updated successfully": "Cập nhật trạng thái đơn hàng thành công",
    "Payment verified successfully": "Xác minh thanh toán thành công",
    "Payment not completed": "Thanh toán chưa hoàn tất",
    
    # Contact messages
    "Your message has been sent successfully. We'll get back to you soon!": "Tin nhắn của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất!",
    "Contact not found": "Không tìm thấy tin nhắn liên hệ",
    "Contact status updated successfully": "Cập nhật trạng thái liên hệ thành công",
    "Contact deleted successfully": "Xóa tin nhắn liên hệ thành công",
    
    # Category messages
    "Category not found": "Không tìm thấy danh mục",
    "Category already exists": "Danh mục đã tồn tại",
    "Category added successfully": "Thêm danh mục thành công",
    "Category updated successfully": "Cập nhật danh mục thành công",
    "Category deleted successfully": "Xóa danh mục thành công",
    
    # Blog messages
    "Blog not found": "Không tìm thấy bài viết",
    "Blog added successfully": "Thêm bài viết thành công",
    "Blog updated successfully": "Cập nhật bài viết thành công",
    "Blog deleted successfully": "Xóa bài viết thành công",
    "Blog.*published.*successfully": "Bài viết đã được xuất bản thành công",
    "Blog.*unpublished.*successfully": "Bài viết đã được ẩn thành công",
    
    # Review messages  
    "You already reviewed this product. Please edit your existing review.": "Bạn đã đánh giá sản phẩm này rồi. Vui lòng chỉnh sửa đánh giá hiện tại.",
    "You must purchase and receive this product before writing a review": "Bạn phải mua và nhận sản phẩm này trước khi viết đánh giá",
    "Review created successfully": "Tạo đánh giá thành công",
    "Invalid product ID": "ID sản phẩm không hợp lệ",
    "Invalid review ID": "ID đánh giá không hợp lệ",
    "Review not found": "Không tìm thấy đánh giá",
    "You can only update your own reviews": "Bạn chỉ có thể cập nhật đánh giá của mình",
    "Review updated successfully": "Cập nhật đánh giá thành công",
    "You don't have permission to delete this review": "Bạn không có quyền xóa đánh giá này",
    "Review deleted successfully": "Xóa đánh giá thành công",
    
    # Testimonial messages
    "Testimonial not found": "Không tìm thấy lời chứng thực",
    "Testimonial added successfully": "Thêm lời chứng thực thành công",
    "Testimonial updated successfully": "Cập nhật lời chứng thực thành công",
    "Testimonial deleted successfully": "Xóa lời chứng thực thành công",
    "Testimonial.*published.*successfully": "Lời chứng thực đã được xuất bản thành công",
    "Testimonial.*unpublished.*successfully": "Lời chứng thực đã được ẩn thành công",
    
    # Wishlist messages
    "Invalid product id": "ID sản phẩm không hợp lệ",
    "Product added to wishlist": "Đã thêm sản phẩm vào danh sách yêu thích",
    "Product removed from wishlist": "Đã xóa sản phẩm khỏi danh sách yêu thích",
    "Wishlist cleared successfully": "Đã xóa danh sách yêu thích thành công",
}

def translate_file(file_path):
    """Translate English messages to Vietnamese in a single file"""
    print(f"Translating {file_path.name}...")
    
    content = file_path.read_text(encoding='utf-8')
    original_content = content
    changes = 0
    
    for english, vietnamese in TRANSLATIONS.items():
        # Check if it's a regex pattern
        if any(c in english for c in ['.*', '\\(', '\\)', '\\[']):
            # Regex replacement
            pattern = rf'detail="{english}"'
            matches = list(re.finditer(pattern, content))
            for match in matches:
                if callable(vietnamese):
                    # Dynamic replacement based on captured groups
                    replacement = vietnamese(match)
                    content = content.replace(match.group(0), f'detail="{replacement}"')
                else:
                    content = content.replace(match.group(0), f'detail="{vietnamese}"')
                changes += len(matches)
            
            # Also check "message": pattern
            pattern = rf'"message":\s*f?"[^"]*{english}[^"]*"'
            matches = list(re.finditer(pattern, content))
            if matches:
                for match in matches:
                    old_text = match.group(0)
                    if callable(vietnamese):
                        # Handle f-strings with dynamic content
                        continue  # Complex f-strings handled manually
                    else:
                        new_text = old_text.replace(english, vietnamese)
                        content = content.replace(old_text, new_text)
                changes += len(matches)
        else:
            # Simple string replacement
            # Replace in detail="" 
            old_detail = f'detail="{english}"'
            new_detail = f'detail="{vietnamese}"'
            if old_detail in content:
                content = content.replace(old_detail, new_detail)
                changes += content.count(new_detail) - original_content.count(new_detail)
            
            # Replace in "message": ""
            old_message = f'"message": "{english}"'
            new_message = f'"message": "{vietnamese}"'
            if old_message in content:
                content = content.replace(old_message, new_message)
                changes += content.count(new_message) - original_content.count(new_message)
    
    if content != original_content:
        file_path.write_text(content, encoding='utf-8')
        print(f"  ✓ Translated {changes} messages in {file_path.name}")
        return True
    else:
        print(f"  - No changes needed in {file_path.name}")
        return False

def main():
    """Main function to translate all route files"""
    routes_dir = Path(__file__).parent / "app" / "routes"
    
    if not routes_dir.exists():
        print(f"Error: Routes directory not found at {routes_dir}")
        return
    
    # Get all Python files except __init__.py
    route_files = [f for f in routes_dir.glob("*.py") if f.name != "__init__.py"]
    
    print(f"Found {len(route_files)} route files to translate\n")
    
    translated = 0
    for file_path in route_files:
        if translate_file(file_path):
            translated += 1
    
    print(f"\n✅ Translation complete! {translated}/{len(route_files)} files updated")

if __name__ == "__main__":
    main()
