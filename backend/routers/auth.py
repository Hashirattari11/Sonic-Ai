from fastapi import APIRouter, HTTPException
import bcrypt as _bcrypt
from jose import jwt
from datetime import datetime, timedelta
import os

from ..models.schemas import SignupRequest, LoginRequest, AuthResponse
from ..database.db import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "sonic-ai-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72

def create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    db = await get_db()
    cursor = await db.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    existing = await cursor.fetchone()
    if existing:
        await db.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = _bcrypt.hashpw(req.password.encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')
    cursor = await db.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        (req.name, req.email, password_hash)
    )
    await db.commit()
    user_id = cursor.lastrowid

    token = create_token(user_id, req.email)
    user = {"id": user_id, "name": req.name, "email": req.email}
    await db.close()
    return {"user": user, "token": token}

@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    db = await get_db()
    cursor = await db.execute("SELECT * FROM users WHERE email = ?", (req.email,))
    user = await cursor.fetchone()
    if not user:
        await db.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not _bcrypt.checkpw(req.password.encode('utf-8'), user["password_hash"].encode('utf-8')):
        await db.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    cursor = await db.execute(
        "SELECT api_key, is_verified FROM api_keys WHERE user_id = ? AND is_verified = 1",
        (user["id"],)
    )
    api_key_row = await cursor.fetchone()

    token = create_token(user["id"], user["email"])
    user_data = {"id": user["id"], "name": user["name"], "email": user["email"]}
    has_api_key = api_key_row is not None
    api_key_verified = bool(api_key_row["is_verified"]) if api_key_row else False

    await db.close()
    return {
        "user": user_data,
        "token": token,
        "has_api_key": has_api_key,
        "api_key_verified": api_key_verified
    }
