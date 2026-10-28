"""Services monitoring CRUD router."""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("/", response_model=List[ServiceResponse])
def get_services(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all monitored services."""
    services = db.query(Service).offset(skip).limit(limit).all()
    logger.info(f"Retrieved {len(services)} services")
    return services


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    """Retrieve a single service by ID."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Service {service_id} not found")
    return service


@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(service_data: ServiceCreate, db: Session = Depends(get_db)):
    """Add a new service to monitor."""
    service = Service(**service_data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    logger.info(f"Created service: {service.id} - {service.name}")
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: int, service_data: ServiceUpdate, db: Session = Depends(get_db)):
    """Update an existing service (e.g., status after a health check)."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Service {service_id} not found")
    update_data = service_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)
    service.last_checked = datetime.now(timezone.utc)
    db.commit()
    db.refresh(service)
    logger.info(f"Updated service: {service_id}")
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, db: Session = Depends(get_db)):
    """Remove a service from monitoring."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Service {service_id} not found")
    db.delete(service)
    db.commit()
    logger.info(f"Deleted service: {service_id}")
