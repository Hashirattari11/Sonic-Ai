from fastapi import APIRouter
from ..services.gemini import SystemMonitor

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/stats")
async def get_system_stats():
    return SystemMonitor.get_stats()
