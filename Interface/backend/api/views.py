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
