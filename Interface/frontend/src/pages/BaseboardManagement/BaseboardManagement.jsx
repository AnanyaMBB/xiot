import { useState, useEffect, useCallback } from 'react';
import StatusCard from '../../components/StatusCard/StatusCard';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import { apiService } from '../../services/api';
import './BaseboardManagement.css';

// Icons
const WifiIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" />
  </svg>
);

const BoxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SensorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ActuatorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const BaseboardCard = ({ baseboard, onEdit, onDelete, onExpand, isExpanded }) => {
  const getStatusConfig = () => {
    switch (baseboard.status) {
      case 'online':
        return { label: 'Online', variant: 'success' };
      case 'warning':
        return { label: 'Degraded', variant: 'warning' };
      case 'offline':
        return { label: 'Offline', variant: 'error' };
      default:
        return { label: baseboard.status, variant: 'default' };
    }
  };

  const statusConfig = getStatusConfig();
  const sensorCount = baseboard.sensors?.length || 0;
  const actuatorCount = baseboard.actuators?.length || 0;

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className={`baseboard-card baseboard-card--${baseboard.status}`}>
      {baseboard.status === 'warning' && <div className="baseboard-card-accent baseboard-card-accent--warning" />}
      
      <div className="baseboard-card-header">
        <div className="baseboard-card-info">
          <h3 className="baseboard-card-name">{baseboard.name}</h3>
          <span className="baseboard-card-id">{baseboard.identifier}</span>
        </div>
        <div className="baseboard-card-actions">
          <span className={`baseboard-status baseboard-status--${statusConfig.variant}`}>
            {statusConfig.label}
          </span>
          <button className="baseboard-action-btn" onClick={() => onEdit(baseboard)} title="Edit">
            <EditIcon />
          </button>
          <button className="baseboard-action-btn baseboard-action-btn--danger" onClick={() => onDelete(baseboard)} title="Delete">
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="baseboard-card-body">
        <div className="baseboard-stats">
          <div className="baseboard-stat">
            <span className="stat-icon">📍</span>
            <span className="stat-value">{baseboard.ip_address || 'Not set'}</span>
          </div>
          <div className="baseboard-stat">
            <span className="stat-icon">📡</span>
            <span className="stat-value">{baseboard.mqtt_topic || 'N/A'}</span>
          </div>
        </div>

        <div className="baseboard-metrics">
          <div className="metric">
            <span className="metric-value">{sensorCount}</span>
            <span className="metric-label">Sensors</span>
          </div>
          <div className="metric">
            <span className="metric-value">{actuatorCount}</span>
            <span className="metric-label">Actuators</span>
          </div>
          <div className="metric">
            <span className="metric-value">{baseboard.uptime || '--'}</span>
            <span className="metric-label">Uptime</span>
          </div>
        </div>

        {baseboard.description && (
          <div className="baseboard-description">
            {baseboard.description}
          </div>
        )}

        {/* Expandable Sensors/Actuators Section */}
        <button className="baseboard-expand-btn" onClick={() => onExpand(baseboard.id)}>
          <span>View Devices ({sensorCount + actuatorCount})</span>
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
            <ExpandIcon />
          </span>
        </button>

        {isExpanded && (
          <div className="baseboard-devices">
            {baseboard.sensors && baseboard.sensors.length > 0 && (
              <div className="device-section">
                <h4 className="device-section-title">
                  <SensorIcon /> Sensors
                </h4>
                <div className="device-list">
                  {baseboard.sensors.map((sensor) => (
                    <div key={sensor.id} className={`device-item device-item--${sensor.status}`}>
                      <span className="device-name">{sensor.name}</span>
                      <span className="device-type">{sensor.sensor_type}</span>
                      <span className="device-value">
                        {sensor.current_value !== null ? `${sensor.current_value}${sensor.unit}` : '--'}
                      </span>
                      <span className={`device-status device-status--${sensor.status}`}>
                        {sensor.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {baseboard.actuators && baseboard.actuators.length > 0 && (
              <div className="device-section">
                <h4 className="device-section-title">
                  <ActuatorIcon /> Actuators
                </h4>
                <div className="device-list">
                  {baseboard.actuators.map((actuator) => (
                    <div key={actuator.id} className={`device-item device-item--${actuator.status}`}>
                      <span className="device-name">{actuator.name}</span>
                      <span className="device-type">{actuator.actuator_type}</span>
                      <span className="device-value">
                        {actuator.current_value !== null ? `${actuator.current_value}${actuator.unit}` : '--'}
                      </span>
                      <span className={`device-status device-status--${actuator.status}`}>
                        {actuator.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sensorCount === 0 && actuatorCount === 0 && (
              <div className="no-devices">No devices connected to this baseboard</div>
            )}
          </div>
        )}
      </div>

      <div className="baseboard-card-footer">
        <span className="last-seen-label">Last seen:</span>
        <span className="last-seen-value">{formatLastSeen(baseboard.last_seen)}</span>
      </div>
    </div>
  );
};

const BaseboardManagement = () => {
  const [baseboards, setBaseboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBaseboard, setEditingBaseboard] = useState(null);
  const [deletingBaseboard, setDeletingBaseboard] = useState(null);
  const [expandedBoards, setExpandedBoards] = useState(new Set());
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    ip_address: '',
    mqtt_topic: '',
    description: '',
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchBaseboards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getBaseboards();
      setBaseboards(response.data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch baseboards:', err);
      setError('Failed to load baseboards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBaseboards();
  }, [fetchBaseboards]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchBaseboards, 30000);
    return () => clearInterval(interval);
  }, [fetchBaseboards]);

  const onlineCount = baseboards.filter(b => b.status === 'online').length;
  const warningCount = baseboards.filter(b => b.status === 'warning').length;
  const totalSensors = baseboards.reduce((acc, b) => acc + (b.sensors?.length || 0), 0);
  const totalActuators = baseboards.reduce((acc, b) => acc + (b.actuators?.length || 0), 0);

  const handleOpenAddModal = () => {
    setEditingBaseboard(null);
    setFormData({
      name: '',
      identifier: '',
      ip_address: '',
      mqtt_topic: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (baseboard) => {
    setEditingBaseboard(baseboard);
    setFormData({
      name: baseboard.name,
      identifier: baseboard.identifier,
      ip_address: baseboard.ip_address || '',
      mqtt_topic: baseboard.mqtt_topic || '',
      description: baseboard.description || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (baseboard) => {
    setDeletingBaseboard(baseboard);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingBaseboard) {
        await apiService.updateBaseboard(editingBaseboard.id, formData);
      } else {
        await apiService.createBaseboard(formData);
      }
      setIsModalOpen(false);
      fetchBaseboards();
    } catch (err) {
      console.error('Failed to save baseboard:', err);
      alert('Failed to save baseboard: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteBaseboard(deletingBaseboard.id);
      setIsDeleteModalOpen(false);
      setDeletingBaseboard(null);
      fetchBaseboards();
    } catch (err) {
      console.error('Failed to delete baseboard:', err);
      alert('Failed to delete baseboard: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleExpand = (boardId) => {
    setExpandedBoards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(boardId)) {
        newSet.delete(boardId);
      } else {
        newSet.add(boardId);
      }
      return newSet;
    });
  };

  const formatLastRefresh = () => {
    const diffMs = new Date() - lastRefresh;
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    return `${Math.floor(diffSecs / 60)} minutes ago`;
  };

  if (loading && baseboards.length === 0) {
    return (
      <div className="baseboard-management">
        <div className="baseboard-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading baseboards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="baseboard-management">
      <div className="baseboard-container">
        {/* Header */}
        <header className="baseboard-header">
          <div className="baseboard-header-left">
            <h1 className="baseboard-title">Device Management</h1>
            <p className="baseboard-subtitle">Monitor and configure connected baseboards, sensors, and actuators</p>
          </div>
          <div className="baseboard-header-right">
            <Button variant="secondary" icon={<RefreshIcon />} onClick={fetchBaseboards} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="primary" icon={<PlusIcon />} iconPosition="left" onClick={handleOpenAddModal}>
              Add Baseboard
            </Button>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={fetchBaseboards}>Retry</button>
          </div>
        )}

        {/* Status Cards */}
        <div className="status-cards-row">
          <StatusCard
            title="Total Baseboards"
            value={`${baseboards.length}`}
            subtitle="registered"
            icon={<BoxIcon />}
          />
          <StatusCard
            title="Online"
            value={`${onlineCount}`}
            subtitle="connected"
            icon={<WifiIcon />}
            status="success"
          />
          <StatusCard
            title="Warnings"
            value={`${warningCount}`}
            subtitle="issues"
            icon={<ActivityIcon />}
            status={warningCount > 0 ? 'warning' : 'default'}
          />
          <StatusCard
            title="Total Devices"
            value={`${totalSensors + totalActuators}`}
            subtitle={`${totalSensors}S / ${totalActuators}A`}
            icon={<ClockIcon />}
          />
        </div>

        {/* Baseboard Grid */}
        {baseboards.length === 0 ? (
          <div className="empty-state">
            <BoxIcon />
            <h3>No baseboards registered</h3>
            <p>Add your first baseboard to start monitoring your IoT devices.</p>
            <Button variant="primary" icon={<PlusIcon />} onClick={handleOpenAddModal}>
              Add Baseboard
            </Button>
          </div>
        ) : (
          <div className="baseboard-grid">
            {baseboards.map((baseboard) => (
              <BaseboardCard 
                key={baseboard.id} 
                baseboard={baseboard}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
                onExpand={handleExpand}
                isExpanded={expandedBoards.has(baseboard.id)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="baseboard-footer">
          <div className="footer-left">
            <RefreshIcon />
            <span className="footer-text">Last refresh:</span>
            <span className="footer-value">{formatLastRefresh()}</span>
          </div>
          <div className="footer-right">
            <span className="footer-status">
              <span className={`status-dot status-dot--${onlineCount > 0 ? 'success' : 'warning'}`} />
              <span>{onlineCount > 0 ? 'Devices Online' : 'No Devices Online'}</span>
            </span>
          </div>
        </footer>
      </div>

      {/* Add/Edit Baseboard Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBaseboard ? 'Edit Baseboard' : 'Add New Baseboard'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingBaseboard ? 'Save Changes' : 'Add Baseboard'}
            </Button>
          </>
        }
      >
        <div className="modal-form">
          <Input
            label="Baseboard Name"
            placeholder="e.g., Living Room Controller"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Identifier"
            placeholder="e.g., PI-001"
            value={formData.identifier}
            onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
            disabled={!!editingBaseboard}
          />
          <Input
            label="IP Address"
            placeholder="e.g., 192.168.1.50"
            value={formData.ip_address}
            onChange={(e) => setFormData(prev => ({ ...prev, ip_address: e.target.value }))}
          />
          <Input
            label="MQTT Topic"
            placeholder="e.g., xiot/PI-001"
            value={formData.mqtt_topic}
            onChange={(e) => setFormData(prev => ({ ...prev, mqtt_topic: e.target.value }))}
          />
          <Input
            label="Description"
            placeholder="Optional description..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Baseboard"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <div className="delete-confirmation">
          <p>Are you sure you want to delete <strong>{deletingBaseboard?.name}</strong>?</p>
          <p className="warning-text">
            This will also remove all associated sensors and actuators. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default BaseboardManagement;
