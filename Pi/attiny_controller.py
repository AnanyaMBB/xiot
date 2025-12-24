"""
Raspberry Pi I2C controller for ATtiny85 adapter board.

Wiring (3.3V setup):
    - Pi 3.3V  -> ATtiny VCC
    - Pi GND   -> ATtiny GND  
    - Pi SDA   -> ATtiny PB0 (with 4.7k pull-up to 3.3V)
    - Pi SCL   -> ATtiny PB2 (with 4.7k pull-up to 3.3V)

Usage:
    python3 attiny_controller.py
"""

import smbus2
import time

# I2C Configuration
I2C_BUS = 1       # Use 1 for Pi 3/4/5, use 0 for older models
ATTINY_ADDR = 8   # Matches SLAVE_ADDR in ATtiny code

# LED Commands (matching ATtiny CMD_* defines)
CMD_LED_OFF = 0x00
CMD_LED_ON = 0x01
CMD_LED_TOGGLE = 0x02


class ATtinyController:
    """Controller for ATtiny85 I2C slave device."""
    
    def __init__(self, bus_num=I2C_BUS, addr=ATTINY_ADDR):
        self.bus = smbus2.SMBus(bus_num)
        self.addr = addr
        
    def read_sensor(self):
        """
        Read the 10-bit sensor value from ATtiny.
        
        Returns:
            int: Sensor value (0-1023) or None on error
        """
        try:
            # Read 2 bytes from ATtiny (LSB first)
            data = self.bus.read_i2c_block_data(self.addr, 0, 2)
            # Reconstruct 10-bit value
            sensor_value = data[0] | ((data[1] & 0x03) << 8)
            return sensor_value
        except IOError as e:
            print(f"I2C read error: {e}")
            return None
    
    def send_command(self, cmd):
        """
        Send a command byte to ATtiny.
        
        Args:
            cmd: Command byte to send
            
        Returns:
            bool: True on success, False on error
        """
        try:
            self.bus.write_byte(self.addr, cmd)
            return True
        except IOError as e:
            print(f"I2C write error: {e}")
            return False
    
    def led_on(self):
        """Turn LED on."""
        return self.send_command(CMD_LED_ON)
    
    def led_off(self):
        """Turn LED off."""
        return self.send_command(CMD_LED_OFF)
    
    def led_toggle(self):
        """Toggle LED state."""
        return self.send_command(CMD_LED_TOGGLE)
    
    def close(self):
        """Close the I2C bus."""
        self.bus.close()


def main():
    """Main loop - read sensor and toggle LED."""
    attiny = ATtinyController()
    
    print("ATtiny85 I2C Controller")
    print("Press Ctrl+C to exit")
    print("-" * 30)
    
    try:
        while True:
            # Read sensor value
            sensor_value = attiny.read_sensor()
            
            if sensor_value is not None:
                # Convert to voltage (3.3V reference, 10-bit ADC)
                voltage = (sensor_value / 1023.0) * 3.3
                print(f"Sensor: {sensor_value:4d} | {voltage:.2f}V")
            else:
                print("Error: Could not read sensor (device disconnected?)")
            
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nExiting...")
    finally:
        attiny.close()


if __name__ == "__main__":
    main()

