# XIOT Web Interface

Full-stack web application with Django REST backend and React frontend for monitoring and controlling IoT devices.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      INTERFACE                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              REACT FRONTEND                      │   │
│  │                 (port 5173)                      │   │
│  │                                                  │   │
│  │  • Dashboard      • Data Analysis               │   │
│  │  • Device Mgmt    • Actuator Control            │   │
│  │  • Alerts         • Events & Scenarios          │   │
│  │                                                  │   │
│  └───────────────────────┬─────────────────────────┘   │
│                          │                              │
│              REST API & WebSocket                       │
│                          │                              │
│  ┌───────────────────────▼─────────────────────────┐   │
│  │              DJANGO BACKEND                      │   │
│  │                 (port 8000)                      │   │
│  │                                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │   REST   │  │  WebSocket│  │    MQTT      │   │   │
│  │  │   API    │  │  Channels │  │  Subscriber  │   │   │
│  │  └──────────┘  └──────────┘  └──────────────┘   │   │
│  │                                                  │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │              SQLite Database              │   │   │
│  │  │  • Baseboards  • Sensors  • Actuators    │   │   │
│  │  │  • Readings    • Events   • Users        │   │   │
│  │  └──────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Backend (Django)

### Quick Start

```bash
cd Interface/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\Activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create initial data
python manage.py setup_initial_data

# Start server with WebSocket support
daphne -b 0.0.0.0 -p 8000 xiot.asgi:application
```

### Project Structure

```
backend/
├── xiot/
│   ├── __init__.py
│   ├── settings.py       # Django configuration
│   ├── urls.py           # Root URL routing
│   ├── asgi.py           # ASGI config (includes MQTT subscriber)
│   └── wsgi.py           # WSGI config (not used)
├── api/
│   ├── __init__.py
│   ├── models.py         # Database models
│   ├── serializers.py    # DRF serializers
│   ├── views.py          # API views
│   ├── urls.py           # API routes
│   ├── consumers.py      # WebSocket consumers
│   ├── routing.py        # WebSocket routing
│   ├── mqtt_service.py   # MQTT subscriber service
│   └── management/
│       └── commands/
│           └── setup_initial_data.py
├── manage.py
├── requirements.txt
└── db.sqlite3
```

### Database Models

#### Baseboard
```python
class Baseboard(Model):
    name: str                # Display name
    identifier: str          # Unique ID (e.g., "PI-001")
    status: str              # online/offline/warning/error
    ip_address: str          # IP address
    mqtt_topic: str          # MQTT topic prefix
    last_seen: datetime      # Last activity time
    uptime: str              # Uptime string
```

#### Sensor
```python
class Sensor(Model):
    baseboard: ForeignKey    # Parent baseboard
    name: str                # Display name
    sensor_type: str         # temperature/humidity/pressure/etc
    i2c_address: str         # I2C address (e.g., "0x08")
    unit: str                # Unit (e.g., "°C")
    current_value: float     # Latest reading
    min_threshold: float     # Alert threshold
    max_threshold: float     # Alert threshold
    status: str              # active/warning/critical/offline
```

#### Actuator
```python
class Actuator(Model):
    baseboard: ForeignKey    # Parent baseboard
    name: str                # Display name
    actuator_type: str       # pwm/relay/servo/motor
    status: str              # running/stopped/idle/locked
    current_value: float     # Current position/state
    min_value: float         # Minimum value
    max_value: float         # Maximum value
```

#### SensorReading
```python
class SensorReading(Model):
    sensor: ForeignKey       # Parent sensor
    value: float             # Reading value
    timestamp: datetime      # Reading time
```

### API Endpoints

#### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login/` | POST | Login, returns JWT tokens |
| `/api/auth/refresh/` | POST | Refresh access token |
| `/api/auth/logout/` | POST | Logout (blacklist token) |

**Login Request:**
```json
{
    "username": "admin",
    "password": "admin123"
}
```

**Login Response:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@xiot.local"
    }
}
```

#### Baseboards

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/baseboards/` | GET | List all baseboards |
| `/api/baseboards/` | POST | Create baseboard |
| `/api/baseboards/{id}/` | GET | Get baseboard details |
| `/api/baseboards/{id}/` | PUT | Update baseboard |
| `/api/baseboards/{id}/` | DELETE | Delete baseboard |

#### Sensors

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sensors/` | GET | List sensors (filter by baseboard) |
| `/api/sensors/` | POST | Create sensor |
| `/api/sensors/{id}/` | GET | Get sensor details |
| `/api/sensors/{id}/` | PATCH | Update sensor |
| `/api/sensors/{id}/` | DELETE | Delete sensor |
| `/api/sensors/{id}/readings/` | GET | Get historical readings |

**Readings Query Parameters:**
- `range`: Time range (1h, 6h, 24h, 7d, 30d)

#### Actuators

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/actuators/` | GET | List actuators |
| `/api/actuators/` | POST | Create actuator |
| `/api/actuators/{id}/` | GET | Get actuator details |
| `/api/actuators/{id}/` | PATCH | Update actuator |
| `/api/actuators/{id}/` | DELETE | Delete actuator |

#### LCD Control

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/lcd/command/` | POST | Send LCD command |

**Request:**
```json
{
    "text": "Hello World",
    "color": "#ff0000",
    "blink": false
}
```

### WebSocket

#### Sensor Updates

**Endpoint:** `ws://localhost:8000/ws/sensors/`

**Message Types:**

Connection established:
```json
{
    "type": "connection_established",
    "message": "Connected to XIOT sensor stream"
}
```

Sensor update:
```json
{
    "type": "sensor_update",
    "data": {
        "baseboard_id": "PI-001",
        "sensors": [...],
        "timestamp": "2025-12-24T12:00:00.000000Z"
    }
}
```

### MQTT Integration

The MQTT subscriber runs as a thread inside the Daphne ASGI server (configured in `asgi.py`).

**Subscribed Topics:**
- `xiot/+/sensors` - Sensor data from all baseboards
- `xiot/+/status` - Status updates from baseboards

**Data Flow:**
1. Pi publishes sensor data to MQTT
2. Backend subscriber receives message
3. Updates database (Sensor, SensorReading)
4. Broadcasts to WebSocket clients
5. Frontend receives real-time update

---

## Frontend (React)

### Quick Start

```bash
cd Interface/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Sidebar.css
│   │   ├── SensorCard/
│   │   │   ├── SensorCard.jsx
│   │   │   └── SensorCard.css
│   │   ├── StatusCard/
│   │   └── Button/
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── SensorAnalysis/
│   │   ├── BaseboardManagement/
│   │   ├── ActuatorControl/
│   │   ├── Notifications/
│   │   ├── EventConfig/
│   │   ├── ScenarioConfig/
│   │   ├── SystemLogs/
│   │   └── Login/
│   ├── hooks/
│   │   ├── useSensorData.js
│   │   └── usePiMultimedia.js
│   ├── services/
│   │   ├── api.js
│   │   ├── websocket.js
│   │   └── piMultimedia.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── index.html
```

### Pages

#### Dashboard (`/`)
Main monitoring page with:
- Live sensor cards with real-time data
- Video stream from Pi camera
- Bidirectional audio controls
- LCD text/color control

#### Data Analysis (`/data`)
Click any sensor card to view:
- Time-series chart
- Statistics (min, max, avg)
- Recent readings table
- Time range selector

#### Devices (`/devices`)
Device management:
- List all baseboards
- Add/edit/delete baseboards
- View attached sensors and actuators
- Network scanning (placeholder)

#### Control (`/control`)
Actuator control panel:
- PWM sliders
- Toggle switches
- Manual command input

#### Alerts (`/alerts`)
Notification center:
- Threshold alerts
- System notifications
- Alert history

#### Events (`/events`)
Event configuration:
- Define trigger conditions
- Set actions

#### Scenarios (`/scenarios`)
Automation rules:
- Complex condition logic
- Scheduled actions

#### Logs (`/logs`)
System activity:
- API calls
- MQTT messages
- Errors

### Hooks

#### useSensorData
Manages real-time sensor data via WebSocket.

```jsx
const { 
    sensors,           // Array of sensor objects
    isConnected,       // WebSocket connection status
    hasReceivedLiveData // Whether live data received
} = useSensorData();
```

Features:
- Auto-reconnect on disconnect
- Sensor timeout detection
- Automatic sensor removal when offline

#### usePiMultimedia
Manages Pi multimedia features.

```jsx
const {
    isConnected,       // Pi server connection status
    videoUrl,          // Video stream URL
    audioUrl,          // Audio stream URL
    startListening,    // Start audio playback
    stopListening,     // Stop audio playback
    startPushToTalk,   // Start PTT
    stopPushToTalk,    // Stop PTT
    sendLcdCommand,    // Send LCD text/color
} = usePiMultimedia(PI_SERVER_URL);
```

### Services

#### api.js
Axios-based REST client with JWT authentication.

```javascript
import { apiService } from './services/api';

// Get all baseboards
const response = await apiService.getBaseboards();

// Get sensor readings
const readings = await apiService.getSensorReadings(sensorId, { range: '24h' });

// Create sensor
await apiService.createSensor({ name: 'Temp', baseboard: 1, ... });
```

#### websocket.js
WebSocket client for real-time updates.

```javascript
import { websocketService } from './services/websocket';

websocketService.connect();
websocketService.subscribe('sensor_update', (data) => {
    console.log('Sensor update:', data);
});
```

#### piMultimedia.js
Direct communication with Pi multimedia server.

```javascript
import { piMultimediaService } from './services/piMultimedia';

piMultimediaService.setServerUrl('http://192.168.137.110:8080');
piMultimediaService.getVideoUrl();  // Returns MJPEG URL
piMultimediaService.sendLcdCommand({ text: 'Hello', color: '#ff0000' });
```

### Styling

CSS variables defined in `global.css`:

```css
:root {
    /* Colors */
    --color-primary: #3b82f6;
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    
    /* Backgrounds */
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f8fafc;
    --color-bg-tertiary: #f1f5f9;
    
    /* Text */
    --color-text-primary: #0f172a;
    --color-text-secondary: #1e293b;
    --color-text-muted: #64748b;
    
    /* Spacing */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Radius */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    
    /* Shadows */
    --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}
```

---

## Configuration

### Backend Environment

Create `Interface/backend/.env`:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
MQTT_BROKER=aalsdb.kaist.ac.kr
MQTT_PORT=1883
```

### Frontend Environment

Create `Interface/frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
VITE_PI_SERVER_URL=http://192.168.137.110:8080
```

---

## Running in Production

### Backend

```bash
# Install production server
pip install daphne

# Run with workers
daphne -b 0.0.0.0 -p 8000 xiot.asgi:application
```

### Frontend

```bash
# Build for production
npm run build

# Serve with nginx or similar
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name xiot.example.com;

    location / {
        root /var/www/xiot/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```
