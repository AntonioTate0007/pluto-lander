"""
Pydantic models for Pluto Lander API
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class User:
    username: str
    password_hash: str


class UserPublic(BaseModel):
    username: str

    model_config = {"from_attributes": True}


class SettingsBase(BaseModel):
    alpaca_api_key: Optional[str] = Field(None, description="Alpaca API Key")
    alpaca_api_secret: Optional[str] = Field(None, description="Alpaca API Secret")
    alpaca_paper: bool = Field(True, description="Use paper trading mode")

    notify_email: Optional[EmailStr] = None
    notify_sms_number: Optional[str] = None

    display_theme: str = "dark-gold"
    display_layout: str = "braiins-style"


class SettingsUpdate(SettingsBase):
    """Model for updating settings - all fields optional"""
    alpaca_api_key: Optional[str] = None
    alpaca_api_secret: Optional[str] = None
    alpaca_paper: Optional[bool] = None
    notify_email: Optional[EmailStr] = None
    notify_sms_number: Optional[str] = None
    display_theme: Optional[str] = None
    display_layout: Optional[str] = None


class SettingsPublic(SettingsBase):
    """Public settings with masked secrets"""
    alpaca_api_key: Optional[str] = None
    alpaca_api_secret: Optional[str] = None
    alpaca_api_key_masked: Optional[str] = None
    alpaca_api_secret_masked: Optional[str] = None


class TradeSignal(BaseModel):
    """Incoming trade signal from strategy"""
    symbol: str
    side: str
    confidence: float = 0.5
    reason: Optional[str] = None
    price: Optional[float] = None
    extra: Dict[str, Any] = {}


class TelemetryMessage(BaseModel):
    """WebSocket telemetry message"""
    type: str
    symbol: Optional[str] = None
    side: Optional[str] = None
    confidence: Optional[float] = None
    reason: Optional[str] = None
    price: Optional[float] = None
    extra: Dict[str, Any] = {}
