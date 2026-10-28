"""Pydantic schemas for Service endpoints."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ServiceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    url: str = Field(..., min_length=1, max_length=500)
    status: Optional[str] = "unknown"
    response_time_ms: Optional[float] = None
    uptime_percent: Optional[float] = 100.0
    environment: Optional[str] = "production"


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    status: Optional[str] = None
    response_time_ms: Optional[float] = None
    uptime_percent: Optional[float] = None
    environment: Optional[str] = None


class ServiceResponse(ServiceBase):
    id: int
    last_checked: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
