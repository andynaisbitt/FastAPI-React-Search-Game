"""
WebSocket Connection Manager
Manages WebSocket connections for real-time updates
"""
from typing import Dict, List, Set
from fastapi import WebSocket
import json
import asyncio


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""

    def __init__(self):
        # Store connections by short_code
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store connection metadata
        self.connection_metadata: Dict[WebSocket, Dict] = {}

    async def connect(self, websocket: WebSocket, short_code: str, user_id: str = None):
        """
        Accept a new WebSocket connection

        Args:
            websocket: FastAPI WebSocket instance
            short_code: URL short code to subscribe to
            user_id: Optional user identifier
        """
        await websocket.accept()

        # Add to connections for this short_code
        if short_code not in self.active_connections:
            self.active_connections[short_code] = set()

        self.active_connections[short_code].add(websocket)

        # Store metadata
        self.connection_metadata[websocket] = {
            'short_code': short_code,
            'user_id': user_id,
            'connected_at': asyncio.get_event_loop().time()
        }

        print(f"[WEBSOCKET] New connection for {short_code}. Total: {len(self.active_connections[short_code])}")

        # Send welcome message
        await self.send_personal_message({
            'type': 'connected',
            'message': f'Connected to {short_code} updates',
            'active_players': len(self.active_connections[short_code])
        }, websocket)

        # Broadcast updated player count
        await self.broadcast_to_room(short_code, {
            'type': 'player_count',
            'count': len(self.active_connections[short_code])
        })

    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection

        Args:
            websocket: FastAPI WebSocket instance
        """
        if websocket not in self.connection_metadata:
            return

        metadata = self.connection_metadata[websocket]
        short_code = metadata['short_code']

        # Remove from connections
        if short_code in self.active_connections:
            self.active_connections[short_code].discard(websocket)

            # Clean up empty sets
            if not self.active_connections[short_code]:
                del self.active_connections[short_code]

        # Remove metadata
        del self.connection_metadata[websocket]

        print(f"[WEBSOCKET] Disconnected from {short_code}. Remaining: {len(self.active_connections.get(short_code, []))}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """
        Send a message to a specific WebSocket

        Args:
            message: Message dictionary
            websocket: Target WebSocket
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"[WEBSOCKET] Error sending personal message: {str(e)}")
            self.disconnect(websocket)

    async def broadcast_to_room(self, short_code: str, message: dict):
        """
        Broadcast a message to all connections in a room

        Args:
            short_code: Room identifier (URL short code)
            message: Message dictionary to broadcast
        """
        if short_code not in self.active_connections:
            return

        # Create a copy to avoid modification during iteration
        connections = list(self.active_connections[short_code])

        # Send to all connections
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"[WEBSOCKET] Error broadcasting to connection: {str(e)}")
                self.disconnect(connection)

    async def broadcast_leaderboard_update(self, short_code: str, leaderboard_data: dict):
        """
        Broadcast leaderboard update to all connections watching this URL

        Args:
            short_code: URL short code
            leaderboard_data: Updated leaderboard data
        """
        await self.broadcast_to_room(short_code, {
            'type': 'leaderboard_update',
            'data': leaderboard_data
        })

    async def broadcast_new_score(self, short_code: str, score_entry: dict):
        """
        Broadcast a new score submission

        Args:
            short_code: URL short code
            score_entry: New leaderboard entry
        """
        await self.broadcast_to_room(short_code, {
            'type': 'new_score',
            'data': score_entry
        })

    async def broadcast_game_start(self, short_code: str, player_info: dict):
        """
        Broadcast when a new player starts the game

        Args:
            short_code: URL short code
            player_info: Player information
        """
        await self.broadcast_to_room(short_code, {
            'type': 'game_start',
            'data': player_info
        })

    async def broadcast_game_complete(self, short_code: str, result_info: dict):
        """
        Broadcast when a player completes the game

        Args:
            short_code: URL short code
            result_info: Completion information
        """
        await self.broadcast_to_room(short_code, {
            'type': 'game_complete',
            'data': result_info
        })

    def get_active_players(self, short_code: str) -> int:
        """
        Get number of active players for a URL

        Args:
            short_code: URL short code

        Returns:
            Number of active connections
        """
        return len(self.active_connections.get(short_code, set()))

    def get_all_rooms(self) -> List[str]:
        """
        Get all active room identifiers

        Returns:
            List of short codes with active connections
        """
        return list(self.active_connections.keys())


# Global connection manager instance
manager = ConnectionManager()
