/**
 * React hook for real-time sensor data via WebSocket.
 */

import { useState, useEffect, useCallback } from 'react';
import websocketService from '../services/websocket';

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
      
      setSensors(prev => {
        const updated = { ...prev };
        
        sensorList.forEach(sensor => {
          const key = `${baseboard_id}:${sensor.i2c_address}`;
          updated[key] = {
            ...sensor,
            baseboard_id,
            key,
            lastUpdate: timestamp
          };
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
  const sensorList = Object.values(sensors);

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

