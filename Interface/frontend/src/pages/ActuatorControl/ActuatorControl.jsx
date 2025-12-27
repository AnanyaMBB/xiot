import { useState, useEffect, useCallback } from 'react';
import StatusCard from '../../components/StatusCard/StatusCard';
import ActuatorCard from '../../components/ActuatorCard/ActuatorCard';
import Button from '../../components/Button/Button';
import { apiService } from '../../services/api';
import './ActuatorControl.css';

// Icons
const WifiIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ZapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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

// Search/Scan Icon
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ActuatorControl = () => {
  const [selectedBaseboard, setSelectedBaseboard] = useState('PI-001');
  const [actuators, setActuators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState(null);

  // Fetch actuators from API
  const fetchActuators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAllActuators();
      setActuators(response.data);
      setLastSync(new Date());
    } catch (err) {
      console.error('Failed to fetch actuators:', err);
      setError('Failed to load actuators');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load actuators on mount and refresh periodically
  useEffect(() => {
    fetchActuators();
    const interval = setInterval(fetchActuators, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchActuators]);

  // Handle actuator status change after command is sent
  const handleActuatorStatusChange = useCallback((updatedActuator) => {
    setActuators(prev => prev.map(a => 
      a.id === updatedActuator.id ? updatedActuator : a
    ));
    setLastSync(new Date());
  }, []);

  // Emergency stop - send OFF command to all actuators
  const handleEmergencyStop = async () => {
    setEmergencyLoading(true);
    setEmergencyStop(true);
    
    try {
      // Send OFF command to all actuators in parallel
      await Promise.all(
        actuators.map(actuator => 
          apiService.sendActuatorCommand(actuator.id, { command: 'off' })
            .catch(err => console.error(`Failed to stop ${actuator.name}:`, err))
        )
      );
      // Refresh actuator states
      await fetchActuators();
    } catch (err) {
      console.error('Emergency stop failed:', err);
    } finally {
      setEmergencyLoading(false);
    }
  };

  // Reset system after emergency stop
  const handleResetSystem = () => {
    setEmergencyStop(false);
    fetchActuators();
  };

  // Trigger device discovery scan
  const handleScanDevices = async () => {
    setScanning(true);
    setScanMessage(null);
    
    try {
      const response = await apiService.triggerDiscovery(selectedBaseboard);
      setScanMessage({ type: 'success', text: response.data.message || 'Scan initiated!' });
      
      // Refresh actuators after a short delay to pick up new devices
      setTimeout(() => {
        fetchActuators();
        setScanMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to trigger discovery:', err);
      setScanMessage({ type: 'error', text: 'Failed to start scan' });
    } finally {
      setScanning(false);
    }
  };

  // Calculate stats
  const activeActuators = actuators.filter(a => 
    a.status === 'on' || a.status === 'running' || a.status === 'holding'
  ).length;
  
  const totalActuators = actuators.length;

  // Format last sync time
  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    const diffMs = Date.now() - lastSync.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    return `${Math.floor(diffSecs / 60)}m ago`;
  };

  // Group actuators by type for organized display
  const getActuatorTypeLabel = (type) => {
    const labels = {
      led: '💡 LED',
      pwm: '⚡ PWM',
      relay: '🔌 Relay',
      servo: '🎯 Servo',
      motor: '⚙️ Motor',
      linear: '↕️ Linear',
      solenoid: '🔒 Solenoid',
      buzzer: '🔊 Buzzer',
      display: '📺 Display',
      custom: '🔧 Custom',
    };
    return labels[type] || type;
  };

  if (loading && actuators.length === 0) {
    return (
      <div className="actuator-control">
        <div className="actuator-container">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading actuators...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="actuator-control">
      <div className="actuator-container">
        {/* Header */}
        <header className="actuator-header">
          <div className="actuator-header-left">
            <h1 className="actuator-title">Actuator Control</h1>
            <p className="actuator-subtitle">
              Direct control interface for connected actuators
              {actuators.length > 0 && ` • ${actuators.length} device${actuators.length !== 1 ? 's' : ''} registered`}
            </p>
          </div>
          <div className="actuator-header-right">
            <Button 
              variant="secondary" 
              icon={<SearchIcon />} 
              onClick={handleScanDevices}
              disabled={scanning}
            >
              {scanning ? 'Scanning...' : 'Scan for Devices'}
            </Button>
            <Button 
              variant="secondary" 
              icon={<RefreshIcon />} 
              onClick={fetchActuators}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <div className="baseboard-selector">
              <span className="baseboard-label">Target Baseboard</span>
              <button className="baseboard-select">
                <span className="baseboard-indicator" />
                <span className="baseboard-name">{selectedBaseboard}</span>
                <ChevronDownIcon />
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={fetchActuators}>Retry</button>
          </div>
        )}

        {scanMessage && (
          <div className={`scan-message scan-message--${scanMessage.type}`}>
            {scanMessage.type === 'success' ? '✓' : '✗'} {scanMessage.text}
          </div>
        )}

        {/* Status Cards */}
        <div className="status-cards-row">
          <StatusCard
            title="Command Link"
            value={error ? "Error" : "Connected"}
            icon={<WifiIcon />}
            status={error ? "error" : "success"}
            badge={{ text: error ? 'Offline' : 'Live', variant: error ? 'error' : 'success' }}
          />
          <StatusCard
            title="Control Mode"
            value={emergencyStop ? "E-Stop Active" : "Manual Override"}
            icon={<SettingsIcon />}
            status={emergencyStop ? "error" : "default"}
          />
          <StatusCard
            title="Active Actuators"
            value={`${activeActuators}`}
            subtitle={`of ${totalActuators}`}
            icon={<ZapIcon />}
            status={activeActuators > 0 ? "success" : "default"}
          />
          <StatusCard
            title="Last Sync"
            value={formatLastSync()}
            icon={<ActivityIcon />}
          />
        </div>

        {/* Emergency Stop */}
        <div className="emergency-section">
          <Button 
            variant="danger" 
            size="large"
            onClick={handleEmergencyStop}
            disabled={emergencyStop || emergencyLoading || actuators.length === 0}
          >
            🛑 {emergencyLoading ? 'STOPPING...' : emergencyStop ? 'EMERGENCY STOP ACTIVATED' : 'EMERGENCY STOP ALL'}
          </Button>
          {emergencyStop && (
            <Button 
              variant="secondary" 
              size="small"
              onClick={handleResetSystem}
            >
              Reset System
            </Button>
          )}
        </div>

        {/* Actuator Grid */}
        {actuators.length === 0 ? (
          <div className="empty-state">
            <ZapIcon />
            <h3>No actuators registered</h3>
            <p>Add actuators via the Devices page or Django admin to control them here.</p>
            <p className="hint">
              Each actuator type (LED, PWM, Relay, Servo, etc.) gets its own control interface.
            </p>
          </div>
        ) : (
          <div className="actuator-grid">
            {actuators.map((actuator) => (
              <ActuatorCard
                key={actuator.id}
                id={actuator.id}
                name={actuator.name}
                actuatorId={actuator.actuator_id || `${getActuatorTypeLabel(actuator.actuator_type)} @ ${actuator.i2c_address || 'N/A'}`}
                type={actuator.actuator_type}
                status={emergencyStop && actuator.status !== 'disconnected' && actuator.status !== 'error' ? 'off' : actuator.status}
                currentValue={actuator.current_value}
                minValue={actuator.min_value || 0}
                maxValue={actuator.max_value || 100}
                unit={actuator.unit || '%'}
                i2cAddress={actuator.i2c_address}
                lastCommand={actuator.last_command || 'No commands yet'}
                lastCommandLatency={actuator.last_command_latency}
                onStatusChange={handleActuatorStatusChange}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="actuator-footer">
          <div className="footer-left">
            <RefreshIcon />
            <span className="footer-text">Last Sync:</span>
            <span className="footer-value">{formatLastSync()}</span>
          </div>
          <div className="footer-right">
            <span className="footer-status">
              <span className={`status-dot status-dot--${emergencyStop ? 'error' : activeActuators > 0 ? 'success' : 'warning'}`} />
              <span>
                {emergencyStop ? 'Emergency Stop Active' : 
                 activeActuators > 0 ? `${activeActuators} Active` : 'All Idle'}
              </span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ActuatorControl;
