from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base
from .routers import auth, organizations, proposals, knowledge,chat

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ProposalForge API",
    description="Enterprise Proposal Generation Platform API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(proposals.router)
app.include_router(knowledge.router)
app.include_router(chat.router)
@app.get("/")
def read_root():
    return {"message": "ProposalForge API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
