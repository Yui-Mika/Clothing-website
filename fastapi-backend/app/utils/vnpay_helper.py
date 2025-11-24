"""
VNPay Payment Helper Functions
Xử lý tạo URL thanh toán và verify signature từ VNPay
"""
import hashlib
import hmac
import urllib.parse
from datetime import datetime
from typing import Dict
from app.config.settings import settings


def sort_params(params: Dict) -> Dict:
    """
    Sắp xếp params theo alphabet (yêu cầu của VNPay)
    """
    return dict(sorted(params.items()))


def create_secure_hash(params: Dict, secret_key: str) -> str:
    """
    Tạo HMAC SHA512 hash từ params và secret key
    
    Args:
        params: Dictionary chứa các params cần hash
        secret_key: VNPay secret key
    
    Returns:
        Hex string của HMAC SHA512 hash
    """
    # Sort params theo alphabet
    sorted_params = sort_params(params)
    
    # Tạo query string - VNPay yêu cầu URL encode các giá trị
    hash_data_parts = []
    for key, value in sorted_params.items():
        # URL encode value theo chuẩn VNPay
        encoded_value = urllib.parse.quote_plus(str(value))
        hash_data_parts.append(f"{key}={encoded_value}")
    
    hash_data = "&".join(hash_data_parts)
    
    # Debug logging
    print(f"🔐 Creating secure hash:")
    print(f"   Hash data: {hash_data}")
    print(f"   Secret key: {secret_key}")
    
    # HMAC SHA512
    secure_hash = hmac.new(
        secret_key.encode('utf-8'),
        hash_data.encode('utf-8'),
        hashlib.sha512
    ).hexdigest()
    
    print(f"   Generated hash: {secure_hash}")
    
    return secure_hash


def create_payment_url(
    order_id: str,
    amount: float,
    order_info: str,
    ip_addr: str
) -> str:
    """
    Tạo VNPay payment URL
    
    Args:
        order_id: ID của order (MongoDB _id)
        amount: Số tiền cần thanh toán (VNĐ)
        order_info: Mô tả đơn hàng
        ip_addr: IP address của user
    
    Returns:
        VNPay payment URL đầy đủ
    """
    # Chuẩn bị params theo VNPay specification
    params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': settings.VNPAY_TMN_CODE,
        'vnp_Amount': str(int(amount * 100)),  # VNPay yêu cầu amount * 100
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': order_id,  # Mã đơn hàng để tracking
        'vnp_OrderInfo': order_info,  # Sẽ được URL encode trong create_secure_hash
        'vnp_OrderType': 'other',
        'vnp_Locale': 'vn',
        'vnp_ReturnUrl': settings.VNPAY_RETURN_URL,
        'vnp_IpAddr': ip_addr,
        'vnp_CreateDate': datetime.now().strftime('%Y%m%d%H%M%S')
    }
    
    print(f"🔍 VNPay Payment URL Creation:")
    print(f"   Order ID: {order_id}")
    print(f"   Amount: {amount} VND")
    print(f"   Amount for VNPay (x100): {int(amount * 100)}")
    print(f"   TMN Code: {settings.VNPAY_TMN_CODE}")
    print(f"   Return URL: {settings.VNPAY_RETURN_URL}")
    
    # Tạo secure hash
    secure_hash = create_secure_hash(params, settings.VNPAY_HASH_SECRET)
    params['vnp_SecureHash'] = secure_hash
    
    # Build URL với query string
    query_string = urllib.parse.urlencode(params)
    payment_url = f"{settings.VNPAY_URL}?{query_string}"
    
    return payment_url


def verify_payment_signature(params: Dict) -> bool:
    """
    Verify signature từ VNPay callback
    
    Args:
        params: Dictionary chứa tất cả query params từ VNPay
    
    Returns:
        True nếu signature hợp lệ, False nếu không
    """
    # Lấy signature từ params
    vnp_secure_hash = params.get('vnp_SecureHash')
    if not vnp_secure_hash:
        print("❌ No vnp_SecureHash in params")
        return False
    
    # Loại bỏ vnp_SecureHash và vnp_SecureHashType khỏi params
    verify_params = {k: v for k, v in params.items() 
                     if k not in ['vnp_SecureHash', 'vnp_SecureHashType']}
    
    # Tạo hash từ params còn lại
    calculated_hash = create_secure_hash(verify_params, settings.VNPAY_HASH_SECRET)
    
    # Debug logging
    print(f"🔍 VNPay Signature Verification:")
    print(f"   Received hash: {vnp_secure_hash}")
    print(f"   Calculated hash: {calculated_hash}")
    print(f"   Match: {calculated_hash == vnp_secure_hash}")
    
    # So sánh hash
    return calculated_hash == vnp_secure_hash


def get_client_ip(request) -> str:
    """
    Lấy IP address của client từ request
    
    Args:
        request: FastAPI Request object
    
    Returns:
        IP address string
    """
    # Kiểm tra X-Forwarded-For header (nếu có proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Fallback về client host
    return request.client.host if request.client else "127.0.0.1"
