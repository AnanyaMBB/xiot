# XIOT Interface

A comprehensive IoT monitoring and control interface for the XIOT modular sensor board system.

## Overview

This interface provides:
- **Real-time Monitoring Dashboard**: Live sensor data visualization with sparkline charts
- **Actuator Control**: Direct control for PWM, relays, servos, motors, and more
- **Baseboard Management**: Monitor and configure connected Raspberry Pi controllers
- **Authentication**: JWT-based secure login system

## Tech Stack

- **Frontend**: React with Vite, React Router, CSS (design tokens)
- **Backend**: Django with Django REST Framework
- **Authentication**: JWT via djangorestframework-simplejwt
- **CORS**: django-cors-headers for cross-origin requests

## Getting Started

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (for testing)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`

## Default Test Credentials

- **Username**: admin
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Get JWT token
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Get current user

### Resources
- `GET /api/baseboards/` - List all baseboards
- `GET /api/sensors/` - List all sensors
- `GET /api/actuators/` - List all actuators
- `GET /api/status/` - Get system status

## Project Structure

```
Interface/
├── backend/
│   ├── xiot/           # Django project settings
│   ├── api/            # Main API app (models, views, serializers)
│   ├── authentication/ # JWT auth app
│   └── manage.py
│
└── frontend/
    └── src/
        ├── components/ # Reusable UI components
        │   ├── Button/
        │   ├── Input/
        │   ├── Modal/
        │   ├── Sidebar/
        │   ├── StatusCard/
        │   ├── SensorCard/
        │   └── ActuatorCard/
        ├── pages/      # Page components
        │   ├── Login/
        │   ├── Dashboard/
        │   ├── ActuatorControl/
        │   └── BaseboardManagement/
        ├── context/    # React context (Auth)
        ├── services/   # API service layer
        └── styles/     # CSS design tokens
```

## Design System

The interface uses CSS custom properties for consistent theming:

- **Primary Color**: `#3b82f6` (Blue)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Orange)
- **Error**: `#ef4444` (Red)
- **Font**: Inter

See `frontend/src/styles/variables.css` for all design tokens.

## Features

### Dashboard
- MQTT connection status
- I2C bus health monitoring
- Sensor data grid with real-time updates
- Video/audio feed placeholder
- Remote OLED display control

### Actuator Control
- PWM slider controls
- Relay toggle switches
- Servo angle positioning
- Motor start/stop controls
- Emergency stop functionality

### Baseboard Management
- Device cards with status indicators
- IP address and signal strength
- Sensor/actuator counts
- Feature badges (I2C, Camera, Audio, Display)
- Add new baseboard modal

