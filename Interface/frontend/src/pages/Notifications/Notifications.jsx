import { useState } from 'react';
import StatusCard from '../../components/StatusCard/StatusCard';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import './Notifications.css';

// Icons
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const WebhookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" />
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

const mockNotificationRules = [
  {
    id: 1,
    name: 'Critical Temperature Alert',
    trigger: 'Temp Sensor A > 30°C',
    channels: ['email', 'sms'],
    recipients: ['ops@example.com', '+1234567890'],
    severity: 'critical',
    enabled: true,
    lastTriggered: '2 hours ago',
  },
  {
    id: 2,
    name: 'Vibration Warning',
    trigger: 'Vibration D > 2.0g',
    channels: ['email', 'webhook'],
    recipients: ['alerts@example.com'],
    severity: 'warning',
    enabled: true,
    lastTriggered: '15 minutes ago',
  },
  {
    id: 3,
    name: 'Daily Health Summary',
    trigger: 'Scheduled: 08:00 daily',
    channels: ['email'],
    recipients: ['team@example.com'],
    severity: 'info',
    enabled: true,
    lastTriggered: 'Today 08:00',
  },
  {
    id: 4,
    name: 'Pressure Drop Alert',
    trigger: 'Pressure C < 1000hPa',
    channels: ['sms', 'webhook'],
    recipients: ['+1987654321'],
    severity: 'critical',
    enabled: false,
    lastTriggered: 'Never',
  },
];

const mockNotificationHistory = [
  { id: 1, rule: 'Critical Temperature Alert', time: '14:32:15', status: 'delivered', channel: 'email' },
  { id: 2, rule: 'Vibration Warning', time: '14:18:42', status: 'delivered', channel: 'webhook' },
  { id: 3, rule: 'Critical Temperature Alert', time: '12:45:00', status: 'delivered', channel: 'sms' },
  { id: 4, rule: 'Daily Health Summary', time: '08:00:00', status: 'delivered', channel: 'email' },
  { id: 5, rule: 'Pressure Drop Alert', time: '07:22:18', status: 'failed', channel: 'webhook' },
];

const Notifications = () => {
  const [rules, setRules] = useState(mockNotificationRules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('rules');

  const toggleRule = (id) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return <MailIcon />;
      case 'sms': return <PhoneIcon />;
      case 'webhook': return <WebhookIcon />;
      default: return <BellIcon />;
    }
  };

  const sentToday = mockNotificationHistory.length;
  const deliveryRate = Math.round((mockNotificationHistory.filter(n => n.status === 'delivered').length / mockNotificationHistory.length) * 100);

  return (
    <div className="notifications">
      <div className="notifications-container">
        {/* Header */}
        <header className="notifications-header">
          <div className="notifications-header-left">
            <h1 className="notifications-title">Notification Management</h1>
            <p className="notifications-subtitle">Configure alert rules and delivery channels</p>
          </div>
          <div className="notifications-header-right">
            <Button variant="primary" icon={<PlusIcon />} iconPosition="left" onClick={() => setIsModalOpen(true)}>
              Add Rule
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatusCard
            title="Active Rules"
            value={rules.filter(r => r.enabled).length.toString()}
            subtitle={`of ${rules.length} total`}
            icon={<BellIcon />}
          />
          <StatusCard
            title="Sent Today"
            value={sentToday.toString()}
            subtitle="notifications"
            icon={<MailIcon />}
          />
          <StatusCard
            title="Delivery Rate"
            value={`${deliveryRate}%`}
            subtitle="success"
            icon={<PhoneIcon />}
            status="success"
          />
          <StatusCard
            title="Channels"
            value="3"
            subtitle="configured"
            icon={<WebhookIcon />}
          />
        </div>

        {/* Tabs */}
        <div className="tab-container">
          <div className="tabs">
            <button 
              className={`tab ${selectedTab === 'rules' ? 'tab--active' : ''}`}
              onClick={() => setSelectedTab('rules')}
            >
              Notification Rules
            </button>
            <button 
              className={`tab ${selectedTab === 'history' ? 'tab--active' : ''}`}
              onClick={() => setSelectedTab('history')}
            >
              Delivery History
            </button>
          </div>
        </div>

        {/* Content */}
        {selectedTab === 'rules' ? (
          <div className="rules-list">
            {rules.map((rule) => (
              <div key={rule.id} className={`rule-card ${!rule.enabled ? 'rule-card--disabled' : ''}`}>
                <div className="rule-header">
                  <div className="rule-info">
                    <div className="rule-title-row">
                      <h3 className="rule-name">{rule.name}</h3>
                      <span className={`severity-badge severity-badge--${rule.severity}`}>
                        {rule.severity}
                      </span>
                    </div>
                    <p className="rule-trigger">{rule.trigger}</p>
                  </div>
                  <div className="rule-actions">
                    <button className="action-btn" title="Edit">
                      <EditIcon />
                    </button>
                    <button className="action-btn action-btn--danger" title="Delete">
                      <TrashIcon />
                    </button>
                    <div 
                      className={`toggle ${rule.enabled ? 'toggle--on' : ''}`}
                      onClick={() => toggleRule(rule.id)}
                    >
                      <div className="toggle-track" />
                      <div className="toggle-thumb" />
                    </div>
                  </div>
                </div>
                
                <div className="rule-details">
                  <div className="rule-channels">
                    <span className="detail-label">Channels:</span>
                    <div className="channel-badges">
                      {rule.channels.map((channel, idx) => (
                        <span key={idx} className="channel-badge">
                          {getChannelIcon(channel)}
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rule-recipients">
                    <span className="detail-label">Recipients:</span>
                    <span className="recipients-list">{rule.recipients.join(', ')}</span>
                  </div>
                </div>

                <div className="rule-footer">
                  <span className="last-triggered">Last triggered: {rule.lastTriggered}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="history-panel">
            <div className="history-table">
              <div className="history-header">
                <span>Time</span>
                <span>Rule</span>
                <span>Channel</span>
                <span>Status</span>
              </div>
              {mockNotificationHistory.map((notification) => (
                <div key={notification.id} className="history-row">
                  <span className="history-time">{notification.time}</span>
                  <span className="history-rule">{notification.rule}</span>
                  <span className="history-channel">
                    {getChannelIcon(notification.channel)}
                    {notification.channel}
                  </span>
                  <span className={`history-status history-status--${notification.status}`}>
                    {notification.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="notifications-footer">
          <div className="footer-left">
            <span className="footer-text">System notifications:</span>
            <span className="footer-value">Active</span>
          </div>
          <div className="footer-right">
            <span className="footer-status">
              <span className="status-dot status-dot--success" />
              <span>All channels operational</span>
            </span>
          </div>
        </footer>
      </div>

      {/* Add Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Notification Rule"
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Create Rule
            </Button>
          </>
        }
      >
        <div className="modal-form">
          <Input label="Rule Name" placeholder="e.g., High Temperature Alert" />
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Trigger Type</label>
              <select className="form-select">
                <option>Sensor Threshold</option>
                <option>Event Type</option>
                <option>Scheduled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select className="form-select">
                <option>Info</option>
                <option>Warning</option>
                <option>Critical</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Channels</label>
            <div className="channel-options">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked /> Email
              </label>
              <label className="checkbox-label">
                <input type="checkbox" /> SMS
              </label>
              <label className="checkbox-label">
                <input type="checkbox" /> Webhook
              </label>
              <label className="checkbox-label">
                <input type="checkbox" /> System Alert
              </label>
            </div>
          </div>
          <Input label="Recipients" placeholder="Enter email addresses or phone numbers" />
        </div>
      </Modal>
    </div>
  );
};

export default Notifications;

