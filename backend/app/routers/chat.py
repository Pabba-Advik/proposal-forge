from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import ProposalChat, Proposal, User
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime

router = APIRouter()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schemas
class ChatMessage(BaseModel):
    sender_id: int
    message: str

class ChatResponse(BaseModel):
    id: int
    sender_id: int
    message: str
    timestamp: datetime

# In-memory WebSocket room manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, proposal_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(proposal_id, []).append(websocket)

    def disconnect(self, proposal_id: int, websocket: WebSocket):
        self.active_connections[proposal_id].remove(websocket)

    async def broadcast(self, proposal_id: int, message: Dict):
        for connection in self.active_connections.get(proposal_id, []):
            await connection.send_json(message)

manager = ConnectionManager()

# REST endpoints
@router.get("/api/proposals/{proposal_id}/chat", response_model=List[ChatResponse])
def get_chat(proposal_id: int, db: Session = Depends(get_db)):
    return db.query(ProposalChat).filter(ProposalChat.proposal_id == proposal_id).order_by(ProposalChat.timestamp).all()

@router.post("/api/proposals/{proposal_id}/chat", response_model=ChatResponse)
def post_message(proposal_id: int, msg: ChatMessage, db: Session = Depends(get_db)):
    new_msg = ProposalChat(
        proposal_id=proposal_id,
        sender_id=msg.sender_id,
        message=msg.message
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

# WebSocket endpoint
@router.websocket("/ws/proposals/{proposal_id}/chat")
async def websocket_chat(websocket: WebSocket, proposal_id: int):
    await manager.connect(proposal_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(proposal_id, data)
    except WebSocketDisconnect:
        manager.disconnect(proposal_id, websocket)
