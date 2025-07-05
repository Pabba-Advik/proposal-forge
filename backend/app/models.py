from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, Table, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

# Association table for proposal assignments
proposal_assignments = Table(
    'proposal_assignments',
    Base.metadata,
    Column('proposal_id', Integer, ForeignKey('proposals.id')),
    Column('user_id', Integer, ForeignKey('users.id'))
)

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    PRESALES = "presales"
    VIEWER = "viewer"

class ProposalStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    SUBMITTED = "submitted"
    WON = "won"
    LOST = "lost"

class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SectionType(str, enum.Enum):
    EXECUTIVE_SUMMARY = "executive_summary"
    PROBLEM_STATEMENT = "problem_statement"
    SOLUTION = "solution"
    TIMELINE = "timeline"
    PRICING = "pricing"
    TEAM = "team"
    CASE_STUDIES = "case_studies"
    APPENDIX = "appendix"

class KnowledgeCategory(str, enum.Enum):
    CASE_STUDY = "case_study"
    SOLUTION_TEMPLATE = "solution_template"
    PRICING_MODEL = "pricing_model"
    TEAM_BIO = "team_bio"
    COMPANY_OVERVIEW = "company_overview"
    TECHNICAL_SPEC = "technical_spec"

class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    created_organizations = relationship("Organization", back_populates="creator")
    created_proposals = relationship("Proposal", back_populates="creator")
    assigned_proposals = relationship("Proposal", secondary=proposal_assignments, back_populates="assigned_users")
    knowledge_items = relationship("KnowledgeBase", back_populates="creator")
    comments = relationship("Comment", back_populates="author")
    activities = relationship("Activity", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    role = Column(Enum(UserRole), nullable=False)
    department = Column(String, nullable=False)
    permissions = Column(Text)  # JSON string of permissions array
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="profile")

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    industry = Column(String, nullable=False)
    size = Column(String, nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_organizations")
    proposals = relationship("Proposal", back_populates="organization")

class Proposal(Base):
    __tablename__ = "proposals"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    status = Column(Enum(ProposalStatus), default=ProposalStatus.DRAFT, index=True)
    priority = Column(Enum(Priority), default=Priority.MEDIUM)
    deadline = Column(DateTime(timezone=True), nullable=False, index=True)
    estimated_value = Column(Float, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    tags = Column(Text)  # JSON string of tags array
    current_version = Column(Integer, default=1)
    is_template = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="proposals")
    creator = relationship("User", back_populates="created_proposals")
    assigned_users = relationship("User", secondary=proposal_assignments, back_populates="assigned_proposals")
    sections = relationship("ProposalSection", back_populates="proposal")
    comments = relationship("Comment", back_populates="proposal")
    activities = relationship("Activity", back_populates="proposal")
    approvals = relationship("Approval", back_populates="proposal")
    attachments = relationship("Attachment", back_populates="proposal")

class ProposalSection(Base):
    __tablename__ = "proposal_sections"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    section_type = Column(Enum(SectionType), nullable=False)
    order = Column(Integer, nullable=False)
    last_edited_by = Column(Integer, ForeignKey("users.id"))
    version = Column(Integer, default=1)
    is_locked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    proposal = relationship("Proposal", back_populates="sections")
    last_editor = relationship("User")
    comments = relationship("Comment", back_populates="section")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    category = Column(Enum(KnowledgeCategory), nullable=False, index=True)
    tags = Column(Text)  # JSON string of tags array
    industry = Column(String, index=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    usage_count = Column(Integer, default=0)
    is_approved = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="knowledge_items")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"))
    section_id = Column(Integer, ForeignKey("proposal_sections.id"), nullable=True)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"))
    parent_comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    proposal = relationship("Proposal", back_populates="comments")
    section = relationship("ProposalSection", back_populates="comments")
    author = relationship("User", back_populates="comments")
    parent_comment = relationship("Comment", remote_side=[id])

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    proposal = relationship("Proposal", back_populates="activities")
    user = relationship("User", back_populates="activities")

class Approval(Base):
    __tablename__ = "approvals"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"))
    requested_by = Column(Integer, ForeignKey("users.id"))
    approver_role = Column(String, nullable=False)
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, index=True)
    comments = Column(Text)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True))
    
    # Relationships
    proposal = relationship("Proposal", back_populates="approvals")
    requester = relationship("User")

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"))
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Path to stored file
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    size = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    proposal = relationship("Proposal", back_populates="attachments")
    uploader = relationship("User")

class ProposalChat(Base):
    __tablename__ = "proposal_chats"
    
    id = Column(Integer, primary_key=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    proposal = relationship("Proposal")
    sender = relationship("User")
