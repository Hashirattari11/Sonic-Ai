from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    user: dict
    token: str
    has_api_key: Optional[bool] = False
    api_key_verified: Optional[bool] = False

class APIKeyRequest(BaseModel):
    user_id: int
    api_key: str
    provider: Optional[str] = "openrouter"

class APIKeyResponse(BaseModel):
    id: int
    provider: str
    masked_key: str
    is_verified: bool
    created_at: str

class ChatRequest(BaseModel):
    message: str
    conversation_id: int
    user_id: int

class NewConversationRequest(BaseModel):
    user_id: int
    title: Optional[str] = None

class ConversationResponse(BaseModel):
    id: int
    title: Optional[str]
    created_at: str
    updated_at: str
    message_count: int = 0
    preview: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: str

class MemoryItem(BaseModel):
    key: str
    value: str

class ErrorResponse(BaseModel):
    detail: str
