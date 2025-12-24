"""
WebSocket consumers for real-time sensor data.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class SensorDataConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time sensor data streaming.
    
    Clients connect to receive live sensor updates pushed from MQTT.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        # Join the sensor data broadcast group
        self.group_name = "sensor_updates"
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial connection confirmation
        await self.send(text_data=json.dumps({
            "type": "connection_established",
            "message": "Connected to XIOT sensor stream"
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle messages from WebSocket client."""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            
            if message_type == "ping":
                await self.send(text_data=json.dumps({
                    "type": "pong",
                    "timestamp": timezone.now().isoformat()
                }))
            
            elif message_type == "subscribe":
                # Client can subscribe to specific baseboards or sensors
                # For now, all clients receive all updates
                pass
                
        except json.JSONDecodeError:
            pass
    
    async def sensor_update(self, event):
        """
        Handle sensor update messages from the channel layer.
        
        This is called when the MQTT service broadcasts sensor data.
        """
        await self.send(text_data=json.dumps({
            "type": "sensor_update",
            "data": event["data"]
        }))
    
    async def baseboard_status(self, event):
        """Handle baseboard status updates."""
        await self.send(text_data=json.dumps({
            "type": "baseboard_status",
            "data": event["data"]
        }))

