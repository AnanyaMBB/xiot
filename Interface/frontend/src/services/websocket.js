/**
 * WebSocket service for real-time sensor data.
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/sensors/';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected');
      return;
    }

    console.log('[WS] Connecting to', WS_URL);
    this.socket = new WebSocket(WS_URL);

    this.socket.onopen = () => {
      console.log('[WS] Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this._emit('connection', { status: 'connected' });
    };

    this.socket.onclose = (event) => {
      console.log('[WS] Disconnected', event.code, event.reason);
      this.isConnected = false;
      this._emit('connection', { status: 'disconnected' });
      this._attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('[WS] Error:', error);
      this._emit('error', { error });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this._handleMessage(data);
      } catch (e) {
        console.error('[WS] Failed to parse message:', e);
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('[WS] Max reconnection attempts reached');
      this._emit('connection', { status: 'failed' });
    }
  }

  _handleMessage(data) {
    const { type, ...payload } = data;
    
    console.log('[WS] Received message:', type, data);
    
    switch (type) {
      case 'connection_established':
        console.log('[WS] Server acknowledged connection');
        break;
      
      case 'sensor_update':
        console.log('[WS] Sensor update data:', payload.data);
        this._emit('sensor_update', payload.data);
        break;
      
      case 'baseboard_status':
        console.log('[WS] Baseboard status data:', payload.data);
        this._emit('baseboard_status', payload.data);
        break;
      
      case 'pong':
        // Heartbeat response
        break;
      
      default:
        console.log('[WS] Unknown message type:', type);
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  _emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  ping() {
    this.send({ type: 'ping' });
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;

