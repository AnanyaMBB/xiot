"""
Read sensor data from ATtiny85 sensor adapter.

Usage:
    python3 read_sensor.py
"""

import smbus2
import time

I2C_BUS = 1
ATTINY_ADDR = 8

bus = smbus2.SMBus(I2C_BUS)

print("Reading sensor from ATtiny85...")
print("Press Ctrl+C to exit")
print("-" * 30)

try:
    while True:
        try:
            # Read 2 bytes (10-bit ADC value, LSB first)
            data = bus.read_i2c_block_data(ATTINY_ADDR, 0, 2)
            sensor_value = data[0] | ((data[1] & 0x03) << 8)
            voltage = (sensor_value / 1023.0) * 3.3
            print(f"Sensor: {sensor_value:4d} | {voltage:.2f}V")
        except IOError:
            print("Error: Sensor adapter disconnected!")
        
        time.sleep(1)

except KeyboardInterrupt:
    print("\nExiting...")
finally:
    bus.close()

