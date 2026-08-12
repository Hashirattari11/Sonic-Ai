from ..database.db import get_db

class MemoryService:
    @staticmethod
    async def save_memory(user_id: int, key: str, value: str):
        db = await get_db()
        cursor = await db.execute(
            "SELECT id FROM memory WHERE user_id = ? AND key = ?", (user_id, key)
        )
        existing = await cursor.fetchone()
        if existing:
            await db.execute(
                "UPDATE memory SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (value, existing["id"])
            )
        else:
            await db.execute(
                "INSERT INTO memory (user_id, key, value) VALUES (?, ?, ?)",
                (user_id, key, value)
            )
        await db.commit()
        await db.close()

    @staticmethod
    async def get_memory(user_id: int) -> dict:
        db = await get_db()
        cursor = await db.execute("SELECT key, value FROM memory WHERE user_id = ?", (user_id,))
        rows = await cursor.fetchall()
        await db.close()
        return {row["key"]: row["value"] for row in rows}

    @staticmethod
    async def update_memory_from_chat(user_id: int, message: str, response: str):
        facts = []
        msg_lower = message.lower()
        if "my name is" in msg_lower:
            name = msg_lower.split("my name is")[-1].strip().split()[0].strip(".,!?")
            facts.append(("user_name", name))
        if "i am" in msg_lower and len(msg_lower.split("i am")[-1].strip().split()) < 4:
            info = msg_lower.split("i am")[-1].strip().split()[0].strip(".,!?")
            facts.append(("user_identity", info))
        for fact in facts:
            await MemoryService.save_memory(user_id, fact[0], fact[1])
