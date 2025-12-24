import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ActuatorControl from './pages/ActuatorControl/ActuatorControl';
import BaseboardManagement from './pages/BaseboardManagement/BaseboardManagement';
import SensorAnalysis from './pages/SensorAnalysis/SensorAnalysis';
import Notifications from './pages/Notifications/Notifications';
import EventConfig from './pages/EventConfig/EventConfig';
import ScenarioConfig from './pages/ScenarioConfig/ScenarioConfig';
import SystemLogs from './pages/SystemLogs/SystemLogs';
import Sidebar from './components/Sidebar/Sidebar';
import './styles/global.css';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Layout with Sidebar
const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// App Routes
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/control"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ActuatorControl />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/devices"
        element={
          <ProtectedRoute>
            <AppLayout>
              <BaseboardManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/data"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SensorAnalysis />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Notifications />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EventConfig />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/scenarios"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ScenarioConfig />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SystemLogs />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
