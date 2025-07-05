from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from ..database import get_db
from ..models import KnowledgeBase, User, UserProfile
from ..schemas import KnowledgeBaseCreate, KnowledgeBaseResponse
from ..auth import get_current_active_user
import json

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

@router.post("/", response_model=KnowledgeBaseResponse)
def create_knowledge_item(
    knowledge: KnowledgeBaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_knowledge = KnowledgeBase(
        title=knowledge.title,
        content=knowledge.content,
        category=knowledge.category,
        tags=json.dumps(knowledge.tags),
        industry=knowledge.industry,
        created_by=current_user.id,
        is_approved=False  # Requires approval
    )
    db.add(db_knowledge)
    db.commit()
    db.refresh(db_knowledge)
    return db_knowledge

@router.get("/", response_model=List[KnowledgeBaseResponse])
def list_knowledge_items(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    industry: Optional[str] = None,
    approved_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(KnowledgeBase)
    
    if approved_only:
        query = query.filter(KnowledgeBase.is_approved == True)
    if category:
        query = query.filter(KnowledgeBase.category == category)
    if industry:
        query = query.filter(KnowledgeBase.industry == industry)
    
    knowledge_items = query.offset(skip).limit(limit).all()
    return knowledge_items

@router.get("/search", response_model=List[KnowledgeBaseResponse])
def search_knowledge(
    q: str,
    category: Optional[str] = None,
    industry: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(KnowledgeBase).filter(
        and_(
            KnowledgeBase.is_approved == True,
            or_(
                KnowledgeBase.title.ilike(f"%{q}%"),
                KnowledgeBase.content.ilike(f"%{q}%")
            )
        )
    )
    
    if category:
        query = query.filter(KnowledgeBase.category == category)
    if industry:
        query = query.filter(KnowledgeBase.industry == industry)
    
    results = query.limit(20).all()
    return results

@router.put("/{knowledge_id}/approve")
def approve_knowledge_item(
    knowledge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user has approval permissions
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not user_profile:
        raise HTTPException(status_code=403, detail="User profile not found")
    
    permissions = json.loads(user_profile.permissions) if user_profile.permissions else []
    if "approve" not in permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    knowledge_item = db.query(KnowledgeBase).filter(KnowledgeBase.id == knowledge_id).first()
    if not knowledge_item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    
    knowledge_item.is_approved = True
    db.commit()
    
    return {"message": "Knowledge item approved"}

@router.put("/{knowledge_id}/increment-usage")
def increment_usage_count(
    knowledge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    knowledge_item = db.query(KnowledgeBase).filter(KnowledgeBase.id == knowledge_id).first()
    if not knowledge_item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    
    knowledge_item.usage_count += 1
    db.commit()
    
    return {"message": "Usage count incremented"}
