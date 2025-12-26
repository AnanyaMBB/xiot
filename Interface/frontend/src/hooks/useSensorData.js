/**
 * React hook for real-time sensor data via WebSocket.
 */

import { useState, useEffect, useRef } from 'react';
import websocketService from '../services/websocket';

// How long before an offline sensor is removed (milliseconds)
const SENSOR_TIMEOUT_MS = 5000;

/**
 * Hook to subscribe to real-time sensor updates.
 * 
 * @returns {Object} { sensors, baseboards, connectionStatus, isConnected }
 */
export function useSensorData() {
  const [sensors, setSensors] = useState({});
  const [baseboards, setBaseboards] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Subscribe to connection status
    const unsubConnection = websocketService.subscribe('connection', (data) => {
      setConnectionStatus(data.status);
    });

    // Subscribe to sensor updates
    const unsubSensor = websocketService.subscribe('sensor_update', (data) => {
      const { baseboard_id, sensors: sensorList, timestamp } = data;
      const now = Date.now();
      
      setSensors(prev => {
        const updated = { ...prev };
        
        sensorList.forEach(sensor => {
          const key = `${baseboard_id}:${sensor.i2c_address}`;
          const isActive = sensor.status === 'active' && sensor.value !== null;
          const existing = prev[key];
          
          // If sensor was marked as removed and is still offline, skip it
          if (existing?.removed && !isActive) {
            return;
          }
          
          if (isActive) {
            // Sensor is online
            updated[key] = {
              ...sensor,
              baseboard_id,
              key,
              lastUpdate: timestamp,
              offlineSince: null,
              removed: false
            };
          } else {
            // Sensor is offline
            const offlineSince = existing?.offlineSince || now;
            
            // Check if it's been offline too long
            if ((now - offlineSince) >= SENSOR_TIMEOUT_MS) {
              // Mark as removed (will be filtered out)
              updated[key] = { ...existing, removed: true };
              console.log(`[Sensor] Marking sensor as removed: ${key}`);
            } else {
              // Still showing offline state
              updated[key] = {
                ...sensor,
                baseboard_id,
                key,
                lastUpdate: timestamp,
                offlineSince: offlineSince,
                removed: false
              };
              if (!existing?.offlineSince) {
                console.log(`[Sensor] Sensor went offline: ${key}`);
              }
            }
          }
        });
        
        return updated;
      });
      
      setLastUpdate(timestamp);
    });

    // Subscribe to baseboard status
    const unsubBaseboard = websocketService.subscribe('baseboard_status', (data) => {
      const { baseboard_id, status, timestamp } = data;
      
      setBaseboards(prev => ({
        ...prev,
        [baseboard_id]: { status, lastSeen: timestamp }
      }));
    });

    // Cleanup
    return () => {
      unsubConnection();
      unsubSensor();
      unsubBaseboard();
    };
  }, []);

  const isConnected = connectionStatus === 'connected';
  // Filter out removed sensors
  const sensorList = Object.values(sensors).filter(s => !s.removed);

  return {
    sensors: sensorList,
    sensorsMap: sensors,
    baseboards,
    connectionStatus,
    isConnected,
    lastUpdate
  };
}

/**
 * Hook to get sensors for a specific baseboard.
 * 
 * @param {string} baseboardId - The baseboard identifier
 * @returns {Object} { sensors, isConnected }
 */
export function useBaseboardSensors(baseboardId) {
  const { sensors, isConnected, connectionStatus } = useSensorData();
  
  const filteredSensors = sensors.filter(
    sensor => sensor.baseboard_id === baseboardId
  );
  
  return {
    sensors: filteredSensors,
    isConnected,
    connectionStatus
  };
}

export default useSensorData;

