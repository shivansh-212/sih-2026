"""
WebSocket endpoint and connection manager for SmartLens real-time telemetry and activity feed.
"""

import json
from typing import Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts events."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict[str, Any]):
        """Broadcast a JSON message to all connected clients."""
        disconnected = []
        payload = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

    async def send_personal(self, message: dict[str, Any], websocket: WebSocket):
        await websocket.send_text(json.dumps(message))


manager = ConnectionManager()


@router.websocket("/ws")
@router.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time map updates, worker GPS tracking,
    live activity feed, and instant verification notifications.
    """
    await manager.connect(websocket)
    # Send initial welcome and connection status
    await manager.send_personal(
        {
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to SmartLens GIS Real-time Engine",
            "active_clients": len(manager.active_connections),
        },
        websocket,
    )
    try:
        while True:
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                msg_type = parsed.get("type", "MESSAGE")

                if msg_type == "PING":
                    await manager.send_personal({"type": "PONG"}, websocket)

                elif msg_type == "WORKER_LOCATION_UPDATE":
                    # Broadcast worker GPS movement to all command centers
                    await manager.broadcast({
                        "type": "WORKER_LOCATION_UPDATE",
                        "worker_id": parsed.get("worker_id", "Alex"),
                        "worker_name": parsed.get("worker_name", "Alex (Field Worker)"),
                        "lat": parsed.get("lat"),
                        "lng": parsed.get("lng"),
                        "accuracy": parsed.get("accuracy", 3.2),
                        "timestamp": parsed.get("timestamp"),
                    })

                elif msg_type == "CHAT" or msg_type == "BROADCAST":
                    await manager.broadcast(parsed)

                else:
                    # Echo or broadcast general events
                    await manager.broadcast(parsed)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
