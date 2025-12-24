import { useState } from 'react';
import StatusCard from '../../components/StatusCard/StatusCard';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
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

const MoreVertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

// Mock data
const mockBaseboards = [
  {
    id: 1,
    name: 'MKR-1000-MAIN',
    identifier: 'MKR-001',
    status: 'online',
    ipAddress: '192.168.1.42',
    sensorCount: 8,
    actuatorCount: 4,
    uptime: '4d 12h 30m',
    lastSeen: 'now',
    features: ['I2C', 'Camera', 'Audio', 'Display'],
    signalStrength: -42,
    firmwareVersion: 'v2.1.3',
    model: 'Raspberry Pi 4B',
    zone: 'Zone A - Production',
  },
  {
    id: 2,
    name: 'SENSOR-HUB-02',
    identifier: 'HUB-002',
    status: 'online',
    ipAddress: '192.168.1.45',
    sensorCount: 12,
    actuatorCount: 2,
    uptime: '2d 8h 15m',
    lastSeen: 'now',
    features: ['I2C', 'Display'],
    signalStrength: -58,
    firmwareVersion: 'v2.0.8',
    model: 'Raspberry Pi 3B+',
    zone: 'Zone B - Storage',
  },
  {
    id: 3,
    name: 'CTRL-NODE-03',
    identifier: 'CTL-003',
    status: 'warning',
    ipAddress: '192.168.1.48',
    sensorCount: 4,
    actuatorCount: 6,
    uptime: '0d 2h 45m',
    lastSeen: '30s ago',
    features: ['I2C', 'Camera'],
    signalStrength: -75,
    firmwareVersion: 'v1.9.2',
    model: 'Raspberry Pi Zero W',
    zone: 'Zone C - Testing',
  },
  {
    id: 4,
    name: 'BACKUP-UNIT-04',
    identifier: 'BCK-004',
    status: 'offline',
    ipAddress: '192.168.1.52',
    sensorCount: 6,
    actuatorCount: 2,
    uptime: '--',
    lastSeen: '15m ago',
    features: ['I2C'],
    signalStrength: null,
    firmwareVersion: 'v2.1.0',
    model: 'Raspberry Pi 4B',
    zone: 'Zone D - Backup',
  },
];

const BaseboardCard = ({ baseboard, onEdit, onDelete }) => {
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
          <button className="baseboard-menu-btn">
            <MoreVertIcon />
          </button>
        </div>
      </div>

      <div className="baseboard-card-body">
        <div className="baseboard-stats">
          <div className="baseboard-stat">
            <span className="stat-icon">📍</span>
            <span className="stat-value">{baseboard.ipAddress}</span>
          </div>
          <div className="baseboard-stat">
            <span className="stat-icon">📡</span>
            <span className="stat-value">
              {baseboard.signalStrength ? `${baseboard.signalStrength} dBm` : '--'}
            </span>
          </div>
        </div>

        <div className="baseboard-metrics">
          <div className="metric">
            <span className="metric-value">{baseboard.sensorCount}</span>
            <span className="metric-label">Sensors</span>
          </div>
          <div className="metric">
            <span className="metric-value">{baseboard.actuatorCount}</span>
            <span className="metric-label">Actuators</span>
          </div>
          <div className="metric">
            <span className="metric-value">{baseboard.uptime}</span>
            <span className="metric-label">Uptime</span>
          </div>
        </div>

        <div className="baseboard-features">
          {baseboard.features.map((feature, index) => (
            <span key={index} className="feature-badge">{feature}</span>
          ))}
        </div>

        <div className="baseboard-meta">
          <span className="meta-item">
            <span className="meta-icon">🔧</span>
            {baseboard.model}
          </span>
          <span className="meta-item">
            <span className="meta-icon">📦</span>
            {baseboard.firmwareVersion}
          </span>
        </div>

        <div className="baseboard-zone">
          <span className="zone-label">{baseboard.zone}</span>
        </div>
      </div>

      <div className="baseboard-card-footer">
        <span className="last-seen-label">Last seen:</span>
        <span className="last-seen-value">{baseboard.lastSeen}</span>
      </div>
    </div>
  );
};

const BaseboardManagement = () => {
  const [baseboards, setBaseboards] = useState(mockBaseboards);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBaseboard, setNewBaseboard] = useState({
    name: '',
    identifier: '',
    ipAddress: '',
    zone: '',
  });

  const onlineCount = baseboards.filter(b => b.status === 'online').length;
  const warningCount = baseboards.filter(b => b.status === 'warning').length;
  const totalSensors = baseboards.reduce((acc, b) => acc + b.sensorCount, 0);
  const totalActuators = baseboards.reduce((acc, b) => acc + b.actuatorCount, 0);

  const handleAddBaseboard = () => {
    // In real app, this would call API
    setIsModalOpen(false);
    setNewBaseboard({ name: '', identifier: '', ipAddress: '', zone: '' });
  };

  const handleScanNetwork = () => {
    console.log('Scanning network for new devices...');
  };

  return (
    <div className="baseboard-management">
      <div className="baseboard-container">
        {/* Header */}
        <header className="baseboard-header">
          <div className="baseboard-header-left">
            <h1 className="baseboard-title">Baseboard Management</h1>
            <p className="baseboard-subtitle">Monitor and configure connected controller boards</p>
          </div>
          <div className="baseboard-header-right">
            <Button variant="secondary" icon={<RefreshIcon />} onClick={handleScanNetwork}>
              Scan Network
            </Button>
            <Button variant="primary" icon={<PlusIcon />} iconPosition="left" onClick={() => setIsModalOpen(true)}>
              Add Baseboard
            </Button>
          </div>
        </header>

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
        <div className="baseboard-grid">
          {baseboards.map((baseboard) => (
            <BaseboardCard key={baseboard.id} baseboard={baseboard} />
          ))}
        </div>

        {/* Footer */}
        <footer className="baseboard-footer">
          <div className="footer-left">
            <RefreshIcon />
            <span className="footer-text">Last network scan:</span>
            <span className="footer-value">2 minutes ago</span>
          </div>
          <div className="footer-right">
            <span className="footer-status">
              <span className="status-dot status-dot--success" />
              <span>Discovery Active</span>
            </span>
          </div>
        </footer>
      </div>

      {/* Add Baseboard Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Baseboard"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddBaseboard}>
              Add Baseboard
            </Button>
          </>
        }
      >
        <div className="modal-form">
          <Input
            label="Baseboard Name"
            placeholder="e.g., SENSOR-HUB-05"
            value={newBaseboard.name}
            onChange={(e) => setNewBaseboard(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input
            label="Identifier"
            placeholder="e.g., HUB-005"
            value={newBaseboard.identifier}
            onChange={(e) => setNewBaseboard(prev => ({ ...prev, identifier: e.target.value }))}
          />
          <Input
            label="IP Address"
            placeholder="e.g., 192.168.1.50"
            value={newBaseboard.ipAddress}
            onChange={(e) => setNewBaseboard(prev => ({ ...prev, ipAddress: e.target.value }))}
          />
          <Input
            label="Zone"
            placeholder="e.g., Zone E - Research"
            value={newBaseboard.zone}
            onChange={(e) => setNewBaseboard(prev => ({ ...prev, zone: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
};

export default BaseboardManagement;

