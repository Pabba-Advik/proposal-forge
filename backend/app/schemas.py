from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from .models import UserRole, ProposalStatus, Priority, SectionType, KnowledgeCategory, ApprovalStatus

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserProfileBase(BaseModel):
    role: UserRole
    department: str
    permissions: List[str]

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    is_active: bool
    
    class Config:
        from_attributes = True

# Organization Schemas
class OrganizationBase(BaseModel):
    name: str
    industry: str
    size: str
    description: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: int
    created_by: int
    created_at: datetime
    creator: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Proposal Schemas
class ProposalBase(BaseModel):
    title: str
    description: str
    organization_id: int
    priority: Priority
    deadline: datetime
    estimated_value: float
    tags: List[str] = []

class ProposalCreate(ProposalBase):
    assigned_to: List[int] = []

class ProposalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProposalStatus] = None
    priority: Optional[Priority] = None
    deadline: Optional[datetime] = None
    estimated_value: Optional[float] = None
    tags: Optional[List[str]] = None

class ProposalResponse(ProposalBase):
    id: int
    status: ProposalStatus
    created_by: int
    current_version: int
    is_template: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    organization: Optional[OrganizationResponse] = None
    creator: Optional[UserResponse] = None
    assigned_users: List[UserResponse] = []
    
    class Config:
        from_attributes = True

# Proposal Section Schemas
class ProposalSectionBase(BaseModel):
    title: str
    content: str
    section_type: SectionType
    order: int

class ProposalSectionCreate(ProposalSectionBase):
    proposal_id: int

class ProposalSectionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    section_type: Optional[SectionType] = None
    order: Optional[int] = None

class ProposalSectionResponse(ProposalSectionBase):
    id: int
    proposal_id: int
    last_edited_by: int
    version: int
    is_locked: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_editor: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Knowledge Base Schemas
class KnowledgeBaseBase(BaseModel):
    title: str
    content: str
    category: KnowledgeCategory
    tags: List[str] = []
    industry: Optional[str] = None

class KnowledgeBaseCreate(KnowledgeBaseBase):
    pass

class KnowledgeBaseResponse(KnowledgeBaseBase):
    id: int
    created_by: int
    usage_count: int
    is_approved: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Comment Schemas
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    proposal_id: int
    section_id: Optional[int] = None
    parent_comment_id: Optional[int] = None

class CommentResponse(CommentBase):
    id: int
    proposal_id: int
    section_id: Optional[int] = None
    author_id: int
    parent_comment_id: Optional[int] = None
    is_resolved: bool
    created_at: datetime
    author: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Activity Schemas
class ActivityResponse(BaseModel):
    id: int
    proposal_id: int
    user_id: int
    action: str
    details: str
    timestamp: datetime
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
