"""
MQTT Publisher for XIOT Sensor Data

Reads sensor data from ATtiny85 adapters via I2C and publishes to MQTT broker.
The backend subscribes to receive real-time sensor updates.

Configuration:
    - MQTT broker address
    - Baseboard identifier
    - Sensor mappings (I2C address -> sensor name/type)
"""

import json
import time
import signal
import sys
from datetime import datetime

import smbus2
import paho.mqtt.client as mqtt

# =============================================================================
# Configuration
# =============================================================================

# MQTT Broker settings
MQTT_BROKER = "aalsdb.kaist.ac.kr"
MQTT_PORT = 1883
MQTT_USERNAME = None  # Set if broker requires auth
MQTT_PASSWORD = None

# Baseboard identifier (unique per Pi/baseboard)
BASEBOARD_ID = "PI-001"

# I2C Configuration
I2C_BUS = 1

# Sensor mappings: I2C address -> sensor configuration
# This defines which sensors are connected to which I2C addresses
SENSOR_MAPPINGS = {
    0x08: {
        "name": "Temperature Sensor",
        "type": "temperature",
        "unit": "°C",
        "conversion": lambda raw: (raw / 1023.0) * 3.3 * 100  # Example: LM35 conversion
    },
    # Add more sensors as needed:
    # 0x09: {
    #     "name": "Humidity Sensor",
    #     "type": "humidity",
    #     "unit": "%",
    #     "conversion": lambda raw: (raw / 1023.0) * 100
    # },
}

# MQTT Topics
TOPIC_SENSOR_DATA = f"xiot/{BASEBOARD_ID}/sensors"
TOPIC_STATUS = f"xiot/{BASEBOARD_ID}/status"

# Reading interval in seconds
READ_INTERVAL = 1.0


# =============================================================================
# I2C Sensor Reading
# =============================================================================

class SensorReader:
    """Reads sensor data from I2C devices."""
    
    def __init__(self, bus_num=I2C_BUS):
        self.bus = smbus2.SMBus(bus_num)
        self.last_values = {}
    
    def read_sensor(self, i2c_addr):
        """
        Read 10-bit sensor value from ATtiny85 adapter.
        
        Returns:
            int: Raw sensor value (0-1023) or None on error
        """
        try:
            data = self.bus.read_i2c_block_data(i2c_addr, 0, 2)
            raw_value = data[0] | ((data[1] & 0x03) << 8)
            self.last_values[i2c_addr] = raw_value
            return raw_value
        except IOError:
            return None
    
    def read_all_sensors(self):
        """
        Read all configured sensors.
        
        Returns:
            list: List of sensor reading dictionaries
        """
        readings = []
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        for i2c_addr, config in SENSOR_MAPPINGS.items():
            raw_value = self.read_sensor(i2c_addr)
            
            if raw_value is not None:
                # Apply conversion function to get actual value
                converted_value = config["conversion"](raw_value)
                
                readings.append({
                    "i2c_address": f"0x{i2c_addr:02X}",
                    "name": config["name"],
                    "type": config["type"],
                    "raw_value": raw_value,
                    "value": round(converted_value, 2),
                    "unit": config["unit"],
                    "status": "active",
                    "timestamp": timestamp
                })
            else:
                readings.append({
                    "i2c_address": f"0x{i2c_addr:02X}",
                    "name": config["name"],
                    "type": config["type"],
                    "raw_value": None,
                    "value": None,
                    "unit": config["unit"],
                    "status": "offline",
                    "timestamp": timestamp
                })
        
        return readings
    
    def close(self):
        """Close the I2C bus."""
        self.bus.close()


# =============================================================================
# MQTT Client
# =============================================================================

class MQTTPublisher:
    """Publishes sensor data to MQTT broker."""
    
    def __init__(self, broker, port, baseboard_id):
        self.broker = broker
        self.port = port
        self.baseboard_id = baseboard_id
        self.connected = False
        
        # Create MQTT client
        self.client = mqtt.Client(client_id=f"xiot-{baseboard_id}")
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        
        # Set credentials if provided
        if MQTT_USERNAME and MQTT_PASSWORD:
            self.client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to broker."""
        if rc == 0:
            print(f"[MQTT] Connected to broker at {self.broker}:{self.port}")
            self.connected = True
            # Publish online status
            self._publish_status("online")
        else:
            print(f"[MQTT] Connection failed with code {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from broker."""
        print(f"[MQTT] Disconnected from broker (rc={rc})")
        self.connected = False
    
    def connect(self):
        """Connect to MQTT broker."""
        try:
            # Set last will (offline message when disconnected unexpectedly)
            self.client.will_set(
                TOPIC_STATUS,
                json.dumps({"baseboard_id": self.baseboard_id, "status": "offline"}),
                qos=1,
                retain=True
            )
            
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()
            
            # Wait for connection
            timeout = 10
            while not self.connected and timeout > 0:
                time.sleep(0.5)
                timeout -= 0.5
            
            return self.connected
        except Exception as e:
            print(f"[MQTT] Connection error: {e}")
            return False
    
    def _publish_status(self, status):
        """Publish baseboard status."""
        payload = {
            "baseboard_id": self.baseboard_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        self.client.publish(TOPIC_STATUS, json.dumps(payload), qos=1, retain=True)
    
    def publish_sensor_data(self, readings):
        """
        Publish sensor readings to MQTT.
        
        Args:
            readings: List of sensor reading dictionaries
        """
        if not self.connected:
            print("[MQTT] Not connected, skipping publish")
            return False
        
        payload = {
            "baseboard_id": self.baseboard_id,
            "sensors": readings,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        result = self.client.publish(TOPIC_SENSOR_DATA, json.dumps(payload), qos=0)
        return result.rc == mqtt.MQTT_ERR_SUCCESS
    
    def disconnect(self):
        """Disconnect from broker."""
        self._publish_status("offline")
        self.client.loop_stop()
        self.client.disconnect()


# =============================================================================
# Main
# =============================================================================

def main():
    """Main loop - read sensors and publish to MQTT."""
    print("=" * 50)
    print("XIOT Sensor MQTT Publisher")
    print(f"Baseboard ID: {BASEBOARD_ID}")
    print(f"MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Sensors configured: {len(SENSOR_MAPPINGS)}")
    print("=" * 50)
    
    # Initialize components
    sensor_reader = SensorReader()
    mqtt_publisher = MQTTPublisher(MQTT_BROKER, MQTT_PORT, BASEBOARD_ID)
    
    # Handle graceful shutdown
    running = True
    
    def signal_handler(sig, frame):
        nonlocal running
        print("\n[INFO] Shutting down...")
        running = False
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Connect to MQTT broker
    if not mqtt_publisher.connect():
        print("[ERROR] Failed to connect to MQTT broker")
        sys.exit(1)
    
    print(f"[INFO] Starting sensor readings (interval: {READ_INTERVAL}s)")
    print("-" * 50)
    
    # Main loop
    while running:
        try:
            # Read all sensors
            readings = sensor_reader.read_all_sensors()
            
            # Print readings
            for r in readings:
                if r["status"] == "active":
                    print(f"[{r['i2c_address']}] {r['name']}: {r['value']} {r['unit']}")
                else:
                    print(f"[{r['i2c_address']}] {r['name']}: OFFLINE")
            
            # Publish to MQTT
            if mqtt_publisher.publish_sensor_data(readings):
                print(f"[MQTT] Published {len(readings)} sensor readings")
            
            print("-" * 50)
            time.sleep(READ_INTERVAL)
            
        except Exception as e:
            print(f"[ERROR] {e}")
            time.sleep(READ_INTERVAL)
    
    # Cleanup
    sensor_reader.close()
    mqtt_publisher.disconnect()
    print("[INFO] Shutdown complete")


if __name__ == "__main__":
    main()

