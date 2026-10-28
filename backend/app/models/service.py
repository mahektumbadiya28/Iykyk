"""SQLAlchemy ORM model for monitored Services."""
from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from app.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    url = Column(String(500), nullable=False)
    status = Column(String(20), default="unknown")  # online, offline, degraded, unknown
    response_time_ms = Column(Float, nullable=True)
    uptime_percent = Column(Float, default=100.0)
    environment = Column(String(50), default="production")
    last_checked = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
