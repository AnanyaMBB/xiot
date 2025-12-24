import { useState, useEffect, useMemo } from 'react';
import StatusCard from '../../components/StatusCard/StatusCard';
import SensorCard from '../../components/SensorCard/SensorCard';
import Button from '../../components/Button/Button';
import { useSensorData } from '../../hooks/useSensorData';
import './Dashboard.css';

// Icons
const WifiIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" />
  </svg>
);

const CpuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

const BoxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Mock data
const mockSensors = [
  {
    id: 1,
    name: 'Temp Sensor A',
    adapterId: 'ADPT:01 (0x48)',
    value: '24.5',
    unit: '°C',
    status: 'active',
    timestamp: '10:42:35',
    rateOfChange: '+0.1/s',
    sparklineData: '0,20 15,15 30,18 45,12 60,16 75,14 85,18 100,20',
  },
  {
    id: 2,
    name: 'Humidity B',
    adapterId: 'ADPT:02 (0x49)',
    value: '58.2',
    unit: '%',
    status: 'active',
    timestamp: '10:42:35',
    rateOfChange: '0.0/s',
    sparklineData: '0,15 20,15 40,16 60,15 80,15 100,15',
  },
  {
    id: 3,
    name: 'Pressure C',
    adapterId: 'ADPT:03 (0x50)',
    value: '1013',
    unit: 'hPa',
    status: 'warning',
    timestamp: '10:42:35',
    rateOfChange: '-0.5/s',
    sparklineData: '0,25 20,22 40,20 60,18 80,15 100,12',
  },
  {
    id: 4,
    name: 'Vibration D',
    adapterId: 'ADPT:03 (0x51)',
    value: '2.45',
    unit: 'g',
    status: 'critical',
    timestamp: '10:42:35',
    rateOfChange: '+120%',
    sparklineData: '0,10 10,15 20,25 30,20 40,30 50,25 60,35 70,28 80,40 90,35 100,30',
  },
  {
    id: 5,
    name: 'Power Meter',
    adapterId: 'ADPT:04 (0x55)',
    value: '--',
    unit: '',
    status: 'offline',
    timestamp: 'Last seen: 5m ago',
    rateOfChange: '',
  },
  {
    id: 6,
    name: 'Light Level',
    adapterId: 'ADPT:05 (0x39)',
    value: '450',
    unit: 'Lux',
    status: 'active',
    timestamp: '10:42:35',
    rateOfChange: '0.0/s',
    sparklineData: '0,18 25,20 50,22 75,20 100,18',
  },
];

const Dashboard = () => {
  const [selectedBaseboard, setSelectedBaseboard] = useState('PI-001');
  const [displayMessage, setDisplayMessage] = useState('');
  
  // Real-time sensor data from WebSocket
  const { sensors: liveSensors, isConnected, connectionStatus, lastUpdate } = useSensorData();
  
  // Merge live sensor data with mock data for offline sensors
  const sensors = useMemo(() => {
    if (liveSensors.length > 0) {
      // Transform live sensor data to match component format
      return liveSensors.map((sensor, index) => ({
        id: index + 1,
        name: sensor.name,
        adapterId: `ADPT (${sensor.i2c_address})`,
        value: sensor.value !== null ? sensor.value.toString() : '--',
        unit: sensor.unit || '',
        status: sensor.status === 'active' ? 'active' : 
                sensor.status === 'offline' ? 'offline' : 'warning',
        timestamp: new Date(sensor.lastUpdate).toLocaleTimeString(),
        rateOfChange: '',
        sparklineData: '0,15 25,18 50,16 75,19 100,17',
      }));
    }
    // Fall back to mock data if no live sensors
    return mockSensors;
  }, [liveSensors]);

  const handleSendDisplay = () => {
    console.log('Sending to display:', displayMessage);
    setDisplayMessage('');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-title">Real-time Monitoring</h1>
            <p className="dashboard-subtitle">Live sensor data stream & system health</p>
          </div>
          <div className="dashboard-header-right">
            <span className="baseboard-label">Target Baseboard</span>
            <button className="baseboard-select">
              <span className="baseboard-indicator" />
              <span className="baseboard-name">{selectedBaseboard}</span>
              <ChevronDownIcon />
            </button>
          </div>
        </header>

        {/* Status Cards */}
        <div className="status-cards-grid">
          <StatusCard
            title="WebSocket"
            value={isConnected ? "Connected" : "Disconnected"}
            icon={<WifiIcon />}
            status={isConnected ? "success" : "error"}
            badge={{ text: isConnected ? 'Live' : 'Offline', variant: isConnected ? 'success' : 'error' }}
          />
          <StatusCard
            title="I2C Bus"
            value="Stable"
            icon={<CpuIcon />}
            badge={{ text: '400kHz', variant: 'info' }}
          />
          <StatusCard
            title="Adapters"
            value="4"
            subtitle="detected"
            icon={<BoxIcon />}
          />
          <StatusCard
            title="Sensors"
            value={liveSensors.length > 0 ? liveSensors.length.toString() : "0"}
            subtitle={isConnected ? "streaming" : "waiting"}
            icon={<ActivityIcon />}
          />
          <StatusCard
            title="Uptime"
            value="4d 12h 30m"
            icon={<ClockIcon />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-content">
          {/* Multimedia Feed */}
          <div className="multimedia-panel">
            <div className="panel-header">
              <div className="panel-title">
                <span className="panel-icon">📹</span>
                <span>Multimedia Feed</span>
              </div>
              <span className="live-badge">
                <span className="live-dot" />
                Live
              </span>
            </div>
            
            <div className="video-container">
              <div className="video-placeholder">
                <div className="video-play-button">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
              <span className="rec-indicator">
                <span className="rec-dot" />
                REC
              </span>
            </div>

            <div className="video-controls">
              <button className="control-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
              <div className="volume-slider">
                <div className="volume-track">
                  <div className="volume-fill" style={{ width: '66%' }} />
                </div>
              </div>
              <span className="latency-info">
                <span className="latency-icon">📶</span>
                32ms latency
              </span>
              <Button variant="primary" size="small">
                🎤 Push to Talk
              </Button>
            </div>

            <div className="display-control">
              <div className="display-header">
                <span className="display-title">
                  <span>📺</span> Remote Display Control
                </span>
                <span className="display-type">SSD1306 OLED</span>
              </div>
              <div className="display-input-row">
                <input
                  type="text"
                  className="display-input"
                  placeholder="Send message to display..."
                  value={displayMessage}
                  onChange={(e) => setDisplayMessage(e.target.value)}
                />
                <div className="color-picker" style={{ backgroundColor: '#3b82f6' }} />
                <Button variant="secondary" size="small" onClick={handleSendDisplay}>
                  Send ▶
                </Button>
              </div>
              <span className="display-status">✓ Acknowledged</span>
            </div>
          </div>

          {/* Sensor Grid */}
          <div className="sensor-grid">
            {sensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                name={sensor.name}
                adapterId={sensor.adapterId}
                value={sensor.value}
                unit={sensor.unit}
                status={sensor.status}
                timestamp={sensor.timestamp}
                rateOfChange={sensor.rateOfChange}
                sparklineData={sensor.sparklineData}
              />
            ))}
          </div>
        </div>

        {/* Footer Status */}
        <footer className="dashboard-footer">
          <div className="footer-left">
            <RefreshIcon />
            <span className="footer-text">Last Update:</span>
            <span className="footer-value">
              {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Waiting for data...'}
            </span>
          </div>
          <div className="footer-right">
            <div className="footer-status">
              <span className="status-dot status-dot--success" />
              <span>Gateway Online</span>
            </div>
            <div className="footer-status">
              <span className="status-dot status-dot--primary" />
              <span>DB Connected</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;

