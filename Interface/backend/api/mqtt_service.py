"""
MQTT Subscriber Service for XIOT

Connects to MQTT broker, receives sensor data from baseboards,
stores readings in database, and broadcasts to WebSocket clients.

Run with: python manage.py mqtt_subscribe
"""

import json
import time
import uuid
from datetime import datetime

import paho.mqtt.client as mqtt
from django.conf import settings
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Baseboard, Sensor, SensorReading, Event


class MQTTService:
    """
    MQTT service that subscribes to sensor data topics
    and broadcasts updates to WebSocket clients.
    """
    
    def __init__(self):
        self.broker = getattr(settings, 'MQTT_BROKER', 'localhost')
        self.port = getattr(settings, 'MQTT_PORT', 1883)
        self.username = getattr(settings, 'MQTT_USERNAME', None)
        self.password = getattr(settings, 'MQTT_PASSWORD', None)
        
        # Use unique client ID to avoid conflicts
        unique_id = f"xiot-backend-{uuid.uuid4().hex[:8]}"
        
        # Use MQTT v3.1.1 with clean session - required for stable connection
        self.client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
            client_id=unique_id,
            clean_session=True,
            protocol=mqtt.MQTTv311
        )
        print(f"[MQTT] Client ID: {unique_id}", flush=True)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        
        # Enable automatic reconnection
        self.client.reconnect_delay_set(min_delay=1, max_delay=30)
        
        if self.username and self.password:
            self.client.username_pw_set(self.username, self.password)
        
        self.channel_layer = get_channel_layer()
        self.connected = False
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to broker."""
        if rc == 0:
            print(f"[MQTT] Connected to broker at {self.broker}:{self.port}", flush=True)
            self.connected = True
            
            # Subscribe to all XIOT topics
            client.subscribe("xiot/+/sensors", qos=1)
            client.subscribe("xiot/+/status", qos=1)
            print("[MQTT] Subscribed to xiot/+/sensors and xiot/+/status", flush=True)
        else:
            error_messages = {
                1: "Incorrect protocol version",
                2: "Invalid client identifier", 
                3: "Server unavailable",
                4: "Bad username or password",
                5: "Not authorized"
            }
            msg = error_messages.get(rc, f"Unknown error {rc}")
            print(f"[MQTT] Connection failed: {msg}", flush=True)
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from broker."""
        self.connected = False
        if rc == 0:
            print("[MQTT] Disconnected cleanly", flush=True)
        else:
            print(f"[MQTT] Unexpected disconnect (rc={rc}), will reconnect...", flush=True)
    
    def _on_message(self, client, userdata, msg):
        """Callback when message received."""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            
            print(f"[MQTT] Message on {topic}", flush=True)
            
            # Determine message type from topic
            if "/sensors" in topic:
                self._handle_sensor_data(payload)
            elif "/status" in topic:
                self._handle_status_update(payload)
                
        except json.JSONDecodeError as e:
            print(f"[MQTT] JSON decode error: {e}", flush=True)
        except Exception as e:
            print(f"[MQTT] Error processing message: {e}", flush=True)
    
    def _handle_sensor_data(self, payload):
        """Process incoming sensor data."""
        baseboard_id = payload.get("baseboard_id")
        sensors_data = payload.get("sensors", [])
        
        print(f"[MQTT] Received sensor data from {baseboard_id}: {len(sensors_data)} sensors", flush=True)
        
        # Update database
        try:
            baseboard = Baseboard.objects.filter(identifier=baseboard_id).first()
            
            if baseboard:
                baseboard.last_seen = timezone.now()
                baseboard.status = 'online'
                baseboard.save(update_fields=['last_seen', 'status'])
                
                for sensor_data in sensors_data:
                    self._update_sensor(baseboard, sensor_data)
            else:
                print(f"[MQTT] Unknown baseboard: {baseboard_id}", flush=True)
                
        except Exception as e:
            print(f"[MQTT] Database error: {e}", flush=True)
        
        # Broadcast to WebSocket clients
        self._broadcast_sensor_update(payload)
    
    def _update_sensor(self, baseboard, sensor_data):
        """Update sensor in database and store reading."""
        i2c_address = sensor_data.get("i2c_address")
        value = sensor_data.get("value")
        status = sensor_data.get("status", "active")
        
        sensor = Sensor.objects.filter(
            baseboard=baseboard,
            i2c_address=i2c_address
        ).first()
        
        if sensor:
            if value is not None:
                sensor.current_value = value
                sensor.status = status
                sensor.last_reading = timezone.now()
                sensor.save(update_fields=['current_value', 'status', 'last_reading'])
                
                SensorReading.objects.create(
                    sensor=sensor,
                    value=value
                )
            else:
                sensor.status = 'offline'
                sensor.save(update_fields=['status'])
        else:
            print(f"[MQTT] Sensor {i2c_address} not found on baseboard {baseboard.identifier}", flush=True)
    
    def _handle_status_update(self, payload):
        """Process baseboard status update."""
        baseboard_id = payload.get("baseboard_id")
        status = payload.get("status")
        
        print(f"[MQTT] Status update from {baseboard_id}: {status}", flush=True)
        
        try:
            baseboard = Baseboard.objects.filter(identifier=baseboard_id).first()
            if baseboard:
                baseboard.status = status
                baseboard.last_seen = timezone.now()
                baseboard.save(update_fields=['status', 'last_seen'])
                
                Event.objects.create(
                    source=baseboard_id,
                    event_type='status_change',
                    message=f"Baseboard {baseboard_id} is now {status}",
                    severity='info' if status == 'online' else 'warning'
                )
        except Exception as e:
            print(f"[MQTT] Database error: {e}", flush=True)
        
        self._broadcast_status_update(payload)
    
    def _broadcast_sensor_update(self, data):
        """Broadcast sensor data to all connected WebSocket clients."""
        try:
            async_to_sync(self.channel_layer.group_send)(
                "sensor_updates",
                {
                    "type": "sensor_update",
                    "data": data
                }
            )
            print(f"[MQTT] Broadcast sent to WebSocket clients", flush=True)
        except Exception as e:
            print(f"[MQTT] WebSocket broadcast error: {e}", flush=True)
    
    def _broadcast_status_update(self, data):
        """Broadcast status update to all connected WebSocket clients."""
        try:
            async_to_sync(self.channel_layer.group_send)(
                "sensor_updates",
                {
                    "type": "baseboard_status",
                    "data": data
                }
            )
        except Exception as e:
            print(f"[MQTT] WebSocket broadcast error: {e}", flush=True)
    
    def connect(self):
        """Connect to MQTT broker."""
        try:
            self.client.connect(self.broker, self.port, keepalive=60)
            return True
        except Exception as e:
            print(f"[MQTT] Connection error: {e}", flush=True)
            return False
    
    def start(self):
        """Start the MQTT client loop."""
        print(f"[MQTT] Connecting to {self.broker}:{self.port}...", flush=True)
        if self.connect():
            print("[MQTT] Starting message loop...", flush=True)
            # loop_forever handles reconnection automatically
            self.client.loop_forever(retry_first_connection=True)
        else:
            print("[MQTT] Failed to connect!", flush=True)
    
    def stop(self):
        """Stop the MQTT client."""
        self.client.loop_stop()
        self.client.disconnect()


# Singleton instance
_mqtt_service = None


def get_mqtt_service():
    """Get or create the MQTT service instance."""
    global _mqtt_service
    if _mqtt_service is None:
        _mqtt_service = MQTTService()
    return _mqtt_service
