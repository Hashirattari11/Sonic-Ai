from fastapi import APIRouter
from ..services.memory import MemoryService
from ..models.schemas import MemoryItem

router = APIRouter(prefix="/memory", tags=["memory"])

@router.get("/{user_id}", response_model=dict)
async def get_memories(user_id: int):
    return await MemoryService.get_memory(user_id)

@router.post("/{user_id}", response_model=dict)
async def save_memory(user_id: int, item: MemoryItem):
    await MemoryService.save_memory(user_id, item.key, item.value)
    return {"message": "Memory saved", "key": item.key, "value": item.value}
