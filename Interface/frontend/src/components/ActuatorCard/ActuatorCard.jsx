import { useState, useCallback } from 'react';
import Button from '../Button/Button';
import { apiService } from '../../services/api';
import './ActuatorCard.css';

const ActuatorCard = ({
  id,  // Database ID for API calls
  name,
  actuatorId,
  type = 'pwm', // 'led' | 'pwm' | 'relay' | 'servo' | 'motor' | 'linear' | 'solenoid' | 'buzzer'
  status = 'off', // 'on' | 'off' | 'running' | 'stopped' | 'idle' | 'holding' | 'locked' | 'disconnected'
  currentValue,
  minValue = 0,
  maxValue = 100,
  unit = '%',
  i2cAddress,
  lastCommand,
  lastCommandLatency,
  onValueChange,
  onToggle,
  onStatusChange,  // Callback to update parent state
  className = '',
}) => {
  const [localValue, setLocalValue] = useState(currentValue || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Send command to actuator via API
  const sendCommand = useCallback(async (command, value = null) => {
    if (!id) {
      console.error('Actuator ID is required for API calls');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.sendActuatorCommand(id, { command, value });
      console.log(`[Actuator] Command sent: ${command}`, response.data);
      
      // Update local status based on response
      if (onStatusChange && response.data?.actuator) {
        onStatusChange(response.data.actuator);
      }
    } catch (err) {
      console.error('[Actuator] Command failed:', err);
      setError(err.message || 'Command failed');
    } finally {
      setIsLoading(false);
    }
  }, [id, onStatusChange]);

  const getStatusConfig = () => {
    switch (status) {
      case 'on':
        return { label: 'ON', variant: 'success' };
      case 'running':
        return { label: 'Running', variant: 'success' };
      case 'holding':
        return { label: 'Holding', variant: 'success' };
      case 'off':
      case 'stopped':
      case 'idle':
        return { label: status.charAt(0).toUpperCase() + status.slice(1), variant: 'default' };
      case 'locked':
        return { label: 'Locked', variant: 'error', icon: true };
      case 'disconnected':
      case 'error':
        return { label: status.charAt(0).toUpperCase() + status.slice(1), variant: 'error' };
      default:
        return { label: status, variant: 'default' };
    }
  };

  const statusConfig = getStatusConfig();

  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    setLocalValue(value);
  };

  const handleSliderRelease = () => {
    // Send command when slider is released
    sendCommand('set', localValue);
    onValueChange?.(localValue);
  };

  const handleToggle = () => {
    const newState = status === 'on' ? 'off' : 'on';
    sendCommand(newState);
    onToggle?.(!currentValue);
  };

  const isOn = status === 'on' || status === 'running';

  const renderControl = () => {
    switch (type) {
      // LED and Buzzer: Simple ON/OFF toggle
      case 'led':
      case 'buzzer':
        return (
          <div className="actuator-toggle-control">
            <div 
              className={`actuator-toggle ${isOn ? 'actuator-toggle--on' : ''} ${isLoading ? 'actuator-toggle--loading' : ''}`}
              onClick={!isLoading ? handleToggle : undefined}
            >
              <div className="actuator-toggle-track" />
              <div className="actuator-toggle-thumb">
                {isLoading && <span className="actuator-loading-spinner" />}
              </div>
            </div>
            <span className="actuator-toggle-label">
              {type === 'led' ? (isOn ? '💡 Light ON' : '🔌 Light OFF') : 
                               (isOn ? '🔊 Sound ON' : '🔇 Sound OFF')}
            </span>
            {i2cAddress && (
              <span className="actuator-address">I2C: {i2cAddress}</span>
            )}
            {error && <span className="actuator-error">{error}</span>}
          </div>
        );

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
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="actuator-slider"
                disabled={isLoading}
              />
            </div>
            <div className="actuator-slider-labels">
              <span>{minValue}{unit}</span>
              <span>{Math.round((maxValue - minValue) / 2)}{unit}</span>
              <span>{maxValue}{unit}</span>
            </div>
            {error && <span className="actuator-error">{error}</span>}
          </div>
        );

      case 'relay':
        return (
          <div className="actuator-toggle-control">
            <div 
              className={`actuator-toggle ${isOn ? 'actuator-toggle--on' : ''} ${isLoading ? 'actuator-toggle--loading' : ''}`}
              onClick={!isLoading ? handleToggle : undefined}
            >
              <div className="actuator-toggle-track" />
              <div className="actuator-toggle-thumb">
                {isLoading && <span className="actuator-loading-spinner" />}
              </div>
            </div>
            <span className="actuator-toggle-label">
              {isOn ? '⚡ Relay CLOSED' : '🔌 Relay OPEN'}
            </span>
            {error && <span className="actuator-error">{error}</span>}
          </div>
        );

      case 'motor':
        return (
          <div className="actuator-motor-control">
            <div className="actuator-motor-buttons">
              <Button 
                variant="danger" 
                size="small" 
                onClick={() => sendCommand('off')}
                disabled={isLoading}
              >
                Stop
              </Button>
              <Button 
                variant="success" 
                size="small" 
                onClick={() => sendCommand('on')}
                disabled={isLoading}
              >
                Start
              </Button>
            </div>
            <div className="actuator-motor-rpm">
              <span className="actuator-control-label">RPM Setpoint</span>
              <span className="actuator-rpm-value">{currentValue || 0}</span>
            </div>
            {error && <span className="actuator-error">{error}</span>}
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
              <Button variant="secondary" onClick={() => sendCommand('off')} disabled={isLoading}>
                <span>↓</span>
                <span>Retract</span>
              </Button>
              <Button variant="secondary" onClick={() => sendCommand('on')} disabled={isLoading}>
                <span>↑</span>
                <span>Extend</span>
              </Button>
            </div>
            {error && <span className="actuator-error">{error}</span>}
          </div>
        );

      case 'solenoid':
        return (
          <div className="actuator-solenoid-control">
            <Button 
              variant="secondary" 
              fullWidth 
              disabled={status === 'locked' || isLoading}
              onClick={handleToggle}
            >
              🔓 {isOn ? 'Lock' : 'Unlock'} Zone B
            </Button>
            <p className="actuator-solenoid-note">
              Requires supervisor authorization for unlocking during operation.
            </p>
            {error && <span className="actuator-error">{error}</span>}
          </div>
        );

      default:
        return (
          <div className="actuator-toggle-control">
            <Button 
              variant={isOn ? 'danger' : 'success'}
              onClick={handleToggle}
              disabled={isLoading}
            >
              {isOn ? 'Turn OFF' : 'Turn ON'}
            </Button>
            {error && <span className="actuator-error">{error}</span>}
          </div>
        );
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

