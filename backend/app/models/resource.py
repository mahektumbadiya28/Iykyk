"""SQLAlchemy ORM model for Resources/Assets."""
from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from app.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(30), default="active")  # active, inactive, maintenance, retired
    quantity = Column(Integer, default=1)
    unit_cost = Column(Float, nullable=True)
    location = Column(String(200), nullable=True)
    owner = Column(String(100), nullable=True)
    tags = Column(String(500), nullable=True)  # comma-separated
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
