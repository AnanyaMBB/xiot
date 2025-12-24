"""
Send commands to ATtiny85 actuator adapter.

Usage:
    python3 send_command.py on
    python3 send_command.py off
    python3 send_command.py toggle
"""

import smbus2
import sys

I2C_BUS = 1
ATTINY_ADDR = 8

# Commands (matching ATtiny CMD_* defines)
COMMANDS = {
    'off': 0x00,
    'on': 0x01,
    'toggle': 0x02,
}

def send_command(cmd_name):
    """Send a command to the actuator adapter."""
    if cmd_name not in COMMANDS:
        print(f"Unknown command: {cmd_name}")
        print(f"Available commands: {', '.join(COMMANDS.keys())}")
        return False
    
    try:
        bus = smbus2.SMBus(I2C_BUS)
        bus.write_byte(ATTINY_ADDR, COMMANDS[cmd_name])
        bus.close()
        print(f"Sent command: {cmd_name.upper()}")
        return True
    except IOError as e:
        print(f"Error: Could not send command ({e})")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 send_command.py <command>")
        print(f"Commands: {', '.join(COMMANDS.keys())}")
        sys.exit(1)
    
    cmd = sys.argv[1].lower()
    success = send_command(cmd)
    sys.exit(0 if success else 1)

