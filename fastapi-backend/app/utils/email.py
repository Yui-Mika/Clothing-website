import os
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

load_dotenv()

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")
MAIL_SERVER = os.getenv("MAIL_SERVER")
MAIL_PORT = os.getenv("MAIL_PORT")
MAIL_STARTTLS = os.getenv("MAIL_TLS", "false").lower() == "true"
MAIL_SSL_TLS = os.getenv("MAIL_SSL", "true").lower() == "true"
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "Veloura Shop")

_can_send_email = all([MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM, MAIL_SERVER, MAIL_PORT])

if _can_send_email:
    try:
        conf = ConnectionConfig(
            MAIL_USERNAME=MAIL_USERNAME,
            MAIL_PASSWORD=MAIL_PASSWORD,
            MAIL_FROM=MAIL_FROM,
            MAIL_PORT=int(MAIL_PORT),
            MAIL_SERVER=MAIL_SERVER,
            MAIL_STARTTLS=MAIL_STARTTLS,
            MAIL_SSL_TLS=MAIL_SSL_TLS,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=False,
            TEMPLATE_FOLDER=None,
            MAIL_FROM_NAME=MAIL_FROM_NAME,
        )
        print(f"[OK] SMTP config successful!")
    except Exception as e:
        print(f"[ERROR] Error initializing SMTP config: {e}")
        conf = None
        _can_send_email = False
else:
    conf = None
    print("[WARN] Missing SMTP information in .env")


async def send_verification_email(email: str, name: str, user_id: str) -> bool:
    """Send email verification to user.

    Returns True if sent successfully or False if unable to send (missing config or SMTP error).
    
    Args:
        email: User's email address
        name: User's name
        user_id: MongoDB ObjectId of user (as string) - for creating verification token
    """
    if not _can_send_email or not conf:
        print("[WARN] SMTP not fully configured!")
        print(f"   MAIL_SERVER: {MAIL_SERVER or 'NOT SET'}")
        print(f"   MAIL_PORT: {MAIL_PORT or 'NOT SET'}")
        print(f"   MAIL_USERNAME: {MAIL_USERNAME or 'NOT SET'}")
        print(f"   MAIL_PASSWORD: {'***' if MAIL_PASSWORD else 'NOT SET'}")
        print(f"   MAIL_FROM: {MAIL_FROM or 'NOT SET'}")
        print(f"   -> Email will not be sent.")
        return False

    from app.utils.auth import create_access_token
    from datetime import timedelta
    from app.config.settings import settings
    
    token_data = {
        "user_id": user_id,
        "email": email,
        "purpose": "email_verification"
    }
    
    verification_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=60)
    )
    
    verification_url = f"{settings.BACKEND_URL}/api/user/verify-email?token={verification_token}"

    subject = "Email Verification - Veloura Shop"
    body = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 2px; margin-bottom: 8px;">
                VELOURA<span style="font-weight: 300; color: #fafafa;">SHOP</span>
            </div>
        </div>
        
        <div style="padding: 30px 20px; background-color: #ffffff;">
            <h2 style="color: #667eea; font-size: 24px; margin: 0 0 16px 0;">Welcome, {name}!</h2>
            <p style="color: #52525b; margin: 0 0 16px 0;">Thank you for signing up at <strong style="color: #667eea;">Veloura Shop</strong>.</p>
            <p style="color: #52525b; margin: 0 0 24px 0;">To complete your registration and start shopping, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_url}" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">Verify Email Now</a>
            </div>
            
            <div style="height: 1px; background-color: #e0e0e0; margin: 25px 0;"></div>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <p style="margin: 5px 0; font-size: 13px; color: #666;"><strong>Or copy this link to your browser:</strong></p>
                <p style="word-break: break-all; color: #667eea; font-family: monospace; font-size: 12px; margin: 5px 0;">{verification_url}</p>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p style="color: #856404; font-size: 14px; margin: 0; font-weight: 500;"><strong>Important:</strong></p>
                <p style="color: #856404; font-size: 14px; margin: 5px 0;">This link will expire in <strong>1 hour</strong></p>
                <p style="color: #856404; font-size: 14px; margin: 5px 0;">If you didn't create this account, please ignore this email</p>
            </div>
            
            <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">If you have any questions, please contact us via this email.</p>
            
            <p style="margin-top: 20px; font-size: 14px; color: #888;">
                Best regards,<br>
                <strong style="color: #667eea;">The Veloura Shop Team</strong>
            </p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e4e4e7;">
            <p style="color: #71717a; font-size: 13px; margin: 0 0 5px 0;">&copy; 2025 Veloura Shop. All rights reserved.</p>
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">This is an automated email. Please do not reply to this email.</p>
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
        print(f"[OK] Verification email sent to {email}")
        print(f"[DEBUG] Verification URL: {verification_url}")
        return True
    except Exception as e:
        print(f"[ERROR] Error sending email: {str(e)}")
        print(f"[DEBUG] Verification URL: {verification_url}")
        return False


async def send_verification_code_email(email: str, name: str, code: str) -> bool:
    """Send OTP verification code to user.
    
    Returns True if sent successfully or False if unable to send.
    
    Args:
        email: User's email address
        name: User's name
        code: 6-digit verification code
    """
    if not _can_send_email or not conf:
        print(f"[WARN] SMTP not configured! Code for {email}: {code}")
        return False

    subject = "Email Verification Code - Veloura Shop"
    body = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 2px; margin-bottom: 8px;">
                VELOURA<span style="font-weight: 300; color: #fafafa;">SHOP</span>
            </div>
            <h1 style="color: #ffffff; font-size: 24px; margin: 8px 0 0 0; font-weight: 500;">Email Verification</h1>
        </div>
        
        <div style="padding: 30px 20px; background-color: #ffffff;">
            <h2 style="color: #667eea; font-size: 22px; margin: 0 0 16px 0;">Hello {name}!</h2>
            <p style="color: #52525b; font-size: 16px; margin: 0 0 8px 0;">Thank you for registering at <strong style="color: #667eea;">Veloura Shop</strong>.</p>
            <p style="color: #52525b; font-size: 16px; margin: 0 0 24px 0;">Your email verification code is:</p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; margin: 30px 0; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                <div style="font-size: 48px; font-weight: 700; color: #ffffff; letter-spacing: 12px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    {code}
                </div>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p style="color: #856404; margin: 0; font-weight: 500; font-size: 14px;">⏰ <strong>Important:</strong></p>
                <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;">• This code will expire in <strong>10 minutes</strong></p>
                <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;">• You have <strong>5 attempts</strong> to enter the correct code</p>
                <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;">• If you didn't request this, please ignore this email</p>
            </div>
            
            <div style="background-color: #f0f9ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p style="color: #1e40af; margin: 0; font-size: 14px;">💡 <strong>Tip:</strong> You can copy and paste this code directly into the verification page.</p>
            </div>
            
            <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">Enter this code on the verification page to complete your registration and start shopping!</p>
            
            <p style="margin-top: 20px; font-size: 14px; color: #888;">
                Best regards,<br>
                <strong style="color: #667eea;">The Veloura Shop Team</strong>
            </p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e4e4e7;">
            <p style="color: #71717a; font-size: 13px; margin: 0 0 5px 0;">&copy; 2025 Veloura Shop. All rights reserved.</p>
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">This is an automated email. Please do not reply to this email.</p>
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


async def send_welcome_email(email: str, name: str) -> bool:
    """Send welcome email after successful email verification.

    Returns True if sent successfully or False if unable to send.
    
    Args:
        email: User's email address
        name: User's name
    """
    if not _can_send_email or not conf:
        print("[WARN] SMTP not configured. Welcome email not sent.")
        return False

    from app.config.settings import settings

    subject = "Welcome to Veloura Shop!"
    body = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Welcome to Veloura!</h1>
        </div>
        
        <div style="padding: 30px 20px; background-color: #ffffff;">
            <h2 style="color: #667eea; font-size: 22px; margin: 0 0 16px 0;">Hello {name}!</h2>
            <p style="color: #52525b; margin: 0 0 16px 0;">Congratulations on successfully verifying your email!</p>
            <p style="color: #52525b; margin: 0 0 16px 0;">Your account has been activated and is ready for shopping.</p>
            <p style="color: #52525b; margin: 0 0 24px 0;">Discover our latest fashion collections now!</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{settings.FRONTEND_URL}" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">Start Shopping</a>
            </div>
            
            <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">Thank you for choosing Veloura Shop!</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e4e4e7;">
            <p style="color: #71717a; font-size: 13px; margin: 0;">&copy; 2025 Veloura Shop</p>
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
        print(f"[OK] Welcome email sent to {email}")
        return True
    except Exception as e:
        print(f"[ERROR] Error sending welcome email: {str(e)}")
        return False


async def send_reset_password_email(email: str, name: str, reset_token: str, reset_url: str) -> bool:
    """Send password reset email to user.

    Returns True if sent successfully or False if unable to send.
    
    Args:
        email: User's email address
        name: User's name
        reset_token: Password reset token (for logging)
        reset_url: Full password reset URL
    """
    if not _can_send_email or not conf:
        print("[WARN] SMTP not configured!")
        print(f"   -> Email not sent. Use reset token in response: {reset_token}")
        return False

    subject = "Password Reset - Veloura Shop"
    body = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Password Reset</h1>
        </div>
        
        <div style="padding: 30px 20px; background-color: #ffffff;">
            <h2 style="color: #667eea; font-size: 22px; margin: 0 0 16px 0;">Hello {name},</h2>
            <p style="color: #52525b; margin: 0 0 16px 0;">We received a request to reset the password for your <strong style="color: #667eea;">Veloura Shop</strong> account.</p>
            <p style="color: #52525b; margin: 0 0 24px 0;">Please click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; border-radius: 4px; margin: 24px 0;">
                <p style="color: #856404; font-size: 14px; margin: 0; font-weight: 500;"><strong>Note:</strong> This link will expire in 1 hour.</p>
            </div>
            
            <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e4e4e7;">
            <p style="color: #71717a; font-size: 13px; margin: 0;">&copy; 2025 Veloura Shop</p>
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
        print(f"[OK] Password reset email sent to {email}")
        return True
    except Exception as e:
        print(f"[ERROR] Error sending email: {str(e)}")
        return False
