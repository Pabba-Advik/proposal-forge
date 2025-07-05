from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Proposal, ProposalSection, Activity, User, UserProfile
from ..schemas import (
    ProposalCreate, ProposalResponse, ProposalUpdate,
    ProposalSectionCreate, ProposalSectionResponse, ProposalSectionUpdate,
    ActivityResponse
)
from ..auth import get_current_active_user
import json

router = APIRouter(prefix="/proposals", tags=["proposals"])

@router.post("/", response_model=ProposalResponse)
def create_proposal(
    proposal: ProposalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Create proposal
    db_proposal = Proposal(
        title=proposal.title,
        description=proposal.description,
        organization_id=proposal.organization_id,
        priority=proposal.priority,
        deadline=proposal.deadline,
        estimated_value=proposal.estimated_value,
        tags=json.dumps(proposal.tags),
        created_by=current_user.id
    )
    
    # Add assigned users
    if proposal.assigned_to:
        assigned_users = db.query(User).filter(User.id.in_(proposal.assigned_to)).all()
        db_proposal.assigned_users = assigned_users
    
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    
    # Log activity
    activity = Activity(
        proposal_id=db_proposal.id,
        user_id=current_user.id,
        action="created",
        details=f"Created proposal: {proposal.title}"
    )
    db.add(activity)
    db.commit()
    
    return db_proposal

@router.get("/", response_model=List[ProposalResponse])
def list_proposals(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    organization_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Proposal)
    
    if status:
        query = query.filter(Proposal.status == status)
    if organization_id:
        query = query.filter(Proposal.organization_id == organization_id)
    
    proposals = query.offset(skip).limit(limit).all()
    return proposals

@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal

@router.put("/{proposal_id}", response_model=ProposalResponse)
def update_proposal(
    proposal_id: int,
    proposal_update: ProposalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not db_proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    update_data = proposal_update.dict(exclude_unset=True)
    if 'tags' in update_data:
        update_data['tags'] = json.dumps(update_data['tags'])
    
    for field, value in update_data.items():
        setattr(db_proposal, field, value)
    
    db.commit()
    db.refresh(db_proposal)
    
    # Log activity if status changed
    if proposal_update.status:
        activity = Activity(
            proposal_id=proposal_id,
            user_id=current_user.id,
            action="status_updated",
            details=f"Status changed to: {proposal_update.status}"
        )
        db.add(activity)
        db.commit()
    
    return db_proposal

# Proposal Sections
@router.post("/{proposal_id}/sections", response_model=ProposalSectionResponse)
def create_proposal_section(
    proposal_id: int,
    section: ProposalSectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify proposal exists
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    db_section = ProposalSection(
        proposal_id=proposal_id,
        title=section.title,
        content=section.content,
        section_type=section.section_type,
        order=section.order,
        last_edited_by=current_user.id
    )
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    
    # Log activity
    activity = Activity(
        proposal_id=proposal_id,
        user_id=current_user.id,
        action="section_created",
        details=f"Created section: {section.title}"
    )
    db.add(activity)
    db.commit()
    
    return db_section

@router.get("/{proposal_id}/sections", response_model=List[ProposalSectionResponse])
def get_proposal_sections(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sections = db.query(ProposalSection).filter(
        ProposalSection.proposal_id == proposal_id
    ).order_by(ProposalSection.order).all()
    return sections

@router.put("/{proposal_id}/sections/{section_id}", response_model=ProposalSectionResponse)
def update_proposal_section(
    proposal_id: int,
    section_id: int,
    section_update: ProposalSectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_section = db.query(ProposalSection).filter(
        ProposalSection.id == section_id,
        ProposalSection.proposal_id == proposal_id
    ).first()
    
    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    update_data = section_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_section, field, value)
    
    db_section.last_edited_by = current_user.id
    db_section.version += 1
    
    db.commit()
    db.refresh(db_section)
    return db_section

@router.get("/{proposal_id}/activities", response_model=List[ActivityResponse])
def get_proposal_activities(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    activities = db.query(Activity).filter(
        Activity.proposal_id == proposal_id
    ).order_by(Activity.timestamp.desc()).all()
    return activities
