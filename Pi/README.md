# XIOT Raspberry Pi Sensor Publisher

This directory contains the Raspberry Pi code for reading sensor data from ATtiny85 adapters and publishing to the XIOT interface via MQTT.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Mosquitto MQTT Broker

On Raspberry Pi:
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

For development on Windows/Mac, download from: https://mosquitto.org/download/

### 3. Configure the Publisher

Edit `mqtt_publisher.py` and update:

```python
# MQTT Broker settings
MQTT_BROKER = "localhost"  # Change to your broker IP if running elsewhere

# Baseboard identifier (unique per Pi)
BASEBOARD_ID = "PI-001"

# Sensor mappings: I2C address -> sensor configuration
SENSOR_MAPPINGS = {
    0x08: {
        "name": "Temperature Sensor",
        "type": "temperature",
        "unit": "°C",
        "conversion": lambda raw: (raw / 1023.0) * 3.3 * 100  # Adjust for your sensor
    },
}
```

### 4. Run the Publisher

```bash
python mqtt_publisher.py
```

## Files

| File | Description |
|------|-------------|
| `mqtt_publisher.py` | Main MQTT publisher - reads sensors and publishes data |
| `read_sensor.py` | Simple script to read sensor data (for testing) |
| `send_command.py` | Script to send commands to actuator adapters |
| `attiny_controller.py` | Full controller class for advanced usage |
| `test_i2c.py` | Basic I2C connection test |

## Adding Sensors

To add a new sensor, update `SENSOR_MAPPINGS` in `mqtt_publisher.py`:

```python
SENSOR_MAPPINGS = {
    0x08: {
        "name": "Temperature Sensor",
        "type": "temperature",
        "unit": "°C",
        "conversion": lambda raw: (raw / 1023.0) * 3.3 * 100
    },
    0x09: {
        "name": "Humidity Sensor",
        "type": "humidity", 
        "unit": "%",
        "conversion": lambda raw: (raw / 1023.0) * 100
    },
}
```

## Matching with Database

For sensors to appear in the interface, they must be registered in the Django backend database with matching:
- Baseboard `identifier` (e.g., "PI-001")
- Sensor `i2c_address` (e.g., "0x08")

Use the Django admin or API to create the baseboard and sensor records.

