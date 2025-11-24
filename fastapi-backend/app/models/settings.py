from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

class SettingsBase(BaseModel):
    year: int = Field(..., description="Year for the settings (must be unique)")
    shippingFee: float = Field(default=10.0, ge=0, description="Shipping fee in USD")
    taxRate: float = Field(default=0.02, ge=0, le=1, description="Tax rate as decimal (e.g., 0.02 for 2%)")
    isActive: bool = Field(default=True, description="Whether this setting is currently active")

    @field_validator('year')
    @classmethod
    def validate_year(cls, v):
        if v < 2000 or v > 2100:
            raise ValueError('Year must be between 2000 and 2100')
        return v

    @field_validator('taxRate')
    @classmethod
    def validate_tax_rate(cls, v):
        if v < 0 or v > 1:
            raise ValueError('Tax rate must be between 0 and 1 (0% to 100%)')
        return v

    @field_validator('shippingFee')
    @classmethod
    def validate_shipping_fee(cls, v):
        if v < 0:
            raise ValueError('Shipping fee must be non-negative')
        return v


class SettingsCreate(SettingsBase):
    """Model for creating new settings"""
    pass


class SettingsUpdate(BaseModel):
    """Model for updating existing settings (all fields optional)"""
    shippingFee: Optional[float] = Field(None, ge=0, description="Shipping fee in USD")
    taxRate: Optional[float] = Field(None, ge=0, le=1, description="Tax rate as decimal")
    isActive: Optional[bool] = Field(None, description="Whether this setting is active")


class SettingsResponse(SettingsBase):
    """Model for settings response"""
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
