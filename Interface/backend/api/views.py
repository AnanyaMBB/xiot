import json
from datetime import timedelta
import paho.mqtt.publish as mqtt_publish
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Baseboard, Sensor, Actuator, Event
from .serializers import (
    BaseboardSerializer, BaseboardListSerializer,
    SensorSerializer, SensorReadingSerializer, ActuatorSerializer, EventSerializer
)


class BaseboardViewSet(viewsets.ModelViewSet):
    """ViewSet for managing baseboards."""
    queryset = Baseboard.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return BaseboardListSerializer
        return BaseboardSerializer


class SensorViewSet(viewsets.ModelViewSet):
    """ViewSet for managing sensors."""
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Sensor.objects.all()
        baseboard_id = self.request.query_params.get('baseboard', None)
        if baseboard_id:
            queryset = queryset.filter(baseboard_id=baseboard_id)
        return queryset

    @action(detail=True, methods=['get'])
    def readings(self, request, pk=None):
        """Get historical readings for a sensor."""
        sensor = self.get_object()
        
        # Time range filter
        time_range = request.query_params.get('range', '24h')
        now = timezone.now()
        
        if time_range == '1h':
            start_time = now - timedelta(hours=1)
        elif time_range == '6h':
            start_time = now - timedelta(hours=6)
        elif time_range == '24h':
            start_time = now - timedelta(hours=24)
        elif time_range == '7d':
            start_time = now - timedelta(days=7)
        elif time_range == '30d':
            start_time = now - timedelta(days=30)
        else:
            start_time = now - timedelta(hours=24)
        
        readings = sensor.readings.filter(timestamp__gte=start_time).order_by('timestamp')
        
        # Limit to 500 data points for performance
        total = readings.count()
        if total > 500:
            step = total // 500
            readings = readings[::step][:500]
        
        serializer = SensorReadingSerializer(readings, many=True)
        
        # Calculate statistics
        values = [r.value for r in readings]
        stats = {
            'count': len(values),
            'min': min(values) if values else None,
            'max': max(values) if values else None,
            'avg': sum(values) / len(values) if values else None,
            'current': sensor.current_value,
        }
        
        return Response({
            'sensor': {
                'id': sensor.id,
                'name': sensor.name,
                'type': sensor.sensor_type,
                'unit': sensor.unit,
                'status': sensor.status,
            },
            'readings': serializer.data,
            'statistics': stats,
            'time_range': time_range,
        })


class ActuatorViewSet(viewsets.ModelViewSet):
    """ViewSet for managing actuators."""
    queryset = Actuator.objects.all()
    serializer_class = ActuatorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Actuator.objects.all()
        baseboard_id = self.request.query_params.get('baseboard', None)
        if baseboard_id:
            queryset = queryset.filter(baseboard_id=baseboard_id)
        return queryset

    @action(detail=True, methods=['post'])
    def command(self, request, pk=None):
        """Send a command to the actuator via MQTT."""
        actuator = self.get_object()
        
        command = request.data.get('command')  # on, off, toggle, set
        value = request.data.get('value')  # For PWM/servo: 0-100 or angle
        
        if not command:
            return Response(
                {'error': 'Command is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_commands = ['on', 'off', 'toggle', 'set']
        if command not in valid_commands:
            return Response(
                {'error': f'Invalid command. Valid commands: {valid_commands}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build MQTT payload
        payload = {
            'actuator_id': actuator.actuator_id or str(actuator.id),
            'i2c_address': actuator.i2c_address,
            'actuator_type': actuator.actuator_type,
            'command': command,
            'value': value,
            'timestamp': timezone.now().isoformat()
        }
        
        try:
            mqtt_broker = getattr(settings, 'MQTT_BROKER', 'localhost')
            mqtt_port = getattr(settings, 'MQTT_PORT', 1883)
            
            # Publish to baseboard-specific topic
            topic = f"xiot/{actuator.baseboard.identifier}/actuators"
            
            mqtt_publish.single(
                topic=topic,
                payload=json.dumps(payload),
                hostname=mqtt_broker,
                port=mqtt_port
            )
            
            # Update actuator state
            if command in ['on', 'off']:
                actuator.status = command
            elif command == 'toggle':
                actuator.status = 'off' if actuator.status == 'on' else 'on'
            elif command == 'set' and value is not None:
                actuator.current_value = value
                actuator.status = 'running' if value > 0 else 'off'
            
            actuator.last_command = f"{command}" + (f":{value}" if value is not None else "")
            actuator.last_command_time = timezone.now()
            actuator.save()
            
            # Log the event
            Event.objects.create(
                source=f'actuator:{actuator.name}',
                event_type='actuator_command',
                message=f"Command '{command}' sent to {actuator.name}",
                severity='info'
            )
            
            return Response({
                'status': 'sent',
                'actuator': ActuatorSerializer(actuator).data,
                'command': command,
                'value': value
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SystemStatusView(APIView):
    """Get overall system status."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        baseboards = Baseboard.objects.all()
        sensors = Sensor.objects.all()
        actuators = Actuator.objects.all()

        online_boards = baseboards.filter(status='online').count()
        active_sensors = sensors.filter(status='active').count()
        warning_sensors = sensors.filter(status='warning').count()
        critical_sensors = sensors.filter(status='critical').count()

        return Response({
            'mqtt_status': 'connected',
            'mqtt_latency': 12,
            'i2c_bus': {
                'speed': '400kHz',
                'status': 'stable',
                'load': 35,
            },
            'baseboards': {
                'total': baseboards.count(),
                'online': online_boards,
            },
            'sensors': {
                'total': sensors.count(),
                'active': active_sensors,
                'warning': warning_sensors,
                'critical': critical_sensors,
            },
            'actuators': {
                'total': actuators.count(),
                'available': actuators.count(),
            },
            'gateway': 'online',
            'database': 'connected',
        })


class LCDCommandView(APIView):
    """Send commands to LCD display via MQTT."""
    permission_classes = [AllowAny]  # Allow unauthenticated for now

    def post(self, request):
        text = request.data.get('text', '')
        color = request.data.get('color', 'WHITE')
        alarm = request.data.get('alarm', False)

        if not text:
            return Response(
                {'error': 'Text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Valid colors
        valid_colors = ['WHITE', 'BLACK', 'RED', 'GREEN', 'BLUE', 'YELLOW', 'CYAN', 'MAGENTA']
        if color.upper() not in valid_colors:
            color = 'WHITE'

        payload = json.dumps({
            'text': text,
            'color': color.upper(),
            'alarm': bool(alarm)
        })

        try:
            mqtt_broker = getattr(settings, 'MQTT_BROKER', 'localhost')
            mqtt_port = getattr(settings, 'MQTT_PORT', 1883)
            
            mqtt_publish.single(
                topic='lcd/display',
                payload=payload,
                hostname=mqtt_broker,
                port=mqtt_port
            )

            # Log the event
            Event.objects.create(
                source='interface',
                event_type='lcd_command',
                message=f"LCD: {text[:50]}{'...' if len(text) > 50 else ''}",
                severity='info'
            )

            return Response({
                'status': 'sent',
                'text': text,
                'color': color.upper(),
                'alarm': alarm
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeviceRegistrationView(APIView):
    """
    Auto-discovery endpoint for registering devices from Pi.
    
    Accepts device info from the Pi's discovery script and creates/updates
    the corresponding Sensor or Actuator in the database.
    """
    permission_classes = [AllowAny]  # Pi doesn't have auth token

    # Sensor type mappings (from discovery protocol to model choices)
    SENSOR_TYPE_MAP = {
        'temperature': 'temperature',
        'humidity': 'humidity',
        'pressure': 'pressure',
        'light': 'light',
        'motion': 'motion',
        'gas': 'gas',
        'vibration': 'vibration',
        'custom': 'custom',
    }

    # Actuator type mappings
    ACTUATOR_TYPE_MAP = {
        'led': 'led',
        'relay': 'relay',
        'servo': 'servo',
        'motor': 'motor',
        'buzzer': 'buzzer',
        'pwm': 'pwm',
        'custom': 'custom',
    }

    def post(self, request):
        """Register a discovered device."""
        baseboard_id = request.data.get('baseboard_id')
        i2c_address = request.data.get('i2c_address')
        device_class = request.data.get('device_class')  # 'sensor' or 'actuator'
        device_type = request.data.get('device_type')    # subtype name
        capabilities = request.data.get('capabilities', [])

        # Validate required fields
        if not all([baseboard_id, i2c_address, device_class, device_type]):
            return Response(
                {'error': 'Missing required fields: baseboard_id, i2c_address, device_class, device_type'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find or create baseboard
        baseboard, board_created = Baseboard.objects.get_or_create(
            identifier=baseboard_id,
            defaults={
                'name': f'Baseboard {baseboard_id}',
                'description': f'Auto-discovered baseboard',
                'status': 'online',
                'mqtt_topic': f'xiot/{baseboard_id}/sensors',
            }
        )

        if board_created:
            Event.objects.create(
                source='discovery',
                event_type='baseboard_discovered',
                message=f"New baseboard discovered: {baseboard_id}",
                severity='info'
            )

        # Create or update device based on class
        if device_class == 'sensor':
            return self._register_sensor(baseboard, i2c_address, device_type, capabilities)
        elif device_class == 'actuator':
            return self._register_actuator(baseboard, i2c_address, device_type, capabilities)
        else:
            return Response(
                {'error': f"Unknown device class: {device_class}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _register_sensor(self, baseboard, i2c_address, device_type, capabilities):
        """Register or update a sensor."""
        sensor_type = self.SENSOR_TYPE_MAP.get(device_type, 'custom')
        
        # Generate a name from type and address
        name = f"{device_type.replace('_', ' ').title()} ({i2c_address})"
        
        # Determine unit based on sensor type
        unit_map = {
            'temperature': '°C',
            'humidity': '%',
            'pressure': 'hPa',
            'light': 'lux',
            'gas': 'ppm',
            'vibration': 'g',
        }
        unit = unit_map.get(sensor_type, '')

        sensor, created = Sensor.objects.update_or_create(
            baseboard=baseboard,
            i2c_address=i2c_address,
            defaults={
                'name': name,
                'sensor_type': sensor_type,
                'unit': unit,
                'status': 'active',
            }
        )

        if created:
            Event.objects.create(
                source='discovery',
                event_type='sensor_discovered',
                message=f"New sensor discovered: {name} at {i2c_address}",
                severity='info'
            )

        return Response({
            'created': created,
            'device_class': 'sensor',
            'id': sensor.id,
            'name': sensor.name,
            'type': sensor.sensor_type,
            'i2c_address': sensor.i2c_address,
            'baseboard': baseboard.identifier,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def _register_actuator(self, baseboard, i2c_address, device_type, capabilities):
        """Register or update an actuator."""
        actuator_type = self.ACTUATOR_TYPE_MAP.get(device_type, 'custom')
        
        # Generate a name from type and address
        name = f"{device_type.replace('_', ' ').title()} ({i2c_address})"
        
        # Determine min/max values based on actuator type
        if actuator_type in ['pwm', 'servo']:
            min_val, max_val = 0, 255
            unit = ''
        elif actuator_type == 'motor':
            min_val, max_val = -100, 100
            unit = '%'
        else:
            min_val, max_val = 0, 1
            unit = ''

        actuator, created = Actuator.objects.update_or_create(
            baseboard=baseboard,
            i2c_address=i2c_address,
            defaults={
                'name': name,
                'actuator_type': actuator_type,
                'status': 'off',
                'min_value': min_val,
                'max_value': max_val,
                'unit': unit,
            }
        )

        if created:
            Event.objects.create(
                source='discovery',
                event_type='actuator_discovered',
                message=f"New actuator discovered: {name} at {i2c_address}",
                severity='info'
            )

        return Response({
            'created': created,
            'device_class': 'actuator',
            'id': actuator.id,
            'name': actuator.name,
            'type': actuator.actuator_type,
            'i2c_address': actuator.i2c_address,
            'baseboard': baseboard.identifier,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class TriggerDiscoveryView(APIView):
    """
    Trigger device discovery on a baseboard via MQTT.
    
    Sends an MQTT message to the Pi to run the discovery script.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        baseboard_id = request.data.get('baseboard_id', 'PI-001')
        
        payload = {
            'action': 'scan',
            'timestamp': timezone.now().isoformat()
        }
        
        topic = f"xiot/{baseboard_id}/discover"
        
        try:
            mqtt_broker = getattr(settings, 'MQTT_BROKER', 'localhost')
            mqtt_port = getattr(settings, 'MQTT_PORT', 1883)
            
            mqtt_publish.single(
                topic=topic,
                payload=json.dumps(payload),
                hostname=mqtt_broker,
                port=mqtt_port
            )
            
            Event.objects.create(
                source='interface',
                event_type='discovery_triggered',
                message=f"Device discovery triggered for {baseboard_id}",
                severity='info'
            )
            
            return Response({
                'status': 'triggered',
                'baseboard_id': baseboard_id,
                'message': 'Discovery scan initiated. New devices will appear shortly.'
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
