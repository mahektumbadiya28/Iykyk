"""Pydantic schemas for Resource endpoints."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ResourceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    status: Optional[str] = "active"
    quantity: Optional[int] = 1
    unit_cost: Optional[float] = None
    location: Optional[str] = None
    owner: Optional[str] = None
    tags: Optional[str] = None


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    quantity: Optional[int] = None
    unit_cost: Optional[float] = None
    location: Optional[str] = None
    owner: Optional[str] = None
    tags: Optional[str] = None


class ResourceResponse(ResourceBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
