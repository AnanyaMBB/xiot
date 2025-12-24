import { useState } from 'react';
import StatusCard from '../../components/StatusCard/StatusCard';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import './SystemLogs.css';

// Icons
const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ServerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

const DatabaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const WifiIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const mockLogs = [
  { id: 1, timestamp: '2024-12-24 14:32:05', level: 'info', source: 'MQTT Broker', message: 'Connected to broker at mqtt://localhost:1883', details: 'Client ID: xiot-interface-001' },
  { id: 2, timestamp: '2024-12-24 14:32:04', level: 'success', source: 'Baseboard', message: 'MKR-1000-MAIN came online', details: 'IP: 192.168.1.105, Sensors: 6' },
  { id: 3, timestamp: '2024-12-24 14:31:58', level: 'warning', source: 'Event Engine', message: 'High Temperature threshold approached', details: 'Sensor: Temp-A, Value: 27.8°C, Threshold: 28°C' },
  { id: 4, timestamp: '2024-12-24 14:31:45', level: 'info', source: 'Scenario', message: 'Greenhouse Climate Control executed', details: 'Actions: 2 completed, Duration: 145ms' },
  { id: 5, timestamp: '2024-12-24 14:31:30', level: 'error', source: 'Baseboard', message: 'ESP32-DEV heartbeat timeout', details: 'Last seen: 2 minutes ago, Status: OFFLINE' },
  { id: 6, timestamp: '2024-12-24 14:31:15', level: 'info', source: 'API', message: 'GET /api/sensors/ - 200 OK', details: 'Duration: 23ms, User: admin' },
  { id: 7, timestamp: '2024-12-24 14:31:00', level: 'success', source: 'Notification', message: 'Email sent successfully', details: 'To: admin@example.com, Subject: Temperature Alert' },
  { id: 8, timestamp: '2024-12-24 14:30:45', level: 'debug', source: 'Sensor', message: 'Reading received from Humidity-B', details: 'Value: 62.3%, Topic: xiot/sensor/humidity_b' },
  { id: 9, timestamp: '2024-12-24 14:30:30', level: 'warning', source: 'System', message: 'Database connection pool at 80% capacity', details: 'Active: 8/10, Waiting: 2' },
  { id: 10, timestamp: '2024-12-24 14:30:15', level: 'info', source: 'Actuator', message: 'PWM value updated', details: 'LED-Brightness: 180 (was 128)' },
  { id: 11, timestamp: '2024-12-24 14:30:00', level: 'critical', source: 'Event Engine', message: 'Critical temperature exceeded!', details: 'Sensor: Temp-A, Value: 36.2°C, Emergency actions triggered' },
  { id: 12, timestamp: '2024-12-24 14:29:45', level: 'info', source: 'System', message: 'Scheduled backup completed', details: 'Size: 2.4MB, Duration: 3.2s' },
];

const systemMetrics = {
  uptime: '15d 4h 32m',
  cpu: 23,
  memory: 67,
  disk: 45,
  mqttMessages: 15234,
  activeConnections: 8,
};

const SystemLogs = () => {
  const [logs, setLogs] = useState(mockLogs);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(true);

  const levels = ['all', 'debug', 'info', 'success', 'warning', 'error', 'critical'];
  const sources = ['all', 'System', 'MQTT Broker', 'Baseboard', 'Sensor', 'Actuator', 'Event Engine', 'Scenario', 'Notification', 'API'];

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSource = filterSource === 'all' || log.source === filterSource;
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSource && matchesSearch;
  });

  const getLevelIcon = (level) => {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🚨';
      default: return '•';
    }
  };

  return (
    <div className="system-logs">
      <div className="logs-container">
        {/* Header */}
        <header className="logs-header">
          <div className="logs-header-left">
            <h1 className="logs-title">System Health & Logs</h1>
            <p className="logs-subtitle">Monitor system performance and view activity logs</p>
          </div>
          <div className="logs-header-right">
            <Button variant="secondary" icon={<DownloadIcon />}>
              Export Logs
            </Button>
            <Button 
              variant={isLive ? 'primary' : 'secondary'} 
              icon={<RefreshIcon />}
              onClick={() => setIsLive(!isLive)}
            >
              {isLive ? 'Live' : 'Paused'}
            </Button>
          </div>
        </header>

        {/* System Health Cards */}
        <div className="health-grid">
          <div className="health-card">
            <div className="health-icon">
              <ServerIcon />
            </div>
            <div className="health-content">
              <span className="health-label">System Uptime</span>
              <span className="health-value">{systemMetrics.uptime}</span>
            </div>
            <div className="health-status health-status--success">Healthy</div>
          </div>

          <div className="health-card">
            <div className="health-icon">
              <ActivityIcon />
            </div>
            <div className="health-content">
              <span className="health-label">CPU Usage</span>
              <div className="health-bar-container">
                <div className="health-bar">
                  <div 
                    className="health-bar-fill health-bar-fill--success" 
                    style={{ width: `${systemMetrics.cpu}%` }}
                  />
                </div>
                <span className="health-percentage">{systemMetrics.cpu}%</span>
              </div>
            </div>
          </div>

          <div className="health-card">
            <div className="health-icon">
              <DatabaseIcon />
            </div>
            <div className="health-content">
              <span className="health-label">Memory</span>
              <div className="health-bar-container">
                <div className="health-bar">
                  <div 
                    className="health-bar-fill health-bar-fill--warning" 
                    style={{ width: `${systemMetrics.memory}%` }}
                  />
                </div>
                <span className="health-percentage">{systemMetrics.memory}%</span>
              </div>
            </div>
          </div>

          <div className="health-card">
            <div className="health-icon">
              <WifiIcon />
            </div>
            <div className="health-content">
              <span className="health-label">MQTT Messages</span>
              <span className="health-value">{systemMetrics.mqttMessages.toLocaleString()}</span>
            </div>
            <div className="health-meta">Today</div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="connection-status">
          <div className="connection-item">
            <span className="connection-dot connection-dot--online"></span>
            <span className="connection-label">MQTT Broker</span>
            <span className="connection-value">Connected</span>
          </div>
          <div className="connection-item">
            <span className="connection-dot connection-dot--online"></span>
            <span className="connection-label">Database</span>
            <span className="connection-value">Healthy</span>
          </div>
          <div className="connection-item">
            <span className="connection-dot connection-dot--online"></span>
            <span className="connection-label">WebSocket</span>
            <span className="connection-value">Active ({systemMetrics.activeConnections})</span>
          </div>
          <div className="connection-item">
            <span className="connection-dot connection-dot--warning"></span>
            <span className="connection-label">Notification Service</span>
            <span className="connection-value">Degraded</span>
          </div>
        </div>

        {/* Logs Section */}
        <div className="logs-section">
          <div className="logs-toolbar">
            <div className="toolbar-left">
              <div className="filter-group">
                <FilterIcon />
                <select 
                  className="filter-select"
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  {levels.map(level => (
                    <option key={level} value={level}>
                      {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <select 
                  className="filter-select"
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                >
                  {sources.map(source => (
                    <option key={source} value={source}>
                      {source === 'all' ? 'All Sources' : source}
                    </option>
                  ))}
                </select>
              </div>
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="toolbar-right">
              <span className="log-count">
                Showing {filteredLogs.length} of {logs.length} entries
              </span>
            </div>
          </div>

          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th className="col-time">Timestamp</th>
                  <th className="col-level">Level</th>
                  <th className="col-source">Source</th>
                  <th className="col-message">Message</th>
                  <th className="col-details">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className={`log-row log-row--${log.level}`}>
                    <td className="col-time">
                      <span className="log-time">{log.timestamp}</span>
                    </td>
                    <td className="col-level">
                      <span className={`level-badge level-badge--${log.level}`}>
                        {getLevelIcon(log.level)} {log.level}
                      </span>
                    </td>
                    <td className="col-source">
                      <span className="source-badge">{log.source}</span>
                    </td>
                    <td className="col-message">
                      <span className="log-message">{log.message}</span>
                    </td>
                    <td className="col-details">
                      <span className="log-details">{log.details}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isLive && (
            <div className="live-indicator">
              <span className="live-dot"></span>
              <span>Live updates enabled - Logs refresh automatically</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;

