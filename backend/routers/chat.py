from fastapi import APIRouter, HTTPException
from ..models.schemas import ChatRequest, NewConversationRequest, ConversationResponse, MessageResponse
from ..database.db import get_db
from ..services.gemini import CommandExecutor, SystemMonitor
from ..services.ai_factory import get_ai_service, get_user_ai_service

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/message", response_model=dict)
async def send_message(req: ChatRequest):
    db = await get_db()

    try:
        # Check for local commands first (before requiring API key)
        system_info = SystemMonitor.get_stats()
        local_result = await CommandExecutor.execute(req.message, system_info)

        if local_result.get("handled"):
            response_text = local_result["response"]
            if isinstance(response_text, str) and response_text.startswith("PRESENTATION_TASK:"):
                cursor = await db.execute(
                    "SELECT provider, api_key FROM api_keys WHERE user_id = ? AND is_verified = 1 ORDER BY created_at DESC LIMIT 1",
                    (req.user_id,)
                )
                row = await cursor.fetchone()
                if row:
                    service = get_ai_service(row["provider"], row["api_key"])
                    response_text = await service._run_presentation_task(
                        response_text.split(":", 1)[1]
                    )
            elif isinstance(response_text, str) and response_text.startswith("WRITE_TASK:"):
                cursor = await db.execute(
                    "SELECT provider, api_key FROM api_keys WHERE user_id = ? AND is_verified = 1 ORDER BY created_at DESC LIMIT 1",
                    (req.user_id,)
                )
                row = await cursor.fetchone()
                if row:
                    service = get_ai_service(row["provider"], row["api_key"])
                    response_text = await service._run_write_task(
                        response_text.split(":", 1)[1], req.message, system_info
                    )
            await db.execute(
                "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
                (req.conversation_id, "user", req.message)
            )
            await db.execute(
                "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
                (req.conversation_id, "assistant", response_text)
            )
            await db.commit()
            await db.close()
            return {"response": response_text, "status": "success"}

        cursor = await db.execute(
            "SELECT provider, api_key FROM api_keys WHERE user_id = ? AND is_verified = 1 ORDER BY created_at DESC LIMIT 1",
            (req.user_id,)
        )
        row = await cursor.fetchone()

        if not row:
            await db.close()
            raise HTTPException(status_code=400, detail="No verified API key found. Please add your AI API key in Settings.")

        service = get_ai_service(row["provider"], row["api_key"])
        cursor = await db.execute(
            "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT 10",
            (req.conversation_id,)
        )
        history_rows = await cursor.fetchall()
        history = [{"role": r[0], "content": r[1]} for r in reversed(history_rows)]

        cursor = await db.execute(
            "SELECT key, value FROM memory WHERE user_id = ?",
            (req.user_id,)
        )
        memory_rows = await cursor.fetchall()
        memory = {r[0]: r[1] for r in memory_rows}

        response_text = await service.chat(
            message=req.message,
            history=history,
            memory=memory
        )

        await db.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
            (req.conversation_id, "user", req.message)
        )

        await db.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
            (req.conversation_id, "assistant", response_text)
        )

        await db.commit()
        await db.close()

        return {"response": response_text, "status": "success"}

    except HTTPException:
        await db.close()
        raise
    except Exception as e:
        await db.close()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{user_id}", response_model=list)
async def get_conversations(user_id: int):
    db = await get_db()
    cursor = await db.execute("""
        SELECT c.*, 
          (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as preview,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
        FROM conversations c 
        WHERE c.user_id = ? 
        ORDER BY c.updated_at DESC
    """, (user_id,))
    rows = await cursor.fetchall()
    await db.close()
    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "title": row["title"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "message_count": row["message_count"],
            "preview": (row["preview"] or "")[:80] + ("..." if row["preview"] and len(row["preview"]) > 80 else "")
        })
    return result

@router.get("/messages/{conversation_id}", response_model=list)
async def get_messages(conversation_id: int):
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, role, content, timestamp FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC",
        (conversation_id,)
    )
    rows = await cursor.fetchall()
    await db.close()
    return [{"id": r["id"], "role": r["role"], "content": r["content"], "timestamp": r["timestamp"]} for r in rows]

@router.post("/new", response_model=dict)
async def create_conversation(req: NewConversationRequest):
    db = await get_db()
    cursor = await db.execute(
        "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
        (req.user_id, req.title or "New Chat")
    )
    await db.commit()
    conv_id = cursor.lastrowid

    greeting = "Hello! Main SONIC AI hoon. Aaj aapko kya karna hai?"
    await db.execute(
        "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
        (conv_id, greeting)
    )
    await db.commit()

    cursor = await db.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
    conv = await cursor.fetchone()
    await db.close()
    return {"id": conv["id"], "title": conv["title"], "created_at": conv["created_at"], "updated_at": conv["updated_at"]}

@router.post("/ensure-voice-conversation", response_model=dict)
async def ensure_voice_conversation(data: dict):
    db = await get_db()
    user_id = data.get("user_id")
    if not user_id:
        await db.close()
        raise HTTPException(status_code=400, detail="user_id is required")

    cursor = await db.execute(
        "SELECT id FROM conversations WHERE user_id = ? AND title = 'Voice Conversations'",
        (user_id,)
    )
    row = await cursor.fetchone()
    if row:
        await db.close()
        return {"conversation_id": row["id"]}

    cursor = await db.execute(
        "INSERT INTO conversations (user_id, title) VALUES (?, 'Voice Conversations')",
        (user_id,)
    )
    await db.commit()
    conv_id = cursor.lastrowid
    await db.close()
    return {"conversation_id": conv_id}

@router.delete("/conversation/{conversation_id}", response_model=dict)
async def delete_conversation(conversation_id: int):
    db = await get_db()
    await db.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    await db.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    await db.commit()
    await db.close()
    return {"message": "Conversation deleted"}
