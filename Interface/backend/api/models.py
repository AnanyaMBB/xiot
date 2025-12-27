from django.db import models


class Baseboard(models.Model):
    """Represents a controller board (e.g., MKR-1000, Raspberry Pi)."""
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]

    name = models.CharField(max_length=100)
    identifier = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    mqtt_topic = models.CharField(max_length=200, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    uptime = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.identifier})"


class Sensor(models.Model):
    """Represents a sensor connected to a baseboard."""
    SENSOR_TYPES = [
        ('temperature', 'Temperature'),
        ('humidity', 'Humidity'),
        ('pressure', 'Pressure'),
        ('vibration', 'Vibration'),
        ('light', 'Light Level'),
        ('power', 'Power Meter'),
        ('gas', 'Gas Sensor'),
        ('motion', 'Motion'),
        ('custom', 'Custom'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
        ('offline', 'Offline'),
    ]

    baseboard = models.ForeignKey(Baseboard, on_delete=models.CASCADE, related_name='sensors')
    name = models.CharField(max_length=100)
    sensor_type = models.CharField(max_length=20, choices=SENSOR_TYPES)
    i2c_address = models.CharField(max_length=10, blank=True)
    adapter_id = models.CharField(max_length=20, blank=True)
    unit = models.CharField(max_length=20, blank=True)
    current_value = models.FloatField(null=True, blank=True)
    min_threshold = models.FloatField(null=True, blank=True)
    max_threshold = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    rate_of_change = models.CharField(max_length=20, blank=True)
    last_reading = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['baseboard', 'name']

    def __str__(self):
        return f"{self.name} ({self.sensor_type})"


class Actuator(models.Model):
    """Represents an actuator connected to a baseboard."""
    ACTUATOR_TYPES = [
        ('led', 'LED'),
        ('pwm', 'PWM'),
        ('relay', 'Relay'),
        ('servo', 'Servo'),
        ('motor', 'Motor'),
        ('linear', 'Linear Actuator'),
        ('solenoid', 'Solenoid'),
        ('buzzer', 'Buzzer'),
        ('display', 'Display'),
        ('custom', 'Custom'),
    ]

    STATUS_CHOICES = [
        ('on', 'On'),
        ('off', 'Off'),
        ('running', 'Running'),
        ('stopped', 'Stopped'),
        ('idle', 'Idle'),
        ('holding', 'Holding'),
        ('locked', 'Locked'),
        ('disconnected', 'Disconnected'),
        ('error', 'Error'),
    ]

    baseboard = models.ForeignKey(Baseboard, on_delete=models.CASCADE, related_name='actuators')
    name = models.CharField(max_length=100)
    actuator_type = models.CharField(max_length=20, choices=ACTUATOR_TYPES)
    actuator_id = models.CharField(max_length=20, blank=True)
    i2c_address = models.CharField(max_length=10, blank=True, help_text="I2C address in hex, e.g., 0x08")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='off')
    current_value = models.FloatField(null=True, blank=True)
    min_value = models.FloatField(default=0)
    max_value = models.FloatField(default=100)
    unit = models.CharField(max_length=20, blank=True)
    last_command = models.CharField(max_length=100, blank=True)
    last_command_time = models.DateTimeField(null=True, blank=True)
    last_command_latency = models.IntegerField(null=True, blank=True)  # in ms
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['baseboard', 'name']

    def __str__(self):
        return f"{self.name} ({self.actuator_type})"


class SensorReading(models.Model):
    """Stores historical sensor readings."""
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, related_name='readings')
    value = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['sensor', '-timestamp']),
        ]


class Event(models.Model):
    """Stores system events and logs."""
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]

    source = models.CharField(max_length=100)
    event_type = models.CharField(max_length=50)
    message = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    timestamp = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']
