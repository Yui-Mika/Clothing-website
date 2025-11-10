"""
Verification Code Utilities
- Generate random OTP codes
- Check code expiry
- Rate limiting for resend
"""

import random
import string
from datetime import datetime, timedelta


def generate_verification_code(length: int = 6) -> str:
    """
    Generate random numeric OTP code
    
    Args:
        length: Length of code (default 6 digits)
    
    Returns:
        String of random digits (e.g., "582943")
    """
    return ''.join(random.choices(string.digits, k=length))


def is_code_expired(expiry: datetime) -> bool:
    """
    Check if verification code has expired
    
    Args:
        expiry: Expiry datetime (UTC)
    
    Returns:
        True if expired, False if still valid
    """
    return datetime.utcnow() > expiry


def can_resend_code(last_sent: datetime, cooldown_seconds: int = 60) -> bool:
    """
    Check if enough time passed to resend code (rate limiting)
    
    Args:
        last_sent: Last time code was sent (UTC)
        cooldown_seconds: Minimum seconds between resends (default 60)
    
    Returns:
        True if can resend, False if still in cooldown
    """
    if not last_sent:
        return True
    
    elapsed_seconds = (datetime.utcnow() - last_sent).total_seconds()
    return elapsed_seconds > cooldown_seconds


def get_remaining_cooldown(last_sent: datetime, cooldown_seconds: int = 60) -> int:
    """
    Get remaining seconds until can resend
    
    Args:
        last_sent: Last time code was sent (UTC)
        cooldown_seconds: Cooldown duration
    
    Returns:
        Remaining seconds (0 if can resend now)
    """
    if not last_sent:
        return 0
    
    elapsed = (datetime.utcnow() - last_sent).total_seconds()
    remaining = cooldown_seconds - elapsed
    
    return max(0, int(remaining))
