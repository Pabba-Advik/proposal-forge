# ProposalForge Backend

A FastAPI-based backend for the ProposalForge enterprise proposal generation platform.

## Features

- **PostgreSQL Database**: Robust relational database with proper relationships
- **FastAPI Framework**: Modern, fast web framework with automatic API documentation
- **SQLAlchemy ORM**: Powerful database ORM with migrations support
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: User roles and permissions system
- **RESTful API**: Clean, well-structured API endpoints
- **Database Migrations**: Alembic for database schema management

## Setup Instructions

### 1. Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE proposalforge;
CREATE USER proposalforge_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE proposalforge TO proposalforge_user;
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```
DATABASE_URL=postgresql://proposalforge_user:your_password@localhost:5432/proposalforge
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run Database Migrations

Initialize Alembic and create the initial migration:

```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 6. Start the Server

```bash
python run.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Organizations
- `POST /organizations/` - Create organization
- `GET /organizations/` - List organizations
- `GET /organizations/{id}` - Get organization details

### Proposals
- `POST /proposals/` - Create proposal
- `GET /proposals/` - List proposals (with filters)
- `GET /proposals/{id}` - Get proposal details
- `PUT /proposals/{id}` - Update proposal
- `POST /proposals/{id}/sections` - Create proposal section
- `GET /proposals/{id}/sections` - Get proposal sections
- `PUT /proposals/{id}/sections/{section_id}` - Update section
- `GET /proposals/{id}/activities` - Get proposal activities

### Knowledge Base
- `POST /knowledge/` - Create knowledge item
- `GET /knowledge/` - List knowledge items
- `GET /knowledge/search` - Search knowledge base
- `PUT /knowledge/{id}/approve` - Approve knowledge item
- `PUT /knowledge/{id}/increment-usage` - Increment usage count

## Database Schema

The database includes the following main tables:

- **users**: User accounts and authentication
- **user_profiles**: User roles and permissions
- **organizations**: Client organizations
- **proposals**: Proposal documents
- **proposal_sections**: Individual proposal sections
- **knowledge_base**: Reusable content library
- **comments**: Collaboration comments
- **activities**: Audit trail
- **approvals**: Approval workflows
- **attachments**: File attachments

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black .
isort .
```

### Database Migrations

Create a new migration after model changes:

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## Production Deployment

1. Set up a production PostgreSQL database
2. Configure environment variables
3. Run migrations: `alembic upgrade head`
4. Use a production WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Security Notes

- Always use strong, unique SECRET_KEY in production
- Use environment variables for sensitive configuration
- Enable HTTPS in production
- Regularly update dependencies
- Implement rate limiting for production use
