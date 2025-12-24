"""
ASGI config for xiot project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
import threading

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xiot.settings')

# Initialize Django ASGI application early to ensure the app registry is populated
django_asgi_app = get_asgi_application()

# Import after Django is set up
from api.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    # Allow anonymous WebSocket connections (authentication handled separately)
    "websocket": URLRouter(
        websocket_urlpatterns
    ),
})

# Start MQTT subscriber in background thread (same process as Daphne)
# This ensures they share the same InMemoryChannelLayer
def start_mqtt_subscriber():
    from api.mqtt_service import get_mqtt_service
    import time
    
    # Wait for Daphne to fully start
    time.sleep(2)
    
    print("[ASGI] Starting MQTT subscriber in background thread...", flush=True)
    mqtt_service = get_mqtt_service()
    mqtt_service.start()

# Only start in main process (avoid starting in reloader subprocess)
if os.environ.get('RUN_MAIN') != 'true':
    mqtt_thread = threading.Thread(target=start_mqtt_subscriber, daemon=True)
    mqtt_thread.start()
