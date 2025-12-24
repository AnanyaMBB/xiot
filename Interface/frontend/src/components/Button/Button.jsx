import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'right',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const classNames = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    disabled && 'btn--disabled',
    loading && 'btn--loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {icon && iconPosition === 'left' && <span className="btn-icon btn-icon--left">{icon}</span>}
      <span className="btn-text">{children}</span>
      {icon && iconPosition === 'right' && <span className="btn-icon btn-icon--right">{icon}</span>}
    </button>
  );
};

export default Button;

