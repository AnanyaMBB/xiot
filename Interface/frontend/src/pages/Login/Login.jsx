import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import './Login.css';

// Icons
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const LogoIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-gradient" />
        <div className="login-grid" />
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-card-content">
            <div className="login-header">
              <div className="login-logo">
                <LogoIcon />
              </div>
              <h1 className="login-title">IoT Monitoring System</h1>
              <p className="login-subtitle">Secure access to monitoring and control</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <Input
                label="Identity"
                type="text"
                name="username"
                placeholder="Operator ID or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={<UserIcon />}
                required
              />

              <Input
                label="Credentials"
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<LockIcon />}
                required
              />

              <div className="login-options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="login-forgot">Forgot password?</a>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                icon={<ArrowRightIcon />}
              >
                Sign In
              </Button>
            </form>
          </div>

          <div className="login-card-accent">
            <div className="login-accent-segment login-accent-1" />
            <div className="login-accent-segment login-accent-2" />
            <div className="login-accent-segment login-accent-3" />
          </div>
        </div>

        <div className="login-footer">
          <div className="login-footer-icons">
            <span className="login-footer-icon">🔒</span>
            <span className="login-footer-icon">🖥️</span>
          </div>
          <p className="login-footer-text">Restricted Access • Authorized Personnel Only</p>
          <p className="login-footer-version">System v3.4.1-rc2</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

