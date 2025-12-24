"""
Script to create initial database entries for XIOT.
Run with: python manage.py shell < setup_initial_data.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xiot.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Baseboard, Sensor

# Create admin user if not exists
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@xiot.local', 'admin123')
    print("Created admin user (username: admin, password: admin123)")
else:
    print("Admin user already exists")

# Create Baseboard
baseboard, created = Baseboard.objects.get_or_create(
    identifier='PI-001',
    defaults={
        'name': 'Raspberry Pi 1',
        'description': 'Main sensor baseboard',
        'status': 'online',
        'mqtt_topic': 'xiot/PI-001/sensors',
    }
)
if created:
    print(f"Created baseboard: {baseboard.name} ({baseboard.identifier})")
else:
    print(f"Baseboard already exists: {baseboard.name}")

# Create Temperature Sensor
sensor, created = Sensor.objects.get_or_create(
    baseboard=baseboard,
    i2c_address='0x08',
    defaults={
        'name': 'Temperature Sensor',
        'sensor_type': 'temperature',
        'unit': '°C',
        'status': 'active',
        'min_threshold': 15.0,
        'max_threshold': 35.0,
    }
)
if created:
    print(f"Created sensor: {sensor.name} at {sensor.i2c_address}")
else:
    print(f"Sensor already exists: {sensor.name}")

print("\n[OK] Initial data setup complete!")
print("\nDatabase contents:")
print(f"  - Baseboards: {Baseboard.objects.count()}")
print(f"  - Sensors: {Sensor.objects.count()}")

