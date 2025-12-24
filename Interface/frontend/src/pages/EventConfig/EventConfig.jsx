import { useState } from 'react';
import StatusCard from '../../components/StatusCard/StatusCard';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import Input from '../../components/Input/Input';
import './EventConfig.css';

// Icons
const ZapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
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

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const mockEvents = [
  {
    id: 'EVT-001',
    name: 'High Temperature Warning',
    sensor: 'Temp Sensor A',
    condition: 'value > 28',
    operator: '>',
    threshold: 28,
    unit: '°C',
    severity: 'warning',
    enabled: true,
    actions: ['Log', 'Notify'],
    triggeredCount: 24,
    lastTriggered: '15 minutes ago',
  },
  {
    id: 'EVT-002',
    name: 'Critical Temperature',
    sensor: 'Temp Sensor A',
    condition: 'value > 35',
    operator: '>',
    threshold: 35,
    unit: '°C',
    severity: 'critical',
    enabled: true,
    actions: ['Log', 'Notify', 'Emergency Stop'],
    triggeredCount: 2,
    lastTriggered: '3 days ago',
  },
  {
    id: 'EVT-003',
    name: 'Vibration Spike',
    sensor: 'Vibration D',
    condition: 'value > 2.0',
    operator: '>',
    threshold: 2.0,
    unit: 'g',
    severity: 'critical',
    enabled: true,
    actions: ['Log', 'Notify'],
    triggeredCount: 8,
    lastTriggered: '1 hour ago',
  },
  {
    id: 'EVT-004',
    name: 'Low Pressure Alert',
    sensor: 'Pressure C',
    condition: 'value < 1000',
    operator: '<',
    threshold: 1000,
    unit: 'hPa',
    severity: 'warning',
    enabled: false,
    actions: ['Log'],
    triggeredCount: 0,
    lastTriggered: 'Never',
  },
  {
    id: 'EVT-005',
    name: 'Humidity Normal Range',
    sensor: 'Humidity B',
    condition: 'value >= 40 && value <= 60',
    operator: 'range',
    threshold: '40-60',
    unit: '%',
    severity: 'info',
    enabled: true,
    actions: ['Log'],
    triggeredCount: 156,
    lastTriggered: 'Now',
  },
];

const EventConfig = () => {
  const [events, setEvents] = useState(mockEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');

  const toggleEvent = (id) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, enabled: !event.enabled } : event
    ));
  };

  const filteredEvents = filterSeverity === 'all' 
    ? events 
    : events.filter(e => e.severity === filterSeverity);

  const activeEvents = events.filter(e => e.enabled).length;
  const criticalEvents = events.filter(e => e.severity === 'critical' && e.enabled).length;

  return (
    <div className="event-config">
      <div className="event-container">
        {/* Header */}
        <header className="event-header">
          <div className="event-header-left">
            <h1 className="event-title">Event Configuration</h1>
            <p className="event-subtitle">Define sensor-based triggers and conditions</p>
          </div>
          <div className="event-header-right">
            <Button variant="primary" icon={<PlusIcon />} iconPosition="left" onClick={() => setIsModalOpen(true)}>
              Create Event
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatusCard
            title="Total Events"
            value={events.length.toString()}
            subtitle="defined"
            icon={<ZapIcon />}
          />
          <StatusCard
            title="Active"
            value={activeEvents.toString()}
            subtitle="enabled"
            icon={<CheckCircleIcon />}
            status="success"
          />
          <StatusCard
            title="Critical"
            value={criticalEvents.toString()}
            subtitle="monitoring"
            icon={<AlertCircleIcon />}
            status={criticalEvents > 0 ? 'warning' : 'default'}
          />
          <StatusCard
            title="Triggered Today"
            value="34"
            subtitle="events"
            icon={<ZapIcon />}
          />
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">Filter by severity:</span>
            <div className="filter-buttons">
              {['all', 'info', 'warning', 'critical'].map((severity) => (
                <button
                  key={severity}
                  className={`filter-btn ${filterSeverity === severity ? 'filter-btn--active' : ''} ${severity !== 'all' ? `filter-btn--${severity}` : ''}`}
                  onClick={() => setFilterSeverity(severity)}
                >
                  {severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="events-grid">
          {filteredEvents.map((event) => (
            <div key={event.id} className={`event-card ${!event.enabled ? 'event-card--disabled' : ''}`}>
              <div className="event-card-header">
                <div className="event-id">{event.id}</div>
                <span className={`severity-badge severity-badge--${event.severity}`}>
                  {event.severity}
                </span>
              </div>

              <div className="event-card-body">
                <h3 className="event-name">{event.name}</h3>
                
                <div className="event-condition">
                  <div className="condition-sensor">
                    <span className="condition-label">Sensor</span>
                    <span className="condition-value">{event.sensor}</span>
                  </div>
                  <div className="condition-rule">
                    <span className="condition-label">Condition</span>
                    <span className="condition-expression">
                      <span className="condition-op">{event.operator}</span>
                      <span className="condition-threshold">{event.threshold}</span>
                      <span className="condition-unit">{event.unit}</span>
                    </span>
                  </div>
                </div>

                <div className="event-actions-list">
                  <span className="actions-label">Actions:</span>
                  <div className="action-tags">
                    {event.actions.map((action, idx) => (
                      <span key={idx} className="action-tag">{action}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="event-card-footer">
                <div className="event-stats">
                  <span className="stat-item">
                    <span className="stat-count">{event.triggeredCount}</span>
                    <span className="stat-label">triggers</span>
                  </span>
                  <span className="stat-divider">•</span>
                  <span className="stat-last">Last: {event.lastTriggered}</span>
                </div>
                
                <div className="event-controls">
                  <button className="control-btn" title="Edit">
                    <EditIcon />
                  </button>
                  <button className="control-btn" title="Duplicate">
                    <CopyIcon />
                  </button>
                  <button className="control-btn control-btn--danger" title="Delete">
                    <TrashIcon />
                  </button>
                  <div 
                    className={`toggle ${event.enabled ? 'toggle--on' : ''}`}
                    onClick={() => toggleEvent(event.id)}
                  >
                    <div className="toggle-track" />
                    <div className="toggle-thumb" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="event-footer">
          <div className="footer-left">
            <span className="footer-text">Event engine:</span>
            <span className="footer-value">Active</span>
          </div>
          <div className="footer-right">
            <span className="footer-info">Showing {filteredEvents.length} of {events.length} events</span>
          </div>
        </footer>
      </div>

      {/* Create Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Event"
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Create Event
            </Button>
          </>
        }
      >
        <div className="modal-form">
          <Input label="Event Name" placeholder="e.g., High Temperature Alert" />
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sensor</label>
              <select className="form-select">
                <option>Temp Sensor A</option>
                <option>Humidity B</option>
                <option>Pressure C</option>
                <option>Vibration D</option>
                <option>Light Level</option>
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

          <div className="form-row form-row--condition">
            <div className="form-group">
              <label className="form-label">Operator</label>
              <select className="form-select">
                <option>&gt; Greater than</option>
                <option>&lt; Less than</option>
                <option>= Equal to</option>
                <option>!= Not equal</option>
                <option>Range</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Threshold</label>
              <Input placeholder="e.g., 30" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <Input placeholder="e.g., °C" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Actions on Trigger</label>
            <div className="action-options">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked /> Log Event
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked /> Send Notification
              </label>
              <label className="checkbox-label">
                <input type="checkbox" /> Trigger Actuator
              </label>
              <label className="checkbox-label">
                <input type="checkbox" /> Emergency Stop
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventConfig;

