import { useState } from 'react';
import Button from '../Button/Button';
import './ActuatorCard.css';

const ActuatorCard = ({
  name,
  actuatorId,
  type = 'pwm', // 'pwm' | 'relay' | 'servo' | 'motor' | 'linear' | 'solenoid'
  status = 'idle', // 'running' | 'stopped' | 'idle' | 'holding' | 'locked' | 'disconnected'
  currentValue,
  minValue = 0,
  maxValue = 100,
  unit = '%',
  lastCommand,
  lastCommandLatency,
  onValueChange,
  onToggle,
  className = '',
}) => {
  const [localValue, setLocalValue] = useState(currentValue || 0);

  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return { label: 'Running', variant: 'success' };
      case 'holding':
        return { label: 'Holding', variant: 'success' };
      case 'stopped':
      case 'idle':
        return { label: status.charAt(0).toUpperCase() + status.slice(1), variant: 'default' };
      case 'locked':
        return { label: 'Locked', variant: 'error', icon: true };
      case 'disconnected':
        return { label: 'Disconnected', variant: 'default' };
      default:
        return { label: status, variant: 'default' };
    }
  };

  const statusConfig = getStatusConfig();

  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    setLocalValue(value);
    onValueChange?.(value);
  };

  const renderControl = () => {
    switch (type) {
      case 'pwm':
      case 'servo':
        return (
          <div className="actuator-slider-control">
            <div className="actuator-slider-header">
              <span className="actuator-control-label">
                {type === 'pwm' ? 'Speed Control' : 'Angle Position'}
              </span>
              <div className="actuator-slider-value">
                <span className="actuator-value-number">{localValue}</span>
                <span className="actuator-value-unit">{unit}</span>
              </div>
            </div>
            <div className="actuator-slider-container">
              <input
                type="range"
                min={minValue}
                max={maxValue}
                value={localValue}
                onChange={handleSliderChange}
                className="actuator-slider"
              />
            </div>
            <div className="actuator-slider-labels">
              <span>{minValue}{unit}</span>
              <span>{Math.round((maxValue - minValue) / 2)}{unit}</span>
              <span>{maxValue}{unit}</span>
            </div>
          </div>
        );

      case 'relay':
        return (
          <div className="actuator-toggle-control">
            <div 
              className={`actuator-toggle ${status === 'running' || currentValue ? 'actuator-toggle--on' : ''}`}
              onClick={() => onToggle?.(!currentValue)}
            >
              <div className="actuator-toggle-track" />
              <div className="actuator-toggle-thumb" />
            </div>
            <span className="actuator-toggle-label">
              {currentValue ? 'Toggle to Close' : 'Toggle to Open'}
            </span>
          </div>
        );

      case 'motor':
        return (
          <div className="actuator-motor-control">
            <div className="actuator-motor-buttons">
              <Button variant="danger" size="small" onClick={() => onToggle?.(false)}>
                Stop
              </Button>
              <Button variant="success" size="small" onClick={() => onToggle?.(true)}>
                Start
              </Button>
            </div>
            <div className="actuator-motor-rpm">
              <span className="actuator-control-label">RPM Setpoint</span>
              <span className="actuator-rpm-value">{currentValue || 0}</span>
            </div>
          </div>
        );

      case 'linear':
        return (
          <div className="actuator-linear-control">
            <div className="actuator-linear-header">
              <span className="actuator-control-label">Manual Control</span>
              <span className="actuator-position">Pos: {currentValue || 0}mm</span>
            </div>
            <div className="actuator-linear-buttons">
              <Button variant="secondary" onClick={() => onValueChange?.('retract')}>
                <span>↓</span>
                <span>Retract</span>
              </Button>
              <Button variant="secondary" onClick={() => onValueChange?.('extend')}>
                <span>↑</span>
                <span>Extend</span>
              </Button>
            </div>
          </div>
        );

      case 'solenoid':
        return (
          <div className="actuator-solenoid-control">
            <Button 
              variant="secondary" 
              fullWidth 
              disabled={status === 'locked'}
              onClick={() => onToggle?.(!currentValue)}
            >
              🔓 Unlock Zone B
            </Button>
            <p className="actuator-solenoid-note">
              Requires supervisor authorization for unlocking during operation.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`actuator-card actuator-card--${status} ${className}`}>
      {status === 'running' && type === 'relay' && (
        <div className="actuator-card-accent" />
      )}

      <div className="actuator-card-header">
        <div className="actuator-card-info">
          <h3 className="actuator-card-name">{name}</h3>
          <span className="actuator-card-id">{actuatorId} ({type.toUpperCase()})</span>
        </div>
        <span className={`actuator-card-status actuator-card-status--${statusConfig.variant}`}>
          {statusConfig.icon && '🔒 '}
          {statusConfig.label}
        </span>
      </div>

      <div className="actuator-card-content">
        {status !== 'disconnected' ? (
          renderControl()
        ) : (
          <div className="actuator-offline">
            <span className="actuator-offline-icon">📡</span>
            <span className="actuator-offline-text">Device unreachable</span>
          </div>
        )}
      </div>

      <div className="actuator-card-footer">
        <span className="actuator-footer-label">
          {status === 'disconnected' ? 'Last Seen' : 'Last Cmd'}
        </span>
        <span className="actuator-footer-value">
          {lastCommand}
          {lastCommandLatency && ` (${lastCommandLatency}ms)`}
        </span>
      </div>
    </div>
  );
};

export default ActuatorCard;

