from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Baseboard, Sensor, Actuator, Event
from .serializers import (
    BaseboardSerializer, BaseboardListSerializer,
    SensorSerializer, ActuatorSerializer, EventSerializer
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
