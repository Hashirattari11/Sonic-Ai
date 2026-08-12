"""Create the right AI service based on the stored provider."""


def get_ai_service(provider: str, api_key: str):
    provider = (provider or "openrouter").lower()
    if provider == "gemini":
        from .gemini import GeminiService
        return GeminiService(api_key=api_key)
    if provider == "nvidia":
        from .nvidia import NVIDIAService
        return NVIDIAService(api_key=api_key)
    from .openrouter import OpenRouterService
    return OpenRouterService(api_key=api_key)


async def get_user_ai_service(db, user_id: int):
    """Look up the user's verified API key and return (service, provider)."""
    cursor = await db.execute(
        "SELECT provider, api_key FROM api_keys WHERE user_id = ? AND is_verified = 1 "
        "ORDER BY created_at DESC LIMIT 1",
        (user_id,)
    )
    row = await cursor.fetchone()
    if not row:
        return None, None
    service = get_ai_service(row["provider"], row["api_key"])
    return service, row["provider"]
