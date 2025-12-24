"""
Django management command to run the MQTT subscriber service.

Usage:
    python manage.py mqtt_subscribe
"""

import signal
import sys

from django.core.management.base import BaseCommand
from api.mqtt_service import get_mqtt_service


class Command(BaseCommand):
    help = 'Starts the MQTT subscriber service for receiving sensor data'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting MQTT subscriber service...'))
        
        mqtt_service = get_mqtt_service()
        
        # Handle graceful shutdown
        def signal_handler(sig, frame):
            self.stdout.write(self.style.WARNING('\nShutting down MQTT service...'))
            mqtt_service.stop()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        try:
            mqtt_service.start()
        except KeyboardInterrupt:
            mqtt_service.stop()
            self.stdout.write(self.style.SUCCESS('MQTT service stopped'))

