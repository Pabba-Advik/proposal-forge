from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Organization, User
from ..schemas import OrganizationCreate, OrganizationResponse
from ..auth import get_current_active_user

router = APIRouter(prefix="/organizations", tags=["organizations"])

@router.post("/", response_model=OrganizationResponse)
def create_organization(
    organization: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_organization = Organization(
        **organization.dict(),
        created_by=current_user.id
    )
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    return db_organization

@router.get("/", response_model=List[OrganizationResponse])
def list_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    organizations = db.query(Organization).offset(skip).limit(limit).all()
    return organizations

@router.get("/{organization_id}", response_model=OrganizationResponse)
def get_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    organization = db.query(Organization).filter(Organization.id == organization_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization
