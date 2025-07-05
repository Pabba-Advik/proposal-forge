-- ProposalForge Database Setup Script
-- Run this script to create the database and user

-- Create database
CREATE DATABASE proposalforge;

-- Create user (replace 'your_password' with a strong password)
CREATE USER proposalforge_user WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE proposalforge TO proposalforge_user;

-- Connect to the database
\c proposalforge;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO proposalforge_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO proposalforge_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO proposalforge_user;

-- Enable UUID extension (optional, for UUID primary keys if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance (these will be created by Alembic migrations)
-- But you can run them manually if needed:

-- User indexes
-- CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_users_is_active ON users(is_active);

-- Proposal indexes
-- CREATE INDEX idx_proposals_status ON proposals(status);
-- CREATE INDEX idx_proposals_deadline ON proposals(deadline);
-- CREATE INDEX idx_proposals_organization_id ON proposals(organization_id);
-- CREATE INDEX idx_proposals_created_by ON proposals(created_by);

-- Knowledge base indexes
-- CREATE INDEX idx_knowledge_category ON knowledge_base(category);
-- CREATE INDEX idx_knowledge_is_approved ON knowledge_base(is_approved);
-- CREATE INDEX idx_knowledge_industry ON knowledge_base(industry);

-- Full-text search indexes for knowledge base
-- CREATE INDEX idx_knowledge_title_fts ON knowledge_base USING gin(to_tsvector('english', title));
-- CREATE INDEX idx_knowledge_content_fts ON knowledge_base USING gin(to_tsvector('english', content));

-- Activity indexes
-- CREATE INDEX idx_activities_proposal_id ON activities(proposal_id);
-- CREATE INDEX idx_activities_timestamp ON activities(timestamp);

-- Comment indexes
-- CREATE INDEX idx_comments_proposal_id ON comments(proposal_id);
-- CREATE INDEX idx_comments_section_id ON comments(section_id);

COMMIT;
