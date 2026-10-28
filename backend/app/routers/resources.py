"""Resources/Assets inventory CRUD router."""
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.get("/", response_model=List[ResourceResponse])
def get_resources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all resources."""
    resources = db.query(Resource).offset(skip).limit(limit).all()
    logger.info(f"Retrieved {len(resources)} resources")
    return resources


@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    """Retrieve a single resource by ID."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Resource {resource_id} not found")
    return resource


@router.post("/", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(resource_data: ResourceCreate, db: Session = Depends(get_db)):
    """Create a new resource record."""
    resource = Resource(**resource_data.model_dump())
    db.add(resource)
    db.commit()
    db.refresh(resource)
    logger.info(f"Created resource: {resource.id} - {resource.name}")
    return resource


@router.put("/{resource_id}", response_model=ResourceResponse)
def update_resource(resource_id: int, resource_data: ResourceUpdate, db: Session = Depends(get_db)):
    """Update an existing resource."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Resource {resource_id} not found")
    update_data = resource_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resource, field, value)
    db.commit()
    db.refresh(resource)
    logger.info(f"Updated resource: {resource_id}")
    return resource


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(resource_id: int, db: Session = Depends(get_db)):
    """Delete a resource record."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Resource {resource_id} not found")
    db.delete(resource)
    db.commit()
    logger.info(f"Deleted resource: {resource_id}")
