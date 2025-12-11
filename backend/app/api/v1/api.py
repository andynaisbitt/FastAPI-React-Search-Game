"""
API Router - Combines all endpoint routers
"""
from fastapi import APIRouter

from app.api.v1.endpoints import urls, game, analytics, websocket

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(urls.router, prefix="/urls", tags=["urls"])
api_router.include_router(game.router, prefix="/game", tags=["game"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(websocket.router, tags=["websocket"])
