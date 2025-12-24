import { useState } from 'react';
import Button from '../../components/Button/Button';
import './ScenarioConfig.css';

// Icons
const HistoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const LightningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ThermometerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

const CO2Icon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const WebhookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 16.98h-5.99c-1.66 0-3.01-1.34-3.01-3s1.35-3 3.01-3H18" />
    <path d="M6 16.98h-.01c-2.76 0-5-2.24-5-5s2.24-5 5-5h.01" />
    <path d="M12 8.02V3" />
    <path d="M18.01 8.02c2.76 0 5 2.24 5 5s-2.24 5-5 5" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ScenarioConfig = () => {
  const [scenarioName, setScenarioName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [activeActionTab, setActiveActionTab] = useState('notify');
  
  // Condition groups state
  const [conditionGroups, setConditionGroups] = useState([
    {
      id: 1,
      conditions: [
        { id: 1, sensorType: 'temp', sensorName: 'Temp Sensor A', operator: 'greater_than', value: '75', unit: '°C' },
      ],
      logic: 'AND'
    },
    {
      id: 2,
      conditions: [
        { id: 2, sensorType: 'co2', sensorName: 'CO2 Sensor 2', operator: 'greater_than', value: '1000', unit: 'PPM' },
      ],
      logic: 'OR'
    }
  ]);

  // Actions state
  const [actions, setActions] = useState([
    {
      id: 1,
      type: 'notify',
      name: 'Critical Alert Notification',
      description: 'Send immediate push notification to @Admin Group, and trigger email alert.',
      priority: 'high'
    }
  ]);

  const addConditionGroup = () => {
    const newGroup = {
      id: Date.now(),
      conditions: [
        { id: Date.now(), sensorType: 'temp', sensorName: 'New Sensor', operator: 'greater_than', value: '0', unit: '°C' }
      ],
      logic: 'AND'
    };
    setConditionGroups([...conditionGroups, newGroup]);
  };

  const updateCondition = (groupId, conditionId, field, value) => {
    setConditionGroups(groups => 
      groups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: group.conditions.map(cond => 
              cond.id === conditionId ? { ...cond, [field]: value } : cond
            )
          };
        }
        return group;
      })
    );
  };

  const removeConditionGroup = (groupId) => {
    setConditionGroups(groups => groups.filter(g => g.id !== groupId));
  };

  const getSensorIcon = (type) => {
    switch (type) {
      case 'temp': return <ThermometerIcon />;
      case 'co2': return <CO2Icon />;
      default: return <ThermometerIcon />;
    }
  };

  return (
    <div className="scenario-config">
      <div className="scenario-container">
        {/* Header */}
        <header className="scenario-header">
          <div className="scenario-header-left">
            <h1 className="scenario-title">Scenario Configuration</h1>
            <p className="scenario-subtitle">Create logic chains for automated monitoring and responses</p>
          </div>
          <div className="scenario-header-right">
            <Button variant="secondary" icon={<HistoryIcon />} iconPosition="left">
              History
            </Button>
            <Button variant="primary" icon={<SaveIcon />} iconPosition="left">
              Save Scenario
            </Button>
          </div>
        </header>

        {/* Main Configuration Section */}
        <div className="config-section">
          <div className="config-form-row">
            <div className="config-form-left">
              {/* Scenario Name */}
              <div className="form-group">
                <label className="form-label">Scenario Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Critical Temperature Shutdown Protocol"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the purpose and expected outcome of this scenario..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Status Toggle */}
            <div className="config-form-right">
              <div className="status-section">
                <div className="status-header">
                  <span className="status-label">Status</span>
                  <span className={`status-badge ${isActive ? 'status-badge--enabled' : 'status-badge--disabled'}`}>
                    {isActive ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="status-toggle-row">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">Active Monitoring</span>
                </div>
                <p className="status-hint">
                  When disabled, this logic will not trigger or execute regardless of sensor states.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Logic Flow Builder */}
        <div className="flow-builder-section">
          <div className="flow-builder-header">
            <div className="flow-builder-title">
              <LightningIcon />
              <span>Logic Flow Builder</span>
            </div>
            <button className="add-condition-btn" onClick={addConditionGroup}>
              <PlusIcon />
              <span>Add Condition Group</span>
            </button>
          </div>

          <div className="flow-builder-content">
            {/* START Node */}
            <div className="flow-start">
              <button className="start-node">
                <span className="start-arrow">▶</span>
                <span>START</span>
              </button>
            </div>

            {/* Connection Lines and Condition Groups */}
            <div className="flow-conditions-wrapper">
              <div className="flow-conditions">
                {conditionGroups.map((group, groupIndex) => (
                  <div key={group.id} className="condition-group-wrapper">
                    {/* Connection line from start/previous */}
                    {groupIndex === 0 && (
                      <div className="connection-line connection-line--horizontal-start"></div>
                    )}
                    
                    {/* Condition Label */}
                    <div className="condition-label">CONDITION {String.fromCharCode(65 + groupIndex)}</div>
                    
                    {/* Condition Card */}
                    <div className="condition-card">
                      <div className="condition-card-header">
                        <div className="sensor-info">
                          <span className="sensor-icon">{getSensorIcon(group.conditions[0].sensorType)}</span>
                          <span className="sensor-name">{group.conditions[0].sensorName}</span>
                        </div>
                        <div className="condition-actions">
                          <span className="logic-type">{group.logic}</span>
                          <button 
                            className="remove-condition-btn"
                            onClick={() => removeConditionGroup(group.id)}
                            title="Remove condition"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                      <div className="condition-card-body">
                        <select 
                          className="condition-select"
                          value={group.conditions[0].operator}
                          onChange={(e) => updateCondition(group.id, group.conditions[0].id, 'operator', e.target.value)}
                        >
                          <option value="greater_than">Greater than</option>
                          <option value="less_than">Less than</option>
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not equals</option>
                        </select>
                        <input
                          type="text"
                          className="condition-value"
                          value={group.conditions[0].value}
                          onChange={(e) => updateCondition(group.id, group.conditions[0].id, 'value', e.target.value)}
                        />
                        <span className="condition-unit">{group.conditions[0].unit}</span>
                      </div>
                    </div>

                    {/* Connection line to next/AND node */}
                    <div className="connection-line connection-line--vertical"></div>
                  </div>
                ))}
              </div>

              {/* AND Node */}
              {conditionGroups.length > 1 && (
                <div className="logic-node-wrapper">
                  <div className="logic-node">
                    <span className="logic-connector">↓</span>
                    <span className="logic-text">AND</span>
                  </div>
                </div>
              )}

              {/* Connection to Result */}
              <div className="connection-line connection-line--to-result"></div>

              {/* Logic Satisfied Result */}
              <div className="result-node">
                <div className="result-content">
                  <span className="result-title">Logic Satisfied</span>
                  <span className="result-subtitle">Applies action(s) to every satisfactory result.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Definitions */}
        <div className="actions-section">
          <div className="actions-header">
            <div className="actions-title">
              <LightningIcon />
              <span>Action Definitions</span>
            </div>
            <div className="action-tabs">
              <button 
                className={`action-tab ${activeActionTab === 'notify' ? 'action-tab--active' : ''}`}
                onClick={() => setActiveActionTab('notify')}
              >
                <BellIcon />
                <span>Notify</span>
              </button>
              <button 
                className={`action-tab ${activeActionTab === 'actuator' ? 'action-tab--active' : ''}`}
                onClick={() => setActiveActionTab('actuator')}
              >
                <SettingsIcon />
                <span>Actuator</span>
              </button>
              <button 
                className={`action-tab ${activeActionTab === 'webhook' ? 'action-tab--active' : ''}`}
                onClick={() => setActiveActionTab('webhook')}
              >
                <WebhookIcon />
                <span>Webhook</span>
              </button>
            </div>
          </div>

          <div className="actions-content">
            {actions.filter(a => a.type === activeActionTab).map(action => (
              <div key={action.id} className="action-card">
                <div className="action-icon-wrapper action-icon--critical">
                  <AlertTriangleIcon />
                </div>
                <div className="action-info">
                  <h4 className="action-name">{action.name}</h4>
                  <p className="action-description">
                    Send immediate push notification to <a href="#" className="action-link">@Admin Group</a>, and trigger email alert.
                  </p>
                  <span className={`priority-badge priority-badge--${action.priority}`}>
                    {action.priority === 'high' ? 'High Priority' : action.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                  </span>
                </div>
              </div>
            ))}

            {actions.filter(a => a.type === activeActionTab).length === 0 && (
              <div className="no-actions">
                <p>No {activeActionTab} actions configured. Click the + button to add one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioConfig;
