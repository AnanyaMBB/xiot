import './Input.css';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon,
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || name;
  
  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className={`input-container ${error ? 'input-container--error' : ''} ${disabled ? 'input-container--disabled' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="input-field"
          {...props}
        />
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;

