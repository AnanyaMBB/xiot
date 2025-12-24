import './SensorCard.css';

const SensorCard = ({
  name,
  adapterId,
  value,
  unit,
  status = 'active', // 'active' | 'warning' | 'critical' | 'offline'
  timestamp,
  rateOfChange,
  sparklineData,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { label: 'Active', variant: 'success' };
      case 'warning':
        return { label: 'Warn', variant: 'warning' };
      case 'critical':
        return { label: 'Critical', variant: 'error' };
      case 'offline':
        return { label: 'Offline', variant: 'default' };
      default:
        return { label: status, variant: 'default' };
    }
  };

  const statusConfig = getStatusConfig();
  
  const getRateColor = () => {
    if (!rateOfChange) return 'neutral';
    if (rateOfChange.startsWith('+')) return 'positive';
    if (rateOfChange.startsWith('-') && status === 'warning') return 'warning';
    if (rateOfChange.startsWith('-') && status === 'critical') return 'negative';
    return 'neutral';
  };

  return (
    <div className={`sensor-card sensor-card--${status} ${className}`}>
      {(status === 'warning' || status === 'critical') && (
        <div className={`sensor-card-accent sensor-card-accent--${status}`} />
      )}
      
      <div className="sensor-card-header">
        <div className="sensor-card-info">
          <h3 className="sensor-card-name">{name}</h3>
          <span className="sensor-card-adapter">{adapterId}</span>
        </div>
        <span className={`sensor-card-status sensor-card-status--${statusConfig.variant}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="sensor-card-value-section">
        <span className={`sensor-card-value sensor-card-value--${status}`}>
          {value}
        </span>
        <span className="sensor-card-unit">{unit}</span>
      </div>

      {sparklineData && (
        <div className="sensor-card-chart">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="sparkline">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points={sparklineData}
            />
          </svg>
        </div>
      )}

      <div className={`sensor-card-footer sensor-card-footer--${status}`}>
        <span className="sensor-card-timestamp">{timestamp}</span>
        {rateOfChange && (
          <span className={`sensor-card-rate sensor-card-rate--${getRateColor()}`}>
            {rateOfChange}
          </span>
        )}
      </div>
    </div>
  );
};

export default SensorCard;

