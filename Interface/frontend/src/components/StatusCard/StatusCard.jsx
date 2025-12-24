import './StatusCard.css';

const StatusCard = ({
  title,
  value,
  subtitle,
  status = 'default', // 'default' | 'success' | 'warning' | 'error'
  badge,
  icon,
  accentColor,
  className = '',
}) => {
  return (
    <div className={`status-card status-card--${status} ${className}`}>
      {accentColor && (
        <div 
          className="status-card-accent" 
          style={{ backgroundColor: accentColor }}
        />
      )}
      
      <div className="status-card-header">
        <span className="status-card-title">{title}</span>
        {badge && (
          <span className={`status-card-badge status-card-badge--${badge.variant || 'default'}`}>
            {badge.text}
          </span>
        )}
      </div>
      
      <div className="status-card-content">
        {icon && <span className="status-card-icon">{icon}</span>}
        <div className="status-card-value-container">
          <span className="status-card-value">{value}</span>
          {subtitle && <span className="status-card-subtitle">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatusCard;

