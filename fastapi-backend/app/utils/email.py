# ============================================================================
# EMAIL UTILITY - Tiện ích gửi email (Hỗ trợ cả SMTP và Resend API)
# ============================================================================

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import settings
from app.utils.auth import create_access_token
from datetime import timedelta

# Import Resend (optional - nếu không có sẽ dùng SMTP)
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    resend = None

# Khởi tạo Resend nếu có API key
if RESEND_AVAILABLE and hasattr(settings, 'RESEND_API_KEY') and settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY
    USE_RESEND = True
    print("📧 Email method: Resend API")
else:
    USE_RESEND = False
    print("📧 Email method: SMTP")

async def send_verification_email(email: str, name: str, user_id: str):
    """
    Gửi email xác thực đến user mới đăng ký
    
    Args:
        email: Email của user
        name: Tên của user
        user_id: MongoDB ObjectId của user (dạng string)
    
    Returns:
        bool: True nếu gửi thành công, False nếu thất bại
    """
    
    # ========================================================================
    # BƯỚC 1: Tạo verification token (hết hạn sau 1 giờ)
    # ========================================================================
    token_data = {
        "user_id": user_id,
        "email": email,
        "purpose": "email_verification"  # Mục đích: xác thực email
    }
    
    # Tạo JWT token với thời gian hết hạn 60 phút
    verification_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=60)
    )
    
    # ========================================================================
    # BƯỚC 2: Tạo URL xác thực
    # ========================================================================
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    
    # ========================================================================
    # BƯỚC 3: Tạo nội dung email HTML đẹp mắt
    # ========================================================================
    html_content = f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                background-color: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }}
            .content {{
                padding: 30px 40px;
                background-color: #ffffff;
            }}
            .content h2 {{
                color: #667eea;
                font-size: 22px;
                margin-bottom: 15px;
            }}
            .content p {{
                margin: 12px 0;
                color: #555;
                font-size: 15px;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .button {{
                display: inline-block;
                padding: 14px 35px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                transition: transform 0.3s ease;
            }}
            .button:hover {{
                transform: translateY(-2px);
            }}
            .link-box {{
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #667eea;
            }}
            .link-box p {{
                margin: 5px 0;
                font-size: 13px;
                color: #666;
            }}
            .link-text {{
                word-break: break-all;
                color: #667eea;
                font-family: monospace;
                font-size: 12px;
            }}
            .warning-box {{
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 8px;
            }}
            .warning-box p {{
                margin: 5px 0;
                color: #856404;
                font-size: 14px;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                background-color: #f9f9f9;
                color: #666;
                font-size: 13px;
                border-top: 1px solid #e0e0e0;
            }}
            .footer p {{
                margin: 5px 0;
            }}
            .divider {{
                height: 1px;
                background-color: #e0e0e0;
                margin: 25px 0;
            }}
            strong {{
                color: #667eea;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>🎉 Xác Thực Email</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Veloura Shop</p>
            </div>
            
            <!-- Main Content -->
            <div class="content">
                <h2>Xin chào {name}! 👋</h2>
                
                <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Veloura Shop</strong>.</p>
                
                <p>Để hoàn tất đăng ký và bắt đầu mua sắm, vui lòng xác thực địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>
                
                <!-- Button -->
                <div class="button-container">
                    <a href="{verification_url}" class="button">
                        ✓ Xác Thực Email Ngay
                    </a>
                </div>
                
                <!-- Divider -->
                <div class="divider"></div>
                
                <!-- Alternative Link -->
                <div class="link-box">
                    <p><strong>Hoặc copy link sau vào trình duyệt:</strong></p>
                    <p class="link-text">{verification_url}</p>
                </div>
                
                <!-- Warning -->
                <div class="warning-box">
                    <p><strong>⚠️ Lưu ý quan trọng:</strong></p>
                    <p>• Link này sẽ hết hạn sau <strong>1 giờ</strong></p>
                    <p>• Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này</p>
                </div>
                
                <p style="margin-top: 25px;">Nếu bạn gặp bất kỳ vấn đề nào, vui lòng liên hệ với chúng tôi qua email này.</p>
                
                <p style="margin-top: 20px; font-size: 14px; color: #888;">
                    Trân trọng,<br>
                    <strong style="color: #667eea;">Đội ngũ Veloura Shop</strong>
                </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>&copy; 2025 Veloura Shop. All rights reserved.</p>
                <p>Đây là email tự động, vui lòng không trả lời email này.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # ========================================================================
    # BƯỚC 5: Gửi email (tự động chọn Resend hoặc SMTP)
    # ========================================================================
    
    # Nếu có Resend API key, dùng Resend (khuyên dùng)
    if USE_RESEND:
        try:
            params = {
                "from": f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or 'onboarding@resend.dev'}>",
                "to": [email],
                "subject": "🎉 Xác thực Email - Veloura Shop",
                "html": html_content,
            }
            
            response = resend.Emails.send(params)
            print(f"✅ Email xác thực đã được gửi thành công đến: {email} (via Resend)")
            return True
            
        except Exception as e:
            print(f"❌ Lỗi khi gửi email qua Resend đến {email}: {str(e)}")
            print(f"📧 [ERROR] Verification URL: {verification_url}")
            return False
    
    # Nếu không có Resend, dùng SMTP
    else:
        # Tạo email message cho SMTP
        message = MIMEMultipart("alternative")
        message["Subject"] = "🎉 Xác thực Email - Veloura Shop"
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
        message["To"] = email
        
        # Thêm HTML content vào message
        html_part = MIMEText(html_content, "html", "utf-8")
        message.attach(html_part)
        
        try:
            # Kiểm tra xem có cấu hình SMTP không
            if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
                print("⚠️  SMTP chưa được cấu hình. Email sẽ không được gửi.")
                print(f"📧 [DEV MODE] Verification URL: {verification_url}")
                return False
            
            # Gửi email bất đồng bộ qua SMTP
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=True if settings.SMTP_PORT == 465 else False,  # SSL cho port 465
                start_tls=True if settings.SMTP_PORT == 587 else False  # TLS cho port 587
            )
            
            print(f"✅ Email xác thực đã được gửi thành công đến: {email} (via SMTP)")
            return True
            
        except Exception as e:
            print(f"❌ Lỗi khi gửi email qua SMTP đến {email}: {str(e)}")
            print(f"📧 [ERROR] Verification URL: {verification_url}")
            return False


async def send_welcome_email(email: str, name: str):
    """
    Gửi email chào mừng sau khi user xác thực email thành công
    
    Args:
        email: Email của user
        name: Tên của user
    """
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                background-color: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }}
            .content {{
                padding: 30px 40px;
            }}
            .button {{
                display: inline-block;
                padding: 14px 35px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                background-color: #f9f9f9;
                color: #666;
                font-size: 13px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎊 Chào Mừng Đến Veloura!</h1>
            </div>
            <div class="content">
                <h2>Xin chào {name}!</h2>
                <p>Chúc mừng bạn đã xác thực email thành công! 🎉</p>
                <p>Tài khoản của bạn đã được kích hoạt và sẵn sàng để mua sắm.</p>
                <p>Khám phá ngay bộ sưu tập thời trang mới nhất của chúng tôi!</p>
                <div style="text-align: center;">
                    <a href="{settings.FRONTEND_URL}" class="button">Bắt Đầu Mua Sắm</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2025 Veloura Shop</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Gửi email qua Resend nếu có
    if USE_RESEND:
        try:
            params = {
                "from": f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or 'onboarding@resend.dev'}>",
                "to": [email],
                "subject": "🎊 Chào mừng đến với Veloura Shop!",
                "html": html_content,
            }
            
            response = resend.Emails.send(params)
            print(f"✅ Email chào mừng đã được gửi đến: {email} (via Resend)")
            return True
            
        except Exception as e:
            print(f"❌ Lỗi khi gửi email chào mừng qua Resend: {str(e)}")
            return False
    
    # Gửi email qua SMTP nếu không có Resend
    else:
        message = MIMEMultipart("alternative")
        message["Subject"] = "🎊 Chào mừng đến với Veloura Shop!"
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
        message["To"] = email
        
        html_part = MIMEText(html_content, "html", "utf-8")
        message.attach(html_part)
        
        try:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                await aiosmtplib.send(
                    message,
                    hostname=settings.SMTP_HOST,
                    port=settings.SMTP_PORT,
                    username=settings.SMTP_USER,
                    password=settings.SMTP_PASSWORD,
                    use_tls=True if settings.SMTP_PORT == 465 else False,  # SSL cho port 465
                    start_tls=True if settings.SMTP_PORT == 587 else False  # TLS cho port 587
                )
                print(f"✅ Email chào mừng đã được gửi đến: {email} (via SMTP)")
                return True
        except Exception as e:
            print(f"❌ Lỗi khi gửi email chào mừng qua SMTP: {str(e)}")
            return False
