import { useState } from 'react';
import './ScenarioConfig.css';

// Icons
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const LightningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const WebhookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const WarningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

// Mock data for scenarios
const mockScenarios = [
  {
    id: 1,
    name: 'Fire Detection - Main Hall',
    description: 'Triggers an alarm when temperature exceeds critical thresholds on multiple sensors within a short timeframe.',
    enabled: true,
    lastTriggered: '1h ago',
    timeWindow: 30,
    conditions: [
      { id: 1, baseboard: 'MKR-1000-MAIN', sensor: 'Temp Sensor A (0x45)', operator: '> Greater', value: '65.4' },
      { id: 2, baseboard: 'MKR-1000-AUX1', sensor: 'Smoke Detect (0x21)', operator: '= Equals', value: 'HIGH (1)' }
    ],
    actions: {
      notify: {
        enabled: true,
        recipients: ['Admin Team', 'Floor Mgr'],
        messageTemplate: 'CRITICAL: Fire detected in Main Hall. Evacuate immediately.'
      },
      webhook: {
        enabled: false,
        endpointUrl: 'https://api.external-service.com/hooks/alert'
      }
    }
  },
  {
    id: 2,
    name: 'HVAC Overload Protection',
    description: 'Monitors HVAC system load and triggers protective measures when overload is detected.',
    enabled: true,
    lastTriggered: '2d ago',
    timeWindow: 60,
    conditions: [
      { id: 1, baseboard: 'MKR-1000-HVAC', sensor: 'Current Sensor (0x32)', operator: '> Greater', value: '15.0' }
    ],
    actions: {
      notify: { enabled: true, recipients: ['Maintenance'], messageTemplate: 'HVAC overload detected.' },
      webhook: { enabled: false, endpointUrl: '' }
    }
  },
  {
    id: 3,
    name: 'Storm Warning Level 2',
    description: 'Activates protective protocols when storm conditions are detected.',
    enabled: false,
    lastTriggered: null,
    timeWindow: 120,
    conditions: [],
    actions: {
      notify: { enabled: false, recipients: [], messageTemplate: '' },
      webhook: { enabled: false, endpointUrl: '' }
    }
  },
  {
    id: 4,
    name: 'Gas Leak Monitor - Lab 4',
    description: 'Monitors gas levels in Lab 4 and triggers evacuation protocols.',
    enabled: true,
    lastTriggered: '5h ago',
    timeWindow: 10,
    conditions: [
      { id: 1, baseboard: 'MKR-1000-LAB4', sensor: 'Gas Sensor (0x18)', operator: '> Greater', value: '50' }
    ],
    actions: {
      notify: { enabled: true, recipients: ['Safety Team'], messageTemplate: 'Gas leak detected in Lab 4!' },
      webhook: { enabled: true, endpointUrl: 'https://api.safety.com/alerts' }
    }
  }
];

// Mock data for dropdowns
const baseboards = ['MKR-1000-MAIN', 'MKR-1000-AUX1', 'MKR-1000-HVAC', 'MKR-1000-LAB4'];
const sensors = ['Temp Sensor A (0x45)', 'Smoke Detect (0x21)', 'Current Sensor (0x32)', 'Gas Sensor (0x18)', 'Humidity (0x55)'];
const operators = ['> Greater', '< Less', '= Equals', '≠ Not Equal', '>= Greater or Equal', '<= Less or Equal'];
const presetValues = ['HIGH (1)', 'LOW (0)', 'ACTIVE', 'INACTIVE'];

const ScenarioConfig = () => {
  const [scenarios, setScenarios] = useState(mockScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);

  // Filter scenarios based on search and filter tab
  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = scenario.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterTab === 'all' || 
      (filterTab === 'enabled' && scenario.enabled) || 
      (filterTab === 'disabled' && !scenario.enabled);
    return matchesSearch && matchesFilter;
  });

  // Update scenario field
  const updateScenario = (field, value) => {
    setScenarios(scenarios.map(s => 
      s.id === selectedScenarioId ? { ...s, [field]: value } : s
    ));
    setHasUnsavedChanges(true);
  };

  // Update condition
  const updateCondition = (conditionId, field, value) => {
    setScenarios(scenarios.map(s => {
      if (s.id === selectedScenarioId) {
        return {
          ...s,
          conditions: s.conditions.map(c => 
            c.id === conditionId ? { ...c, [field]: value } : c
          )
        };
      }
      return s;
    }));
    setHasUnsavedChanges(true);
  };

  // Add condition
  const addCondition = () => {
    const newCondition = {
      id: Date.now(),
      baseboard: baseboards[0],
      sensor: sensors[0],
      operator: operators[0],
      value: ''
    };
    setScenarios(scenarios.map(s => 
      s.id === selectedScenarioId 
        ? { ...s, conditions: [...s.conditions, newCondition] }
        : s
    ));
    setHasUnsavedChanges(true);
  };

  // Remove condition
  const removeCondition = (conditionId) => {
    setScenarios(scenarios.map(s => 
      s.id === selectedScenarioId 
        ? { ...s, conditions: s.conditions.filter(c => c.id !== conditionId) }
        : s
    ));
    setHasUnsavedChanges(true);
  };

  // Update action
  const updateAction = (actionType, field, value) => {
    setScenarios(scenarios.map(s => {
      if (s.id === selectedScenarioId) {
        return {
          ...s,
          actions: {
            ...s.actions,
            [actionType]: {
              ...s.actions[actionType],
              [field]: value
            }
          }
        };
      }
      return s;
    }));
    setHasUnsavedChanges(true);
  };

  // Add recipient
  const addRecipient = (recipient) => {
    if (!selectedScenario.actions.notify.recipients.includes(recipient)) {
      updateAction('notify', 'recipients', [...selectedScenario.actions.notify.recipients, recipient]);
    }
  };

  // Remove recipient
  const removeRecipient = (recipient) => {
    updateAction('notify', 'recipients', selectedScenario.actions.notify.recipients.filter(r => r !== recipient));
  };

  // Create new scenario
  const createNewScenario = () => {
    const newScenario = {
      id: Date.now(),
      name: 'New Scenario',
      description: '',
      enabled: false,
      lastTriggered: null,
      timeWindow: 30,
      conditions: [],
      actions: {
        notify: { enabled: false, recipients: [], messageTemplate: '' },
        webhook: { enabled: false, endpointUrl: '' }
      }
    };
    setScenarios([...scenarios, newScenario]);
    setSelectedScenarioId(newScenario.id);
    setHasUnsavedChanges(true);
  };

  // Save scenario
  const saveScenario = () => {
    // In a real app, this would make an API call
    console.log('Saving scenario:', selectedScenario);
    setHasUnsavedChanges(false);
  };

  // Discard changes
  const discardChanges = () => {
    setScenarios(mockScenarios);
    setHasUnsavedChanges(false);
  };

  // Delete scenario
  const deleteScenario = () => {
    if (window.confirm('Are you sure you want to delete this scenario?')) {
      setScenarios(scenarios.filter(s => s.id !== selectedScenarioId));
      setSelectedScenarioId(scenarios[0]?.id || null);
      setHasUnsavedChanges(false);
    }
  };

  if (!selectedScenario) {
    return <div className="scenario-config">No scenario selected</div>;
  }

  return (
    <div className="scenario-config">
      {/* Left Sidebar - Scenario List */}
      <aside className="scenario-sidebar">
        <div className="sidebar-top-row">
          <div className="sidebar-search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="new-scenario-icon-btn" onClick={createNewScenario} title="New Scenario">
            <PlusIcon />
          </button>
        </div>

        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${filterTab === 'all' ? 'sidebar-tab--active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All
          </button>
          <button 
            className={`sidebar-tab ${filterTab === 'enabled' ? 'sidebar-tab--active' : ''}`}
            onClick={() => setFilterTab('enabled')}
          >
            Enabled
          </button>
          <button 
            className={`sidebar-tab ${filterTab === 'disabled' ? 'sidebar-tab--active' : ''}`}
            onClick={() => setFilterTab('disabled')}
          >
            Disabled
          </button>
        </div>

        <div className="scenario-list">
          {filteredScenarios.map(scenario => (
            <div 
              key={scenario.id}
              className={`scenario-item ${scenario.id === selectedScenarioId ? 'scenario-item--active' : ''}`}
              onClick={() => setSelectedScenarioId(scenario.id)}
            >
              <div className="scenario-item-header">
                <span className="scenario-item-name">{scenario.name}</span>
                <span className={`scenario-item-badge ${scenario.enabled ? 'badge--enabled' : 'badge--disabled'}`}>
                  {scenario.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <div className="scenario-item-meta">
                <ClockIcon />
                <span>{scenario.lastTriggered ? `Last triggered: ${scenario.lastTriggered}` : 'Never triggered'}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Editor */}
      <main className="scenario-editor">
        {/* Header */}
        <header className="editor-header">
          <div className="editor-header-left">
            <h1 className="editor-title">Scenario Configuration</h1>
            <p className="editor-subtitle">Define logic flows and automated actions for multi-sensor events.</p>
          </div>
          <div className="editor-header-right">
            <button className="btn-secondary">
              <HistoryIcon />
              <span>History</span>
            </button>
            <button className="btn-primary" onClick={saveScenario}>
              <PlusIcon />
              <span>Save Scenario</span>
            </button>
          </div>
        </header>

        {/* Scenario Details Card */}
        <section className="scenario-details-card">
          <div className="details-form">
            <div className="form-group">
              <label className="form-label">SCENARIO NAME</label>
              <input
                type="text"
                className="form-input"
                value={selectedScenario.name}
                onChange={(e) => updateScenario('name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">DESCRIPTION</label>
              <textarea
                className="form-textarea"
                value={selectedScenario.description}
                onChange={(e) => updateScenario('description', e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <div className="details-status">
            <div className="status-header">
              <span className="status-title">Status</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={selectedScenario.enabled}
                  onChange={(e) => updateScenario('enabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="status-info">
              <span className="status-label-text">Active Evaluation</span>
              <p className="status-description">System continuously checks conditions against real-time data.</p>
            </div>
          </div>
        </section>

        {/* Logic Flow Section */}
        <section className="logic-flow-section">
          <div className="section-header">
            <div className="section-title">
              <LightningIcon />
              <span>LOGIC FLOW</span>
            </div>
            <div className="time-window">
              <span className="time-window-label">Time Window</span>
              <input
                type="number"
                className="time-window-input"
                value={selectedScenario.timeWindow}
                onChange={(e) => updateScenario('timeWindow', parseInt(e.target.value))}
              />
              <span className="time-window-unit">SECONDS</span>
            </div>
          </div>

          <div className="logic-flow-content">
            {/* START Node */}
            <div className="start-node">
              <span className="start-arrow">▶</span>
              <span>START</span>
            </div>

            {/* Connection line */}
            <div className="flow-connector flow-connector--vertical"></div>

            {/* Condition Group */}
            <div className="condition-group">
              <div className="condition-group-header">
                <span>CONDITION GROUP 1</span>
              </div>

              {selectedScenario.conditions.map((condition, index) => (
                <div key={condition.id}>
                  <div className="condition-row">
                    <div className="condition-number">{index + 1}</div>
                    
                    <div className="condition-field">
                      <label className="field-label">BASEBOARD</label>
                      <select
                        className="field-select"
                        value={condition.baseboard}
                        onChange={(e) => updateCondition(condition.id, 'baseboard', e.target.value)}
                      >
                        {baseboards.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="condition-field">
                      <label className="field-label">SENSOR</label>
                      <select
                        className="field-select"
                        value={condition.sensor}
                        onChange={(e) => updateCondition(condition.id, 'sensor', e.target.value)}
                      >
                        {sensors.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="condition-field">
                      <label className="field-label">OPERATOR</label>
                      <select
                        className="field-select"
                        value={condition.operator}
                        onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                      >
                        {operators.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>

                    <div className="condition-field">
                      <label className="field-label">{condition.operator.includes('Equal') ? 'VALUE' : 'THRESHOLD'}</label>
                      <input
                        type="text"
                        className="field-input"
                        value={condition.value}
                        onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                        list={`values-${condition.id}`}
                      />
                      <datalist id={`values-${condition.id}`}>
                        {presetValues.map(v => (
                          <option key={v} value={v} />
                        ))}
                      </datalist>
                    </div>

                    <button 
                      className="condition-delete"
                      onClick={() => removeCondition(condition.id)}
                      title="Delete condition"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  {index < selectedScenario.conditions.length - 1 && (
                    <div className="condition-logic-separator">
                      <span className="logic-badge">AND</span>
                    </div>
                  )}
                </div>
              ))}

              <button className="add-condition-btn" onClick={addCondition}>
                <PlusIcon />
                <span>Add Condition</span>
              </button>
            </div>
          </div>
        </section>

        {/* Actions Section */}
        <section className="actions-section">
          <div className="section-header">
            <div className="section-title">
              <LightningIcon />
              <span>ACTIONS</span>
            </div>
          </div>

          <div className="actions-content">
            {/* Notify Stakeholders */}
            <div className="action-card">
              <div className="action-icon action-icon--notify">
                <BellIcon />
              </div>
              <div className="action-details">
                <div className="action-header">
                  <h3 className="action-name">Notify Stakeholders</h3>
                  <div className="action-toggle">
                    <span className="toggle-label-text">{selectedScenario.actions.notify.enabled ? 'ENABLED' : 'DISABLED'}</span>
                    <label className="toggle-switch toggle-switch--small">
                      <input
                        type="checkbox"
                        checked={selectedScenario.actions.notify.enabled}
                        onChange={(e) => updateAction('notify', 'enabled', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                <div className="action-body">
                  <div className="action-field">
                    <label className="field-label">RECIPIENTS</label>
                    <div className="recipients-list">
                      {selectedScenario.actions.notify.recipients.map(recipient => (
                        <span key={recipient} className="recipient-tag">
                          <span>+ {recipient}</span>
                          <button onClick={() => removeRecipient(recipient)}>×</button>
                        </span>
                      ))}
                      <button 
                        className="add-recipient-btn"
                        onClick={() => {
                          const recipient = prompt('Enter recipient name:');
                          if (recipient) addRecipient(recipient);
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                  <div className="action-field">
                    <label className="field-label">MESSAGE TEMPLATE</label>
                    <input
                      type="text"
                      className="field-input field-input--wide"
                      value={selectedScenario.actions.notify.messageTemplate}
                      onChange={(e) => updateAction('notify', 'messageTemplate', e.target.value)}
                      placeholder="Enter message template..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Trigger Webhook */}
            <div className="action-card">
              <div className="action-icon action-icon--webhook">
                <WebhookIcon />
              </div>
              <div className="action-details">
                <div className="action-header">
                  <h3 className="action-name">Trigger Webhook</h3>
                  <div className="action-toggle">
                    <span className="toggle-label-text">{selectedScenario.actions.webhook.enabled ? 'ENABLED' : 'DISABLED'}</span>
                    <label className="toggle-switch toggle-switch--small">
                      <input
                        type="checkbox"
                        checked={selectedScenario.actions.webhook.enabled}
                        onChange={(e) => updateAction('webhook', 'enabled', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                <div className="action-body">
                  <div className="action-field">
                    <label className="field-label">ENDPOINT URL</label>
                    <input
                      type="text"
                      className="field-input field-input--wide"
                      value={selectedScenario.actions.webhook.endpointUrl}
                      onChange={(e) => updateAction('webhook', 'endpointUrl', e.target.value)}
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="editor-footer">
          <button className="btn-delete" onClick={deleteScenario}>
            <DeleteIcon />
            <span>Delete Scenario</span>
          </button>
          <div className="footer-right">
            {hasUnsavedChanges && (
              <div className="unsaved-indicator">
                <WarningIcon />
                <span>Unsaved changes</span>
              </div>
            )}
            <button className="btn-discard" onClick={discardChanges}>
              Discard
            </button>
            <button className="btn-save" onClick={saveScenario}>
              Save Scenario
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default ScenarioConfig;
