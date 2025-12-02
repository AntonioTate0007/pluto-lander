"""
Security utilities for Pluto Lander
Password hashing and JWT token management
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import hashlib
import secrets
from .settings import settings as app_settings


def hash_password(password: str) -> str:
    """Hash password using SHA256 with salt"""
    salt = secrets.token_hex(16)
    hash_obj = hashlib.sha256((salt + password).encode())
    return f"{salt}${hash_obj.hexdigest()}"


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        salt, hash_value = hashed.split('$')
        hash_obj = hashlib.sha256((salt + plain).encode())
        return hash_obj.hexdigest() == hash_value
    except:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=12))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, app_settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt
