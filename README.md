# XIOT - Extensible IoT Platform

A comprehensive IoT platform for sensor data collection, actuator control, and real-time monitoring with video/audio streaming capabilities.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Hardware Setup](#hardware-setup)
- [Software Components](#software-components)
  - [Adapter (ATtiny85)](#adapter-attiny85)
  - [Raspberry Pi](#raspberry-pi)
  - [Backend (Django)](#backend-django)
  - [Frontend (React)](#frontend-react)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## System Overview

XIOT is a modular IoT platform that enables:

- **Sensor Data Collection**: Read analog/digital sensors via ATtiny85 adapter boards
- **Actuator Control**: Control LEDs, relays, motors via I2C commands
- **Real-time Monitoring**: WebSocket-based live data streaming to web interface
- **Video Streaming**: MJPEG video from Raspberry Pi camera
- **Bidirectional Audio**: Push-to-talk and live audio streaming
- **LCD Display Control**: Send text/color commands to physical LCD
- **Historical Data Analysis**: Time-series charts and statistics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              XIOT ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     I2C      ┌──────────────────────────────────────────┐ │
│  │   ATtiny85   │◄────────────►│              RASPBERRY PI                │ │
│  │   Adapter    │              │                                          │ │
│  │              │              │  ┌─────────────────┐  ┌───────────────┐  │ │
│  │  • Sensor    │              │  │  MQTT Publisher │  │  Multimedia   │  │ │
│  │  • Actuator  │              │  │                 │  │    Server     │  │ │
│  └──────────────┘              │  │  • Sensor data  │  │               │  │ │
│         │                      │  │  • Status       │  │  • Video      │  │ │
│     ┌───┴───┐                  │  └────────┬────────┘  │  • Audio      │  │ │
│     │Sensor │                  │           │           │  • LCD ctrl   │  │ │
│     │(Analog)                  │           │           └───────┬───────┘  │ │
│     └───────┘                  └───────────┼───────────────────┼──────────┘ │
│                                            │                   │            │
│                                         MQTT                HTTP/WS         │
│                                            │                   │            │
│                                            ▼                   │            │
│  ┌─────────────────────────────────────────────────────────────┼──────────┐ │
│  │                      DJANGO BACKEND                         │          │ │
│  │                                                             │          │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │          │ │
│  │  │ MQTT Subscriber│  │  Django REST   │  │   WebSocket   │ │          │ │
│  │  │                │  │      API       │  │   Channels    │ │          │ │
│  │  │  • Receive     │  │                │  │               │ │          │ │
│  │  │    sensor data │  │  • Baseboards  │  │  • Real-time  │ │          │ │
│  │  │  • Update DB   │  │  • Sensors     │  │    updates    │ │          │ │
│  │  │  • Broadcast   │  │  • Actuators   │  │  • Broadcast  │ │          │ │
│  │  └────────────────┘  └────────────────┘  └───────────────┘ │          │ │
│  │                              │                              │          │ │
│  └──────────────────────────────┼──────────────────────────────┼──────────┘ │
│                                 │                              │            │
│                            REST API                         WebSocket       │
│                                 │                              │            │
│                                 ▼                              ▼            │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         REACT FRONTEND                                  ││
│  │                                                                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐ ││
│  │  │  Dashboard  │  │   Devices   │  │ Data Analysis│  │   Actuator    │ ││
│  │  │             │  │  Management │  │              │  │   Control     │ ││
│  │  │ • Live data │  │             │  │ • Charts     │  │               │ ││
│  │  │ • Video     │  │ • CRUD ops  │  │ • Statistics │  │ • Send cmds   │ ││
│  │  │ • Audio     │  │ • Sensors   │  │ • History    │  │ • Monitor     │ ││
│  │  │ • LCD ctrl  │  │ • Actuators │  │              │  │               │ ││
│  │  └─────────────┘  └─────────────┘  └──────────────┘  └───────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hardware Setup

### Components Required

| Component | Quantity | Purpose |
|-----------|----------|---------|
| Raspberry Pi (3/4/5) | 1 | Main controller, runs backend services |
| ATtiny85 | 1+ | I2C sensor/actuator adapters |
| 74HC595 Shift Register | 1+ | Mux/configuration control |
| 74HC4052 Mux | 1+ | Signal routing |
| Sensors (analog) | 1+ | Temperature, humidity, etc. |
| USB Microphone | 1 | Audio input |
| Speaker | 1 | Audio output |
| Pi Camera | 1 | Video streaming |
| 2-inch SPI LCD | 1 | Display messages (optional) |

### Wiring Diagram

```
                    RASPBERRY PI                         ATtiny85 ADAPTER
                    ─────────────                        ─────────────────
                    
     3.3V ─────────────────────────────────────────────► VCC
     GND  ─────────────────────────────────────────────► GND
     
     GPIO2 (SDA) ─────────────────────────────────────► PB0 (SDA) ─────┐
                                                                       │
     GPIO3 (SCL) ─────────────────────────────────────► PB2 (SCL)      │
                                                                       │
                                                                       │
                                                           ┌───────────┴───────────┐
                                                           │      ATtiny85         │
                         4.7kΩ                             │                       │
     3.3V ────────────────┬───────────────────────────────►│ VCC                   │
                          │                                │                       │
                          ├──────────────────► SDA         │ PB0 ◄──── I2C SDA     │
                          │                                │                       │
                          └──────────────────► SCL         │ PB2 ◄──── I2C SCL     │
                        4.7kΩ                              │                       │
                                                           │ PB1 ────► Shift Latch │
                                                           │                       │
                                                           │ PB3 ────► LED/Actuator│
                                                           │                       │
                                                           │ PB4 ◄──── Sensor In   │
                                                           └───────────────────────┘

                    IMPORTANT: 
                    • ATtiny85 MUST run at 3.3V when connected to Pi
                    • Add 4.7kΩ pull-up resistors on SDA and SCL lines
                    • Never connect 5V logic directly to Pi GPIO
```

### I2C Connection Details

| Signal | Pi GPIO | ATtiny85 Pin | Notes |
|--------|---------|--------------|-------|
| SDA | GPIO2 | PB0 | Data line, 4.7kΩ pull-up to 3.3V |
| SCL | GPIO3 | PB2 | Clock line, 4.7kΩ pull-up to 3.3V |
| VCC | 3.3V | VCC | Power supply |
| GND | GND | GND | Common ground |

### LCD Display Connections (Optional)

| LCD Pin | Pi GPIO | Description |
|---------|---------|-------------|
| RST | GPIO22 | Reset |
| DC | GPIO25 | Data/Command |
| BL | GPIO24 | Backlight (PWM) |
| MOSI | GPIO10 | SPI Data |
| SCLK | GPIO11 | SPI Clock |
| CS | GPIO8 | Chip Select |

---

## Software Components

### Adapter (ATtiny85)

The ATtiny85 microcontrollers serve as modular adapter boards that interface sensors and actuators with the Raspberry Pi via I2C.

#### Sensor Adapter (`adapter/attiny85_sensor.ino`)

Reads analog sensor data and sends it to the Pi on request.

**Features:**
- I2C slave mode (default address: 0x08)
- 10-bit ADC resolution
- 5-sample averaging for stability
- Shift register configuration for mux control

**Pinout:**
| Pin | Function |
|-----|----------|
| PB0 | I2C SDA |
| PB1 | Shift Register Latch |
| PB2 | I2C SCL |
| PB3 | (Unused) |
| PB4 | Analog Input (A2) |

**Programming:**
```bash
# Using Arduino IDE with ATtiny85 board support
# Board: ATtiny85
# Clock: 8MHz Internal
# Programmer: USBasp or Arduino as ISP
```

#### Actuator Adapter (`adapter/attiny85_actuator.ino`)

Receives commands from Pi and controls output pins.

**Commands:**
| Value | Action |
|-------|--------|
| 0x00 | Turn OFF |
| 0x01 | Turn ON |
| 0x02 | Toggle |

**Pinout:**
| Pin | Function |
|-----|----------|
| PB0 | I2C SDA |
| PB1 | Shift Register Latch |
| PB2 | I2C SCL |
| PB3 | Output (LED/Relay) |
| PB4 | (Unused) |

---

### Raspberry Pi

The Raspberry Pi runs two main services:

#### 1. MQTT Publisher (`Pi/mqtt_publisher.py`)

Reads sensor data via I2C and publishes to MQTT broker.

**Configuration:**
```python
MQTT_BROKER = "aalsdb.kaist.ac.kr"
MQTT_PORT = 1883
BASEBOARD_ID = "PI-001"

SENSOR_MAPPINGS = {
    0x08: {
        "name": "Temperature Sensor",
        "type": "temperature",
        "unit": "°C",
        "conversion": lambda raw: (raw / 1023.0) * 3.3 * 100
    },
}
```

**MQTT Topics:**
| Topic | Direction | Description |
|-------|-----------|-------------|
| `xiot/{BASEBOARD_ID}/sensors` | Publish | Sensor readings (JSON) |
| `xiot/{BASEBOARD_ID}/status` | Publish | Online/offline status |

**Running:**
```bash
cd Pi
source venv/bin/activate
pip install smbus2 paho-mqtt
python mqtt_publisher.py
```

#### 2. Multimedia Server (`Pi/multimedia_server.py`)

Unified HTTP/WebSocket server for video, audio, and LCD control.

**Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/video` | GET | MJPEG video stream |
| `/audio` | GET | MP3 audio stream from Pi |
| `/ws/audio` | WebSocket | Audio from interface to Pi |
| `/health` | GET | Server health check |

**LCD MQTT Commands:**
```json
// Topic: lcd/display
{
    "text": "Hello World",
    "color": "#ff0000",
    "blink": true
}
```

**Running:**
```bash
cd Pi
source venv/bin/activate
pip install aiohttp paho-mqtt Pillow numpy spidev gpiozero
python multimedia_server.py
```

---

### Backend (Django)

Django REST Framework backend with WebSocket support via Channels.

#### Directory Structure

```
Interface/backend/
├── xiot/
│   ├── settings.py      # Django configuration
│   ├── asgi.py          # ASGI config with MQTT integration
│   └── urls.py          # URL routing
├── api/
│   ├── models.py        # Database models
│   ├── serializers.py   # DRF serializers
│   ├── views.py         # API views
│   ├── urls.py          # API routes
│   ├── consumers.py     # WebSocket consumers
│   ├── mqtt_service.py  # MQTT subscriber
│   └── routing.py       # WebSocket routing
└── manage.py
```

#### Database Models

| Model | Description |
|-------|-------------|
| `Baseboard` | Controller board (Pi, MKR-1000) |
| `Sensor` | Sensor configuration and current values |
| `Actuator` | Actuator configuration and state |
| `SensorReading` | Historical sensor data |
| `Event` | System events and logs |

#### API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/baseboards/` | GET, POST | List/create baseboards |
| `/api/baseboards/{id}/` | GET, PUT, DELETE | Baseboard details |
| `/api/sensors/` | GET, POST | List/create sensors |
| `/api/sensors/{id}/` | GET, PUT, DELETE | Sensor details |
| `/api/sensors/{id}/readings/` | GET | Historical readings |
| `/api/actuators/` | GET, POST | List/create actuators |
| `/api/actuators/{id}/` | GET, PUT, DELETE | Actuator details |
| `/api/lcd/command/` | POST | Send LCD command |
| `/api/auth/login/` | POST | JWT login |
| `/api/auth/refresh/` | POST | Refresh token |

#### WebSocket

| Endpoint | Description |
|----------|-------------|
| `/ws/sensors/` | Real-time sensor updates |

**Running:**
```bash
cd Interface/backend
python -m venv venv
.\venv\Scripts\Activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python manage.py migrate
python manage.py setup_initial_data
daphne -b 0.0.0.0 -p 8000 xiot.asgi:application
```

---

### Frontend (React)

Modern React SPA with real-time data visualization.

#### Directory Structure

```
Interface/frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar/
│   │   ├── SensorCard/
│   │   ├── StatusCard/
│   │   └── Button/
│   ├── pages/
│   │   ├── Dashboard/       # Main dashboard with live data
│   │   ├── SensorAnalysis/  # Historical charts
│   │   ├── BaseboardManagement/  # Device management
│   │   ├── ActuatorControl/ # Control actuators
│   │   ├── Notifications/   # Alerts
│   │   ├── EventConfig/     # Event configuration
│   │   ├── ScenarioConfig/  # Automation scenarios
│   │   ├── SystemLogs/      # System logs
│   │   └── Login/           # Authentication
│   ├── hooks/
│   │   ├── useSensorData.js  # Real-time sensor data
│   │   └── usePiMultimedia.js # Video/audio/LCD
│   ├── services/
│   │   ├── api.js           # REST API client
│   │   ├── websocket.js     # WebSocket client
│   │   └── piMultimedia.js  # Multimedia services
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication state
│   └── styles/
│       └── global.css       # CSS variables & themes
└── package.json
```

#### Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Live sensor data, video, audio, LCD control |
| Data Analysis | `/data` | Click sensor card → historical charts |
| Devices | `/devices` | Manage baseboards, sensors, actuators |
| Control | `/control` | Manual actuator control |
| Alerts | `/alerts` | Threshold notifications |
| Events | `/events` | Event configuration |
| Scenarios | `/scenarios` | Automation rules |
| Logs | `/logs` | System activity logs |

**Running:**
```bash
cd Interface/frontend
npm install
npm run dev
```

---

## Quick Start

### 1. Setup MQTT Broker

Use an existing broker or install Mosquitto:
```bash
sudo apt install mosquitto mosquitto-clients
```

### 2. Setup ATtiny85 Adapter

1. Upload `adapter/attiny85_sensor.ino` to ATtiny85
2. Connect to Pi via I2C (see wiring diagram)
3. Verify connection:
   ```bash
   i2cdetect -y 1
   # Should show device at 0x08
   ```

### 3. Start Raspberry Pi Services

```bash
# Terminal 1: MQTT Publisher
cd Pi
python mqtt_publisher.py

# Terminal 2: Multimedia Server
cd Pi
python multimedia_server.py
```

### 4. Start Backend

```bash
cd Interface/backend
.\venv\Scripts\Activate
daphne -b 0.0.0.0 -p 8000 xiot.asgi:application
```

### 5. Start Frontend

```bash
cd Interface/frontend
npm run dev
```

### 6. Access Interface

- Open http://localhost:5173
- Login with: `admin` / `admin123`
- View live sensor data on Dashboard
- Click sensor cards to view historical data

---

## Configuration

### Environment Variables

#### Backend (`Interface/backend/xiot/settings.py`)
```python
MQTT_BROKER = "aalsdb.kaist.ac.kr"
MQTT_PORT = 1883
```

#### Frontend (`Interface/frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
VITE_PI_SERVER_URL=http://192.168.137.110:8080
```

#### Pi (`Pi/mqtt_publisher.py`)
```python
MQTT_BROKER = "aalsdb.kaist.ac.kr"
MQTT_PORT = 1883
BASEBOARD_ID = "PI-001"
```

---

## API Reference

### Sensor Data Message Format

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
            "timestamp": "2025-12-24T12:00:00.000Z"
        }
    ],
    "timestamp": "2025-12-24T12:00:00.000Z"
}
```

### LCD Command Format

```json
{
    "text": "Hello World",
    "color": "#ff0000",
    "blink": false
}
```

### Actuator Command Format

```json
{
    "actuator_id": 1,
    "command": "on",
    "value": 100
}
```

---

## Troubleshooting

### I2C Issues

**All addresses showing on i2cdetect:**
- SDA line stuck LOW
- Check for short circuits
- Verify pull-up resistors (4.7kΩ to 3.3V)
- Try different GPIO pins with software I2C

**No devices found:**
- Check wiring connections
- Verify ATtiny85 is powered
- Confirm I2C address in code matches

### MQTT Connection

**Disconnecting frequently:**
- Check broker availability
- Verify network connectivity
- Use unique client IDs

**No data received:**
- Check topic names match
- Verify MQTT subscriber is running in same process as Daphne

### Frontend Issues

**Sensor cards not updating:**
- Check WebSocket connection in browser console
- Verify backend is running with Daphne (not runserver)
- Check MQTT subscriber logs

**Video/Audio not working:**
- Verify Pi multimedia server is running
- Check CORS settings
- Update `PI_SERVER_URL` to correct IP

---

## License

MIT License - See LICENSE file for details.

## Contributors

SSEL Lab @ KAIST

