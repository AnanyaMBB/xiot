import { useState } from 'react';
import StatusCard from '../../components/StatusCard/StatusCard';
import Button from '../../components/Button/Button';
import './SensorAnalysis.css';

// Icons
const TrendingUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Mock sensor data for the chart
const mockChartData = {
  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  datasets: [
    { name: 'Temp Sensor A', color: '#3b82f6', data: [22.5, 21.8, 23.2, 25.1, 24.8, 23.5, 22.9] },
    { name: 'Humidity B', color: '#10b981', data: [58, 62, 55, 52, 54, 58, 60] },
    { name: 'Pressure C', color: '#f59e0b', data: [1013, 1012, 1015, 1018, 1016, 1014, 1013] },
  ],
};

const mockSensorList = [
  { id: 1, name: 'Temp Sensor A', type: 'Temperature', current: '24.5°C', min: '21.2°C', max: '26.8°C', avg: '23.9°C', status: 'normal' },
  { id: 2, name: 'Humidity B', type: 'Humidity', current: '58.2%', min: '48.5%', max: '68.3%', avg: '55.1%', status: 'normal' },
  { id: 3, name: 'Pressure C', type: 'Pressure', current: '1013hPa', min: '1008hPa', max: '1022hPa', avg: '1015hPa', status: 'warning' },
  { id: 4, name: 'Vibration D', type: 'Vibration', current: '2.45g', min: '0.12g', max: '3.82g', avg: '1.24g', status: 'critical' },
  { id: 5, name: 'Light Level', type: 'Light', current: '450Lux', min: '85Lux', max: '1250Lux', avg: '420Lux', status: 'normal' },
];

const SensorAnalysis = () => {
  const [selectedSensor, setSelectedSensor] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedSensors, setSelectedSensors] = useState(['Temp Sensor A']);

  return (
    <div className="sensor-analysis">
      <div className="analysis-container">
        {/* Header */}
        <header className="analysis-header">
          <div className="analysis-header-left">
            <h1 className="analysis-title">Sensor Analysis</h1>
            <p className="analysis-subtitle">Historical data visualization and statistics</p>
          </div>
          <div className="analysis-header-right">
            <div className="time-range-selector">
              {['1h', '6h', '24h', '7d', '30d'].map((range) => (
                <button
                  key={range}
                  className={`time-btn ${timeRange === range ? 'time-btn--active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
            <Button variant="secondary" icon={<DownloadIcon />}>
              Export
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatusCard
            title="Active Sensors"
            value="12"
            subtitle="streaming"
            icon={<ActivityIcon />}
          />
          <StatusCard
            title="Data Points"
            value="1.2M"
            subtitle="last 24h"
            icon={<TrendingUpIcon />}
          />
          <StatusCard
            title="Anomalies"
            value="3"
            subtitle="detected"
            icon={<AlertIcon />}
            status="warning"
          />
          <StatusCard
            title="Avg. Sample Rate"
            value="250"
            subtitle="ms"
            icon={<ActivityIcon />}
          />
        </div>

        {/* Main Content */}
        <div className="analysis-content">
          {/* Chart Area */}
          <div className="chart-panel">
            <div className="chart-header">
              <div className="chart-title">
                <h2>Time Series Data</h2>
                <span className="chart-subtitle">Sensor readings over time</span>
              </div>
              <div className="chart-controls">
                <div className="sensor-selector">
                  <button className="selector-btn">
                    <span>Select Sensors</span>
                    <ChevronDownIcon />
                  </button>
                </div>
              </div>
            </div>

            <div className="chart-area">
              {/* Simplified chart representation */}
              <div className="chart-placeholder">
                <svg viewBox="0 0 800 300" preserveAspectRatio="none" className="chart-svg">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="100" height="50" patternUnits="userSpaceOnUse">
                      <path d="M 100 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="800" height="300" fill="url(#grid)" />
                  
                  {/* Temperature line */}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    points="0,150 100,160 200,140 300,100 400,110 500,130 600,145 700,140 800,145"
                  />
                  
                  {/* Humidity line */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    points="0,120 100,100 200,140 300,160 400,150 500,120 600,110 700,115 800,120"
                  />
                  
                  {/* Threshold line */}
                  <line x1="0" y1="80" x2="800" y2="80" stroke="#ef4444" strokeWidth="1" strokeDasharray="5,5" />
                </svg>

                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                    <span>Temperature</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                    <span>Humidity</span>
                  </div>
                  <div className="legend-item legend-item--dashed">
                    <span className="legend-line"></span>
                    <span>Threshold</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-x-axis">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>Now</span>
            </div>
          </div>

          {/* Sensor Statistics Table */}
          <div className="stats-panel">
            <div className="panel-header">
              <h2>Sensor Statistics</h2>
              <span className="panel-subtitle">Summary for selected time range</span>
            </div>

            <div className="stats-table">
              <div className="table-header">
                <span>Sensor</span>
                <span>Current</span>
                <span>Min</span>
                <span>Max</span>
                <span>Avg</span>
                <span>Status</span>
              </div>
              
              {mockSensorList.map((sensor) => (
                <div key={sensor.id} className={`table-row table-row--${sensor.status}`}>
                  <div className="sensor-info">
                    <span className="sensor-name">{sensor.name}</span>
                    <span className="sensor-type">{sensor.type}</span>
                  </div>
                  <span className="stat-value stat-value--current">{sensor.current}</span>
                  <span className="stat-value">{sensor.min}</span>
                  <span className="stat-value">{sensor.max}</span>
                  <span className="stat-value">{sensor.avg}</span>
                  <span className={`status-badge status-badge--${sensor.status}`}>
                    {sensor.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="analysis-footer">
          <div className="footer-left">
            <span className="footer-text">Data refreshed:</span>
            <span className="footer-value">2 seconds ago</span>
          </div>
          <div className="footer-right">
            <span className="footer-info">Showing {mockSensorList.length} sensors</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SensorAnalysis;
