import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from .routers import auth, settings, chat, memory, voice, system
from .database.db import init_db

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Sonic AI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "file://"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(settings.router)
app.include_router(chat.router)
app.include_router(memory.router)
app.include_router(voice.router)
app.include_router(system.router)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)
