import { useState, useEffect } from 'react';
import StatusCard from '../../components/StatusCard/StatusCard';
import ActuatorCard from '../../components/ActuatorCard/ActuatorCard';
import Button from '../../components/Button/Button';
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

const ChevronDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Mock data
const mockActuators = [
  {
    id: 1,
    name: 'Fan Controller',
    actuatorId: 'ACT:01',
    type: 'pwm',
    status: 'running',
    currentValue: 65,
    minValue: 0,
    maxValue: 100,
    unit: '%',
    lastCommand: 'SET 65%',
    lastCommandLatency: 12,
  },
  {
    id: 2,
    name: 'Relay Bank A',
    actuatorId: 'ACT:02',
    type: 'relay',
    status: 'running',
    currentValue: true,
    lastCommand: 'CLOSE',
    lastCommandLatency: 8,
  },
  {
    id: 3,
    name: 'Camera Mount',
    actuatorId: 'ACT:03',
    type: 'servo',
    status: 'holding',
    currentValue: 90,
    minValue: 0,
    maxValue: 180,
    unit: '°',
    lastCommand: 'ANGLE 90°',
    lastCommandLatency: 15,
  },
  {
    id: 4,
    name: 'Belt Driver',
    actuatorId: 'ACT:04',
    type: 'motor',
    status: 'stopped',
    currentValue: 0,
    lastCommand: 'STOP',
    lastCommandLatency: 10,
  },
  {
    id: 5,
    name: 'Lift Mechanism',
    actuatorId: 'ACT:05',
    type: 'linear',
    status: 'idle',
    currentValue: 45,
    unit: 'mm',
    lastCommand: 'RETRACT 20mm',
    lastCommandLatency: 55,
  },
  {
    id: 6,
    name: 'Door Lock',
    actuatorId: 'ACT:06',
    type: 'solenoid',
    status: 'locked',
    currentValue: false,
    lastCommand: 'LOCK',
    lastCommandLatency: 5,
  },
  {
    id: 7,
    name: 'Backup Motor',
    actuatorId: 'ACT:07',
    type: 'motor',
    status: 'disconnected',
    currentValue: 0,
    lastCommand: '3 minutes ago',
    lastCommandLatency: null,
  },
];

const ActuatorControl = () => {
  const [selectedBaseboard, setSelectedBaseboard] = useState('MKR-1000-MAIN');
  const [actuators, setActuators] = useState(mockActuators);
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [systemMode, setSystemMode] = useState('Manual Override');

  const handleValueChange = (id, value) => {
    setActuators(prev => prev.map(act => 
      act.id === id ? { ...act, currentValue: value } : act
    ));
  };

  const handleToggle = (id, state) => {
    setActuators(prev => prev.map(act => 
      act.id === id ? { ...act, currentValue: state, status: state ? 'running' : 'stopped' } : act
    ));
  };

  const handleEmergencyStop = () => {
    setEmergencyStop(true);
    setActuators(prev => prev.map(act => ({
      ...act,
      status: act.type === 'solenoid' ? 'locked' : 'stopped',
      currentValue: act.type === 'relay' ? false : 0,
    })));
  };

  const activeActuators = actuators.filter(a => a.status === 'running' || a.status === 'holding').length;
  const runningMotors = actuators.filter(a => a.type === 'motor' && a.status === 'running').length;

  return (
    <div className="actuator-control">
      <div className="actuator-container">
        {/* Header */}
        <header className="actuator-header">
          <div className="actuator-header-left">
            <h1 className="actuator-title">Actuator Control</h1>
            <p className="actuator-subtitle">Direct control interface for connected actuators</p>
          </div>
          <div className="actuator-header-right">
            <span className="baseboard-label">Target Baseboard</span>
            <button className="baseboard-select">
              <span className="baseboard-indicator" />
              <span className="baseboard-name">{selectedBaseboard}</span>
              <ChevronDownIcon />
            </button>
          </div>
        </header>

        {/* Status Cards */}
        <div className="status-cards-row">
          <StatusCard
            title="Command Link"
            value="Connected"
            icon={<WifiIcon />}
            status="success"
            badge={{ text: '8ms', variant: 'success' }}
          />
          <StatusCard
            title="Control Mode"
            value={systemMode}
            icon={<SettingsIcon />}
          />
          <StatusCard
            title="Active Actuators"
            value={`${activeActuators}`}
            subtitle={`of ${actuators.length}`}
            icon={<ZapIcon />}
          />
          <StatusCard
            title="Motors Running"
            value={`${runningMotors}`}
            subtitle="total"
            icon={<ActivityIcon />}
          />
        </div>

        {/* Emergency Stop */}
        <div className="emergency-section">
          <Button 
            variant="danger" 
            size="large"
            onClick={handleEmergencyStop}
            disabled={emergencyStop}
          >
            🛑 {emergencyStop ? 'EMERGENCY STOP ACTIVATED' : 'EMERGENCY STOP ALL'}
          </Button>
          {emergencyStop && (
            <Button 
              variant="secondary" 
              size="small"
              onClick={() => setEmergencyStop(false)}
            >
              Reset System
            </Button>
          )}
        </div>

        {/* Actuator Grid */}
        <div className="actuator-grid">
          {actuators.map((actuator) => (
            <ActuatorCard
              key={actuator.id}
              name={actuator.name}
              actuatorId={actuator.actuatorId}
              type={actuator.type}
              status={emergencyStop && actuator.status !== 'disconnected' ? 'stopped' : actuator.status}
              currentValue={actuator.currentValue}
              minValue={actuator.minValue}
              maxValue={actuator.maxValue}
              unit={actuator.unit}
              lastCommand={actuator.lastCommand}
              lastCommandLatency={actuator.lastCommandLatency}
              onValueChange={(value) => handleValueChange(actuator.id, value)}
              onToggle={(state) => handleToggle(actuator.id, state)}
            />
          ))}
        </div>

        {/* Footer */}
        <footer className="actuator-footer">
          <div className="footer-left">
            <span className="footer-text">Last Sync:</span>
            <span className="footer-value">0.5s ago</span>
          </div>
          <div className="footer-right">
            <span className="footer-status">
              <span className="status-dot status-dot--warning" />
              <span>Manual Override Active</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ActuatorControl;

