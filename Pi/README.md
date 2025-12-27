# Raspberry Pi Components

The Raspberry Pi serves as the central hub, running services for sensor data collection, multimedia streaming, and device control.

## Overview

Two main services run on the Pi:

| Service | Port | Description |
|---------|------|-------------|
| MQTT Publisher | N/A | Reads I2C sensors, publishes to MQTT |
| Multimedia Server | 8080 | Video, audio streaming, LCD control |

## Prerequisites

### System Packages

```bash
sudo apt update
sudo apt install -y python3-pip python3-venv i2c-tools ffmpeg
```

### Enable I2C

```bash
sudo raspi-config
# Interface Options → I2C → Enable
```

### Enable Camera

```bash
sudo raspi-config
# Interface Options → Camera → Enable
```

## Setup

### Create Virtual Environment

```bash
cd ~/xiot/Pi
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Requirements File

Create `Pi/requirements.txt`:

```
smbus2==0.4.3
paho-mqtt==1.6.1
aiohttp==3.9.1
Pillow==10.1.0
numpy==1.26.2
spidev==3.6
gpiozero==2.0
RPi.GPIO==0.7.1
```

---

## MQTT Publisher

### File: `mqtt_publisher.py`

Reads sensor data from ATtiny85 adapters via I2C and publishes to MQTT broker.

### Configuration

```python
# MQTT Broker settings
MQTT_BROKER = "aalsdb.kaist.ac.kr"
MQTT_PORT = 1883

# Baseboard identifier (unique per Pi)
BASEBOARD_ID = "PI-001"

# Sensor mappings: I2C address → configuration
SENSOR_MAPPINGS = {
    0x08: {
        "name": "Temperature Sensor",
        "type": "temperature",
        "unit": "°C",
        "conversion": lambda raw: (raw / 1023.0) * 3.3 * 100
    },
    # Add more sensors:
    # 0x09: {
    #     "name": "Humidity Sensor",
    #     "type": "humidity",
    #     "unit": "%",
    #     "conversion": lambda raw: (raw / 1023.0) * 100
    # },
}
```

### MQTT Topics

| Topic | Direction | QoS | Retain | Description |
|-------|-----------|-----|--------|-------------|
| `xiot/{BASEBOARD_ID}/sensors` | Publish | 0 | No | Sensor readings |
| `xiot/{BASEBOARD_ID}/status` | Publish | 1 | Yes | Online/offline status |

### Message Format

```json
{
    "baseboard_id": "PI-001",
    "sensors": [
        {
            "i2c_address": "0x08",
            "name": "Temperature Sensor",
            "type": "temperature",
            "raw_value": 848,
            "value": 273.87,
            "unit": "°C",
            "status": "active",
            "timestamp": "2025-12-24T12:00:00.000000Z"
        }
    ],
    "timestamp": "2025-12-24T12:00:00.000000Z"
}
```

### Running

```bash
source venv/bin/activate
python mqtt_publisher.py
```

### Output

```
==================================================
XIOT Sensor MQTT Publisher
Baseboard ID: PI-001
MQTT Broker: aalsdb.kaist.ac.kr:1883
Sensors configured: 1
==================================================
[MQTT] Connected to broker at aalsdb.kaist.ac.kr:1883
[INFO] Starting sensor readings (interval: 1.0s)
--------------------------------------------------
[0x08] Temperature Sensor: 273.87 °C
[MQTT] Published 1 sensor readings
--------------------------------------------------
```

### Running as Service

Create systemd service file:

```bash
sudo nano /etc/systemd/system/xiot-mqtt.service
```

```ini
[Unit]
Description=XIOT MQTT Publisher
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/xiot/Pi
ExecStart=/home/pi/xiot/Pi/venv/bin/python mqtt_publisher.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable xiot-mqtt
sudo systemctl start xiot-mqtt
```

---

## Multimedia Server

### File: `multimedia_server.py`

Unified HTTP/WebSocket server for video, audio, and LCD control.

### Features

| Feature | Protocol | Endpoint | Description |
|---------|----------|----------|-------------|
| Video | HTTP | `/video` | MJPEG stream from Pi camera |
| Audio (Pi→Interface) | HTTP | `/audio` | MP3 stream from microphone |
| Audio (Interface→Pi) | WebSocket | `/ws/audio` | WebM audio playback |
| LCD Control | MQTT | `lcd/display` | Text/color commands |
| Health Check | HTTP | `/health` | Server status |

### Configuration

```python
# Server port
HTTP_PORT = 8080

# MQTT
MQTT_BROKER = "aalsdb.kaist.ac.kr"
MQTT_PORT = 1883
MQTT_LCD_TOPIC = "lcd/display"

# Audio device (find with: arecord -l)
MIC_DEVICE = "plughw:3,0"

# LCD GPIO pins
RST_PIN = 22
DC_PIN = 25
BL_PIN = 24
```

### Video Streaming

Uses `libcamera-still` for capturing frames:

```bash
# Test camera
libcamera-still -o test.jpg

# Check available cameras
libcamera-hello --list-cameras
```

### Audio Input

Find your microphone device:

```bash
arecord -l
```

Update `MIC_DEVICE` in config:

```python
MIC_DEVICE = "plughw:3,0"  # Card 3, Device 0
```

### LCD Display

Supports 2-inch SPI LCD (ST7789 controller):

```
LCD                  Pi GPIO
─────────────────────────────
VCC  ───────────────► 3.3V
GND  ───────────────► GND
DIN  ───────────────► GPIO10 (MOSI)
CLK  ───────────────► GPIO11 (SCLK)
CS   ───────────────► GPIO8 (CE0)
DC   ───────────────► GPIO25
RST  ───────────────► GPIO22
BL   ───────────────► GPIO24
```

### LCD Command Format

```json
{
    "text": "Hello World",
    "color": "#ff0000",
    "blink": true
}
```

### Running

```bash
source venv/bin/activate
python multimedia_server.py
```

### Output

```
==================================================
XIOT Multimedia Server
Port: 8080
MQTT: aalsdb.kaist.ac.kr:1883
==================================================
[VIDEO] Starting camera stream
[AUDIO] Using device: plughw:3,0
[LCD] Display initialized
[MQTT] Connected, subscribing to lcd/display
[HTTP] Server running on port 8080
```

### Testing Endpoints

```bash
# Health check
curl http://192.168.137.110:8080/health

# Video (open in browser)
# http://192.168.137.110:8080/video

# Audio (open in browser)
# http://192.168.137.110:8080/audio

# LCD command via MQTT
mosquitto_pub -h aalsdb.kaist.ac.kr -t "lcd/display" -m '{"text":"Hello","color":"#00ff00"}'
```

### Running as Service

```bash
sudo nano /etc/systemd/system/xiot-multimedia.service
```

```ini
[Unit]
Description=XIOT Multimedia Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/xiot/Pi
ExecStart=/home/pi/xiot/Pi/venv/bin/python multimedia_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable xiot-multimedia
sudo systemctl start xiot-multimedia
```

---

## Troubleshooting

### I2C Issues

```bash
# Check I2C is enabled
ls /dev/i2c*

# Scan for devices
i2cdetect -y 1

# Read 2 bytes from address 0x08
i2cget -y 1 0x08 0 w
```

### Camera Issues

```bash
# Test camera
libcamera-hello

# Check camera is detected
vcgencmd get_camera

# Legacy camera (older Pi OS)
raspistill -o test.jpg
```

### Audio Issues

```bash
# List recording devices
arecord -l

# Test recording
arecord -D plughw:3,0 -f cd test.wav

# List playback devices
aplay -l

# Test playback
aplay test.wav
```

### LCD Issues

```bash
# Check SPI is enabled
ls /dev/spi*

# Enable SPI
sudo raspi-config
# Interface Options → SPI → Enable
```

### MQTT Issues

```bash
# Test broker connection
mosquitto_sub -h aalsdb.kaist.ac.kr -t "xiot/#" -v

# Publish test message
mosquitto_pub -h aalsdb.kaist.ac.kr -t "xiot/test" -m "hello"
```
