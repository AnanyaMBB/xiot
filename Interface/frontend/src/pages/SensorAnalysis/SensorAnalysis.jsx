import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StatusCard from '../../components/StatusCard/StatusCard';
import Button from '../../components/Button/Button';
import { apiService } from '../../services/api';
import './SensorAnalysis.css';

// Icons
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

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

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const SensorAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sensorFromState = location.state?.sensor;

  const [sensor, setSensor] = useState(sensorFromState || null);
  const [readings, setReadings] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchSensorData = useCallback(async () => {
    // Only fetch if we have a valid numeric sensor ID
    const sensorId = sensor?.id;
    if (!sensorId || typeof sensorId !== 'number') {
      console.log('[SensorAnalysis] No valid sensor ID, skipping fetch');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.getSensorReadings(sensorId, { range: timeRange });
      setReadings(response.data.readings || []);
      setStatistics(response.data.statistics || {});
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch sensor readings:', err);
      // Don't show error if it's just a 404 (sensor not found in DB yet)
      if (err.response?.status === 404) {
        setReadings([]);
        setStatistics({ current: sensor?.value, min: null, max: null, avg: null, count: 0 });
      } else {
        setError('Failed to load sensor data');
      }
    } finally {
      setLoading(false);
    }
  }, [sensor?.id, sensor?.value, timeRange]);

  useEffect(() => {
    const sensorId = sensor?.id;
    if (sensorId && typeof sensorId === 'number') {
      fetchSensorData();
    }
  }, [fetchSensorData, sensor?.id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const sensorId = sensor?.id;
    if (!sensorId || typeof sensorId !== 'number') return;
    
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, [fetchSensorData, sensor?.id]);

  const handleBack = () => {
    navigate(-1);
  };

  const generateChartPoints = () => {
    if (!readings.length) return '';
    
    const width = 800;
    const height = 250;
    const padding = 20;
    
    const values = readings.map(r => r.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    
    return readings.map((reading, index) => {
      const x = padding + (index / (readings.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((reading.value - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeLabels = () => {
    if (!readings.length) return [];
    const step = Math.floor(readings.length / 6) || 1;
    return readings.filter((_, i) => i % step === 0).slice(0, 7).map(r => formatTime(r.timestamp));
  };

  // If no sensor is provided, show a message to select one
  if (!sensor) {
    return (
      <div className="sensor-analysis">
        <div className="analysis-container">
          <div className="no-sensor-state">
            <ActivityIcon />
            <h2>No Sensor Selected</h2>
            <p>Click on a sensor card from the Dashboard to view its analysis.</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sensor-analysis">
      <div className="analysis-container">
        {/* Header */}
        <header className="analysis-header">
          <div className="analysis-header-left">
            <Button variant="ghost" icon={<BackIcon />} onClick={handleBack} className="back-btn">
              Back
            </Button>
            <div className="sensor-title-section">
              <h1 className="analysis-title">{sensor.name}</h1>
              <div className="sensor-meta">
                <span className="sensor-type-badge">{sensor.sensorType || 'Sensor'}</span>
                <span className="sensor-id">{sensor.adapterId}</span>
                {sensor.baseboard && (
                  <span className="sensor-baseboard">on {sensor.baseboard}</span>
                )}
              </div>
            </div>
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
            <Button variant="secondary" icon={<RefreshIcon />} onClick={fetchSensorData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button variant="secondary" icon={<DownloadIcon />}>
              Export
            </Button>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={fetchSensorData}>Retry</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatusCard
            title="Current Value"
            value={statistics?.current != null ? `${statistics.current}` : (sensor.value || '--')}
            subtitle={sensor.unit || ''}
            icon={<ActivityIcon />}
            status={sensor.status === 'active' ? 'success' : sensor.status === 'warning' ? 'warning' : 'default'}
          />
          <StatusCard
            title="Minimum"
            value={statistics?.min != null ? statistics.min.toFixed(2) : '--'}
            subtitle={sensor.unit || ''}
            icon={<TrendingUpIcon />}
          />
          <StatusCard
            title="Maximum"
            value={statistics?.max != null ? statistics.max.toFixed(2) : '--'}
            subtitle={sensor.unit || ''}
            icon={<TrendingUpIcon />}
          />
          <StatusCard
            title="Average"
            value={statistics?.avg != null ? statistics.avg.toFixed(2) : '--'}
            subtitle={sensor.unit || ''}
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
                <span className="chart-subtitle">
                  {readings.length} readings in the last {timeRange}
                </span>
              </div>
              <div className="chart-current-value">
                <span className="current-label">Current:</span>
                <span className="current-value">
                  {sensor.value || statistics?.current || '--'} {sensor.unit}
                </span>
              </div>
            </div>

            <div className="chart-area">
              {readings.length > 0 ? (
                <div className="chart-wrapper">
                  <svg viewBox="0 0 800 280" preserveAspectRatio="none" className="chart-svg">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="100" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 100 0 L 0 0 0 50" fill="none" stroke="var(--color-border-light)" strokeWidth="1"/>
                      </pattern>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <rect x="20" y="20" width="760" height="210" fill="url(#grid)" />
                    
                    {/* Area fill */}
                    <polygon
                      fill="url(#chartGradient)"
                      points={`20,230 ${generateChartPoints()} 780,230`}
                    />
                    
                    {/* Main line */}
                    <polyline
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={generateChartPoints()}
                    />
                    
                    {/* Min threshold line */}
                    {statistics?.min !== null && (
                      <line 
                        x1="20" 
                        y1="210" 
                        x2="780" 
                        y2="210" 
                        stroke="var(--color-success)" 
                        strokeWidth="1" 
                        strokeDasharray="5,5" 
                      />
                    )}
                    
                    {/* Max threshold line */}
                    {statistics?.max !== null && (
                      <line 
                        x1="20" 
                        y1="40" 
                        x2="780" 
                        y2="40" 
                        stroke="var(--color-error)" 
                        strokeWidth="1" 
                        strokeDasharray="5,5" 
                      />
                    )}
                  </svg>

                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: 'var(--color-primary)' }}></span>
                      <span>{sensor.name}</span>
                    </div>
                    {statistics?.min != null && (
                      <div className="legend-item legend-item--dashed legend-item--min">
                        <span className="legend-line"></span>
                        <span>Min: {statistics.min.toFixed(2)}</span>
                      </div>
                    )}
                    {statistics?.max != null && (
                      <div className="legend-item legend-item--dashed legend-item--max">
                        <span className="legend-line"></span>
                        <span>Max: {statistics.max.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="chart-placeholder">
                  <div className="no-data-message">
                    <AlertIcon />
                    <p>No readings available for this time range</p>
                  </div>
                </div>
              )}
            </div>

            <div className="chart-x-axis">
              {getTimeLabels().map((label, i) => (
                <span key={i}>{label}</span>
              ))}
            </div>
          </div>

          {/* Recent Readings Table */}
          <div className="readings-panel">
            <div className="panel-header">
              <h2>Recent Readings</h2>
              <span className="panel-subtitle">Last {Math.min(readings.length, 20)} entries</span>
            </div>

            <div className="readings-table">
              <div className="table-header">
                <span>Timestamp</span>
                <span>Value</span>
              </div>
              
              {readings.slice(-20).reverse().map((reading, index) => (
                <div key={index} className="table-row">
                  <span className="reading-time">
                    {new Date(reading.timestamp).toLocaleString()}
                  </span>
                  <span className="reading-value">
                    {reading.value} {sensor.unit}
                  </span>
                </div>
              ))}

              {readings.length === 0 && (
                <div className="no-readings">
                  No readings available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="analysis-footer">
          <div className="footer-left">
            <span className="footer-text">Data refreshed:</span>
            <span className="footer-value">
              {lastRefresh ? `${Math.floor((Date.now() - lastRefresh) / 1000)}s ago` : 'Never'}
            </span>
          </div>
          <div className="footer-right">
            <span className="footer-info">
              {readings.length} data points in {timeRange}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SensorAnalysis;
