from fastapi import APIRouter, HTTPException
from ..models.schemas import APIKeyRequest, APIKeyResponse
from ..database.db import get_db

router = APIRouter(prefix="/settings", tags=["settings"])


def mask_key(key: str) -> str:
    if len(key) <= 8:
        return key[:4] + "****"
    return key[:6] + "****" + key[-4:]


def get_service(provider: str, api_key: str):
    if provider == "gemini":
        from ..services.gemini import GeminiService
        return GeminiService(api_key=api_key), "Gemini"
    if provider == "nvidia":
        from ..services.nvidia import NVIDIAService
        return NVIDIAService(api_key=api_key), "NVIDIA"
    from ..services.openrouter import OpenRouterService
    return OpenRouterService(api_key=api_key), "OpenRouter"


@router.post("/api-key", response_model=dict)
async def save_api_key(req: APIKeyRequest):
    db = await get_db()
    provider = (req.provider or "openrouter").lower()

    try:
        service, display = get_service(provider, req.api_key)
        is_verified = await service.verify_key()

        if is_verified:
            cursor = await db.execute(
                "SELECT id FROM api_keys WHERE user_id = ? AND provider = ?",
                (req.user_id, provider)
            )
            existing = await cursor.fetchone()

            if existing:
                await db.execute(
                    "UPDATE api_keys SET api_key = ?, is_verified = 1 WHERE id = ?",
                    (req.api_key, existing["id"])
                )
            else:
                await db.execute(
                    "INSERT INTO api_keys (user_id, provider, api_key, is_verified) VALUES (?, ?, ?, 1)",
                    (req.user_id, provider, req.api_key)
                )
            await db.commit()
            await db.close()
            return {"status": "verified", "message": f"{display} API connected successfully"}

        await db.close()
        return {"status": "invalid", "message": "Invalid API key. Please check and try again."}

    except Exception as e:
        error_str = str(e)
        if "429" in error_str:
            cursor = await db.execute(
                "SELECT id FROM api_keys WHERE user_id = ? AND provider = ?",
                (req.user_id, provider)
            )
            existing = await cursor.fetchone()
            if existing:
                await db.execute(
                    "UPDATE api_keys SET api_key = ?, is_verified = 1 WHERE id = ?",
                    (req.api_key, existing["id"])
                )
            else:
                await db.execute(
                    "INSERT INTO api_keys (user_id, provider, api_key, is_verified) VALUES (?, ?, ?, 1)",
                    (req.user_id, provider, req.api_key)
                )
            await db.commit()
            await db.close()
            return {"status": "verified", "message": f"{display} API connected successfully"}
        await db.close()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api-key/{user_id}", response_model=APIKeyResponse)
async def get_api_key(user_id: int, provider: str = None):
    db = await get_db()
    if provider:
        cursor = await db.execute(
            "SELECT * FROM api_keys WHERE user_id = ? AND provider = ? ORDER BY created_at DESC LIMIT 1",
            (user_id, provider)
        )
    else:
        cursor = await db.execute(
            "SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        )
    record = await cursor.fetchone()
    await db.close()

    if not record:
        raise HTTPException(status_code=404, detail="No API key found")

    return APIKeyResponse(
        id=record["id"],
        provider=record["provider"],
        masked_key=mask_key(record["api_key"]),
        is_verified=bool(record["is_verified"]),
        created_at=record["created_at"]
    )
