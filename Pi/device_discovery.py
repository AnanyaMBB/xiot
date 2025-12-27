#!/usr/bin/env python3
"""
XIOT Device Auto-Discovery

Scans I2C bus for connected devices, identifies them using the XIOT protocol,
and registers them with the backend API.

Protocol:
- Send 0xFF (IDENTIFY) command to each I2C address
- Device responds with 4 bytes: [MAGIC, CLASS, SUBTYPE, CAPABILITIES]
- MAGIC must be 0xA5 to confirm it's an XIOT device

Usage:
    python3 device_discovery.py              # Run discovery once
    python3 device_discovery.py --daemon     # Run continuously
    python3 device_discovery.py --interval 30  # Custom interval (seconds)
"""

import argparse
import json
import time
import requests
import sys
import os
from datetime import datetime

# Try to import smbus2 (only available on Pi)
try:
    import smbus2
    ON_PI = True
except ImportError:
    ON_PI = False
    print("[DISCOVERY] Warning: smbus2 not available - running in simulation mode")

# =============================================================================
# CONFIGURATION
# =============================================================================

# Backend API
API_BASE_URL = os.environ.get("XIOT_API_URL", "http://192.168.137.1:8000/api")
API_TOKEN = os.environ.get("XIOT_API_TOKEN", "")  # Set via environment variable

# Baseboard identifier (unique per Pi)
BASEBOARD_ID = os.environ.get("XIOT_BASEBOARD_ID", "PI-001")

# I2C configuration
I2C_BUS = 1
I2C_SCAN_START = 0x08  # First valid I2C address
I2C_SCAN_END = 0x77    # Last valid I2C address

# Discovery protocol
XIOT_MAGIC = 0xA5
CMD_IDENTIFY = 0xFF

# Device class definitions
DEVICE_CLASSES = {
    0x01: "sensor",
    0x02: "actuator",
}

# Sensor subtypes
SENSOR_SUBTYPES = {
    0x10: "temperature",
    0x11: "humidity",
    0x12: "pressure",
    0x13: "light",
    0x14: "motion",
    0x15: "gas",
    0x16: "vibration",
    0x1F: "custom",
}

# Actuator subtypes
ACTUATOR_SUBTYPES = {
    0x20: "led",
    0x21: "relay",
    0x22: "servo",
    0x23: "motor",
    0x24: "buzzer",
    0x25: "pwm",
    0x2F: "custom",
}

# Capability flags
CAP_READ = 0x01
CAP_WRITE = 0x02
CAP_PWM = 0x04
CAP_ANALOG = 0x08
CAP_DIGITAL = 0x10


# =============================================================================
# I2C SCANNER
# =============================================================================

class I2CScanner:
    """Scans I2C bus and identifies XIOT devices."""
    
    def __init__(self, bus_num=I2C_BUS):
        self.bus = None
        self.bus_num = bus_num
        if ON_PI:
            try:
                self.bus = smbus2.SMBus(bus_num)
                print(f"[I2C] Opened bus {bus_num}")
            except Exception as e:
                print(f"[I2C] Failed to open bus {bus_num}: {e}")
    
    def scan_bus(self):
        """Scan I2C bus for all responding devices."""
        devices = []
        
        if not self.bus:
            print("[I2C] Bus not available, using simulation data")
            # Simulation mode - return fake devices for testing
            return self._simulate_devices()
        
        print(f"[I2C] Scanning addresses 0x{I2C_SCAN_START:02X} - 0x{I2C_SCAN_END:02X}...")
        
        for addr in range(I2C_SCAN_START, I2C_SCAN_END + 1):
            try:
                # Try to read a byte - if device exists, it won't throw
                self.bus.read_byte(addr)
                devices.append(addr)
                print(f"[I2C] Found device at 0x{addr:02X}")
            except IOError:
                # No device at this address
                pass
        
        print(f"[I2C] Scan complete. Found {len(devices)} devices.")
        return devices
    
    def identify_device(self, addr):
        """
        Send IDENTIFY command and read device info.
        
        Returns:
            dict with device info or None if not an XIOT device
        """
        if not self.bus:
            return self._simulate_identify(addr)
        
        try:
            # Use i2c_rdwr for precise control over the transaction
            # This sends IDENTIFY command, then reads response in separate transactions
            from smbus2 import i2c_msg
            
            # Write IDENTIFY command
            write_msg = i2c_msg.write(addr, [CMD_IDENTIFY])
            self.bus.i2c_rdwr(write_msg)
            
            # Small delay to let ATtiny process
            time.sleep(0.01)
            
            # Read 4 bytes response
            read_msg = i2c_msg.read(addr, 4)
            self.bus.i2c_rdwr(read_msg)
            response = list(read_msg)
            
            magic = response[0]
            device_class = response[1]
            subtype = response[2]
            capabilities = response[3]
            
            # Verify magic byte
            if magic != XIOT_MAGIC:
                print(f"[I2C] Device at 0x{addr:02X} is not an XIOT device (magic: 0x{magic:02X})")
                return None
            
            # Parse device info
            device_info = self._parse_device_info(addr, device_class, subtype, capabilities)
            return device_info
            
        except IOError as e:
            print(f"[I2C] Failed to identify device at 0x{addr:02X}: {e}")
            return None
    
    def _parse_device_info(self, addr, device_class, subtype, capabilities):
        """Parse raw device bytes into structured info."""
        
        class_name = DEVICE_CLASSES.get(device_class, "unknown")
        
        # Get subtype name based on class
        if device_class == 0x01:  # Sensor
            subtype_name = SENSOR_SUBTYPES.get(subtype, "custom")
        elif device_class == 0x02:  # Actuator
            subtype_name = ACTUATOR_SUBTYPES.get(subtype, "custom")
        else:
            subtype_name = "unknown"
        
        # Parse capability flags
        caps = []
        if capabilities & CAP_READ:
            caps.append("read")
        if capabilities & CAP_WRITE:
            caps.append("write")
        if capabilities & CAP_PWM:
            caps.append("pwm")
        if capabilities & CAP_ANALOG:
            caps.append("analog")
        if capabilities & CAP_DIGITAL:
            caps.append("digital")
        
        return {
            "i2c_address": f"0x{addr:02X}",
            "device_class": class_name,
            "device_type": subtype_name,
            "capabilities": caps,
            "raw": {
                "class": device_class,
                "subtype": subtype,
                "caps": capabilities,
            }
        }
    
    def _simulate_devices(self):
        """Return simulated devices for testing without hardware."""
        return [0x08]  # Simulate one device at address 8
    
    def _simulate_identify(self, addr):
        """Return simulated device info for testing."""
        if addr == 0x08:
            return {
                "i2c_address": "0x08",
                "device_class": "actuator",
                "device_type": "led",
                "capabilities": ["write", "digital"],
                "raw": {"class": 0x02, "subtype": 0x20, "caps": 0x12}
            }
        return None
    
    def discover_all(self):
        """Scan bus and identify all XIOT devices."""
        devices = []
        addresses = self.scan_bus()
        
        for addr in addresses:
            device_info = self.identify_device(addr)
            if device_info:
                devices.append(device_info)
                print(f"[DISCOVERY] Identified: {device_info['device_class']} "
                      f"({device_info['device_type']}) at {device_info['i2c_address']}")
        
        return devices


# =============================================================================
# API REGISTRATION
# =============================================================================

class DeviceRegistrar:
    """Registers discovered devices with the backend API."""
    
    def __init__(self, api_base_url, baseboard_id, token=None):
        self.api_base_url = api_base_url.rstrip('/')
        self.baseboard_id = baseboard_id
        self.session = requests.Session()
        if token:
            self.session.headers['Authorization'] = f'Token {token}'
        self.session.headers['Content-Type'] = 'application/json'
    
    def register_devices(self, devices):
        """
        Register discovered devices with the backend.
        
        Args:
            devices: List of device info dicts from I2CScanner
            
        Returns:
            dict with registration results
        """
        results = {
            "registered": [],
            "updated": [],
            "failed": [],
        }
        
        for device in devices:
            try:
                result = self._register_device(device)
                if result.get("created"):
                    results["registered"].append(device["i2c_address"])
                else:
                    results["updated"].append(device["i2c_address"])
            except Exception as e:
                print(f"[API] Failed to register {device['i2c_address']}: {e}")
                results["failed"].append({
                    "address": device["i2c_address"],
                    "error": str(e)
                })
        
        return results
    
    def _register_device(self, device):
        """Register a single device with the backend."""
        
        payload = {
            "baseboard_id": self.baseboard_id,
            "i2c_address": device["i2c_address"],
            "device_class": device["device_class"],
            "device_type": device["device_type"],
            "capabilities": device["capabilities"],
            "discovered_at": datetime.utcnow().isoformat() + "Z"
        }
        
        url = f"{self.api_base_url}/devices/register/"
        
        print(f"[API] Registering {device['device_class']} at {device['i2c_address']}...")
        
        response = self.session.post(url, json=payload, timeout=10)
        
        if response.status_code in (200, 201):
            data = response.json()
            print(f"[API] Successfully registered: {data.get('name', device['i2c_address'])}")
            return data
        else:
            raise Exception(f"API returned {response.status_code}: {response.text}")


# =============================================================================
# MAIN
# =============================================================================

def run_discovery(registrar=None):
    """Run one discovery cycle."""
    print("=" * 60)
    print(f"XIOT Device Discovery - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Baseboard: {BASEBOARD_ID}")
    print("=" * 60)
    
    # Scan and identify devices
    scanner = I2CScanner()
    devices = scanner.discover_all()
    
    if not devices:
        print("[DISCOVERY] No XIOT devices found.")
        return {"devices": [], "registered": [], "updated": [], "failed": []}
    
    print(f"\n[DISCOVERY] Found {len(devices)} XIOT device(s)")
    
    # Register with backend if registrar available
    if registrar:
        results = registrar.register_devices(devices)
        print(f"\n[RESULTS] Registered: {len(results['registered'])}, "
              f"Updated: {len(results['updated'])}, "
              f"Failed: {len(results['failed'])}")
        return {"devices": devices, **results}
    else:
        print("[DISCOVERY] No API configured - skipping registration")
        return {"devices": devices, "registered": [], "updated": [], "failed": []}


def main():
    parser = argparse.ArgumentParser(description='XIOT Device Auto-Discovery')
    parser.add_argument('--daemon', action='store_true',
                        help='Run continuously in daemon mode')
    parser.add_argument('--interval', type=int, default=30,
                        help='Discovery interval in seconds (default: 30)')
    parser.add_argument('--no-register', action='store_true',
                        help='Skip API registration (scan only)')
    parser.add_argument('--api-url', type=str, default=API_BASE_URL,
                        help=f'Backend API URL (default: {API_BASE_URL})')
    parser.add_argument('--baseboard', type=str, default=BASEBOARD_ID,
                        help=f'Baseboard ID (default: {BASEBOARD_ID})')
    
    args = parser.parse_args()
    
    # Setup registrar if not disabled
    registrar = None
    if not args.no_register:
        registrar = DeviceRegistrar(args.api_url, args.baseboard, API_TOKEN)
    
    if args.daemon:
        print(f"[DISCOVERY] Starting daemon mode (interval: {args.interval}s)")
        print("Press Ctrl+C to stop.\n")
        
        try:
            while True:
                run_discovery(registrar)
                print(f"\n[DISCOVERY] Next scan in {args.interval} seconds...\n")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\n[DISCOVERY] Stopped by user.")
    else:
        # Single run
        results = run_discovery(registrar)
        
        # Print summary
        print("\n" + "=" * 60)
        print("DISCOVERY SUMMARY")
        print("=" * 60)
        for device in results.get("devices", []):
            status = "✓ Registered" if device["i2c_address"] in results.get("registered", []) else \
                     "↻ Updated" if device["i2c_address"] in results.get("updated", []) else \
                     "✗ Failed"
            print(f"  {device['i2c_address']} | {device['device_class']:8} | "
                  f"{device['device_type']:12} | {status}")
        print("=" * 60)


if __name__ == "__main__":
    main()

