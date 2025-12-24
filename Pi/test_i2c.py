"""Simple I2C test script for ATtiny85."""

import smbus2
import time

bus = smbus2.SMBus(1)
ATTINY_ADDR = 8

print("Reading sensor data from ATtiny85...")
print("Press Ctrl+C to exit")
print("-" * 30)

while True:
    try:
        data = bus.read_i2c_block_data(ATTINY_ADDR, 0, 2)
        sensor_value = data[0] | ((data[1] & 0x03) << 8)
        print(f"Sensor: {sensor_value}")
    except IOError:
        print("Error: ATtiny disconnected!")
    
    time.sleep(1)

