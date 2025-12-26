# XIOT Raspberry Pi

This directory contains all Raspberry Pi code for the XIOT system:
- Sensor data collection and MQTT publishing
- Multimedia streaming (video, audio bidirectional)
- LCD display control

## Quick Start

### 1. Install System Dependencies

```bash
sudo apt update
sudo apt install ffmpeg libcamera-apps python3-pip
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Unified Multimedia Server

```bash
python multimedia_server.py
```

This starts a single server that handles everything:
- **Video streaming** at `http://pi-ip:8080/video`
- **Audio from Pi** at `http://pi-ip:8080/audio`  
- **Audio to Pi** via WebSocket at `ws://pi-ip:8080/ws/audio`
- **LCD control** via MQTT topic `lcd/display`

## Alternative: Run Individual Services

If you prefer running services separately:

```bash
# Sensor data only
python mqtt_publisher.py

# Test I2C connection
python test_i2c.py
```

## Files

| File | Description |
|------|-------------|
| `multimedia_server.py` | **Unified server** - video, audio, LCD, all in one |
| `mqtt_publisher.py` | Sensor data MQTT publisher |
| `read_sensor.py` | Simple script to read sensor data (for testing) |
| `send_command.py` | Script to send commands to actuator adapters |
| `attiny_controller.py` | Full controller class for advanced usage |
| `test_i2c.py` | Basic I2C connection test |

## Configuration

Edit `multimedia_server.py` to configure:

```python
# Server port
HTTP_PORT = 8080

# MQTT broker
MQTT_BROKER = "aalsdb.kaist.ac.kr"
MQTT_PORT = 1883

# Microphone device (find with: arecord -l)
MIC_DEVICE = "plughw:3,0"

# LCD GPIO pins
RST_PIN = 22
DC_PIN = 25
BL_PIN = 24
```

## Endpoints

### Video Stream (MJPEG)
```
GET http://pi-ip:8080/video
```
Returns live camera feed in MJPEG format.

### Audio Stream (Pi to Interface)
```
GET http://pi-ip:8080/audio
```
Returns MP3 audio stream from Pi microphone.

### Audio Input (Interface to Pi)
```
WebSocket ws://pi-ip:8080/ws/audio
```
Send WebM audio blobs to play on Pi speaker.

### LCD Display Control
```
MQTT Topic: lcd/display
Payload: {"text": "Hello World", "color": "RED", "alarm": false}
```

Colors: WHITE, BLACK, RED, GREEN, BLUE, YELLOW, CYAN, MAGENTA

### Health Check
```
GET http://pi-ip:8080/health
```

## Sensor Configuration

Edit `mqtt_publisher.py` to configure sensors:

```python
SENSOR_MAPPINGS = {
    0x08: {
        "name": "Temperature Sensor",
        "type": "temperature",
        "unit": "°C",
        "conversion_factor": 0.489  # Raw to actual value
    },
    0x09: {
        "name": "Humidity Sensor",
        "type": "humidity", 
        "unit": "%",
        "conversion_factor": 0.1
    },
}
```

## Hardware Requirements

- Raspberry Pi 3/4/5
- Camera module (for video streaming)
- USB microphone (for audio out)
- USB speaker or 3.5mm audio (for audio in)
- 2-inch SPI LCD (optional, for display)
- I2C sensors via ATtiny85 adapters

## Troubleshooting

### No camera
```bash
# Check camera
libcamera-hello --list-cameras

# Test capture
libcamera-still -o test.jpg
```

### No microphone
```bash
# List audio devices
arecord -l

# Test recording
arecord -D plughw:3,0 -f cd test.wav
```

### I2C issues
```bash
# Scan I2C bus
i2cdetect -y 1
```

