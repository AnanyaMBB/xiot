from rest_framework import serializers
from .models import Baseboard, Sensor, Actuator, SensorReading, Event


class SensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sensor
        fields = '__all__'


class ActuatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actuator
        fields = '__all__'


class BaseboardSerializer(serializers.ModelSerializer):
    sensors = SensorSerializer(many=True, read_only=True)
    actuators = ActuatorSerializer(many=True, read_only=True)
    sensor_count = serializers.SerializerMethodField()
    actuator_count = serializers.SerializerMethodField()

    class Meta:
        model = Baseboard
        fields = '__all__'

    def get_sensor_count(self, obj):
        return obj.sensors.count()

    def get_actuator_count(self, obj):
        return obj.actuators.count()


class BaseboardListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    sensor_count = serializers.SerializerMethodField()
    actuator_count = serializers.SerializerMethodField()

    class Meta:
        model = Baseboard
        fields = ['id', 'name', 'identifier', 'status', 'last_seen', 'uptime', 'sensor_count', 'actuator_count']

    def get_sensor_count(self, obj):
        return obj.sensors.count()

    def get_actuator_count(self, obj):
        return obj.actuators.count()


class SensorReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorReading
        fields = ['id', 'value', 'timestamp']


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

