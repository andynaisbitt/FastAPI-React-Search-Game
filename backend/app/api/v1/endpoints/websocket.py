"""
WebSocket Endpoints
Real-time communication for live leaderboards and game updates
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.services.websocket_manager import manager
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.websocket("/ws/{short_code}")
async def websocket_endpoint(
    websocket: WebSocket,
    short_code: str,
    user_id: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time updates

    Clients connect to this endpoint to receive:
    - Leaderboard updates
    - Active player counts
    - New score notifications
    - Game completion notifications

    Args:
        short_code: URL short code to subscribe to
        user_id: Optional user identifier
    """
    await manager.connect(websocket, short_code, user_id)

    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_json()

            # Handle different message types
            message_type = data.get('type')

            if message_type == 'ping':
                # Respond to ping with pong
                await manager.send_personal_message({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }, websocket)

            elif message_type == 'request_leaderboard':
                # Send current leaderboard data
                # Note: This requires database access, so we'll need to handle it differently
                await manager.send_personal_message({
                    'type': 'info',
                    'message': 'Use REST API for leaderboard data. WebSocket is for live updates only.'
                }, websocket)

            elif message_type == 'game_started':
                # Broadcast that a new player started
                await manager.broadcast_game_start(short_code, {
                    'user_id': user_id or 'Anonymous',
                    'timestamp': data.get('timestamp')
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        # Broadcast updated player count
        await manager.broadcast_to_room(short_code, {
            'type': 'player_count',
            'count': manager.get_active_players(short_code)
        })
    except Exception as e:
        print(f"[WEBSOCKET] Error: {str(e)}")
        manager.disconnect(websocket)


@router.get("/ws/stats")
async def get_websocket_stats():
    """
    Get WebSocket connection statistics

    Returns:
        - active_rooms: List of short codes with active connections
        - total_connections: Total number of active WebSocket connections
        - room_details: Details about each active room
    """
    rooms = manager.get_all_rooms()
    total_connections = sum(manager.get_active_players(room) for room in rooms)

    room_details = [
        {
            'short_code': room,
            'active_players': manager.get_active_players(room)
        }
        for room in rooms
    ]

    return {
        'active_rooms': len(rooms),
        'total_connections': total_connections,
        'room_details': room_details
    }
