# ATtiny85 Adapter Boards

The adapter boards use ATtiny85 microcontrollers as modular I2C nodes for sensors and actuators.

## Overview

Each adapter can be programmed as either:
- **Sensor Node**: Reads analog sensors and sends data on I2C request
- **Actuator Node**: Receives I2C commands to control outputs

## Hardware

### ATtiny85 Pinout

```
                  ┌──────────┐
         RESET ──►│1   A   8│◄── VCC (3.3V)
    PB3 (Output) ─│2   T   7│─ PB2/SCL (I2C Clock)
  PB4/A2 (Input) ─│3   t   6│─ PB1 (Latch)
             GND ─│4   85  5│─ PB0/SDA (I2C Data)
                  └──────────┘
```

### Component List

| Component | Value/Type | Purpose |
|-----------|------------|---------|
| ATtiny85 | DIP-8 | Microcontroller |
| Capacitor | 100nF | Decoupling |
| Resistor | 4.7kΩ × 2 | I2C pull-ups |

## Sensor Adapter

### File: `attiny85_sensor.ino`

Reads analog sensor value and sends 10-bit data over I2C.

### Configuration

```cpp
#define SLAVE_ADDR 8        // I2C address (0x08)
const int sensorInput = A2; // Analog input pin (PB4)
```

### Data Format

The adapter sends 2 bytes on I2C request:
- Byte 0: Low 8 bits of ADC value
- Byte 1: High 2 bits of ADC value (bits 8-9)

### Example Conversion (Pi Side)

```python
data = bus.read_i2c_block_data(0x08, 0, 2)
raw_value = data[0] | ((data[1] & 0x03) << 8)  # 0-1023
voltage = (raw_value / 1023.0) * 3.3
```

### Shift Register Configuration

The code configures a 74HC595 shift register before I2C initialization:

```cpp
setup_shift_register(B01100011);  // Configuration bits
```

Modify the configuration byte based on your mux/sensor routing needs.

## Actuator Adapter

### File: `attiny85_actuator.ino`

Receives commands from master and controls output pin.

### Configuration

```cpp
#define SLAVE_ADDR 8        // I2C address (0x08)
const int outputPin = 3;    // Output pin (PB3)
```

### Commands

| Command | Value | Action |
|---------|-------|--------|
| CMD_OFF | 0x00 | Turn output LOW |
| CMD_ON | 0x01 | Turn output HIGH |
| CMD_TOGGLE | 0x02 | Toggle output state |

### Sending Commands (Pi Side)

```python
import smbus2

bus = smbus2.SMBus(1)
I2C_ADDR = 0x08

# Turn ON
bus.write_byte(I2C_ADDR, 0x01)

# Turn OFF
bus.write_byte(I2C_ADDR, 0x00)

# Toggle
bus.write_byte(I2C_ADDR, 0x02)
```

## Programming the ATtiny85

### Using Arduino IDE

1. Install ATtiny85 board support:
   - File → Preferences → Additional Board URLs:
   - Add: `https://raw.githubusercontent.com/damellis/attiny/ide-1.6.x-boards-manager/package_damellis_attiny_index.json`

2. Install: Tools → Board → Boards Manager → Search "attiny"

3. Board Settings:
   - Board: ATtiny25/45/85
   - Processor: ATtiny85
   - Clock: Internal 8 MHz
   - Programmer: USBasp (or Arduino as ISP)

4. Upload: Sketch → Upload Using Programmer

### Required Library

Install TinyWireS library for I2C slave mode:
- Download from: https://github.com/nadavmatalon/TinyWireS
- Or search in Arduino Library Manager

## Multiple Adapters

To use multiple adapters on the same I2C bus, assign unique addresses:

```cpp
// Adapter 1 (Sensor)
#define SLAVE_ADDR 8  // 0x08

// Adapter 2 (Sensor)
#define SLAVE_ADDR 9  // 0x09

// Adapter 3 (Actuator)
#define SLAVE_ADDR 10 // 0x0A
```

Update Pi configuration to match:

```python
SENSOR_MAPPINGS = {
    0x08: {"name": "Temperature", "type": "temperature", ...},
    0x09: {"name": "Humidity", "type": "humidity", ...},
}

ACTUATOR_MAPPINGS = {
    0x0A: {"name": "LED", "type": "relay"},
}
```

## Troubleshooting

### I2C Not Responding

1. Check power connections (3.3V and GND)
2. Verify pull-up resistors are installed
3. Run `i2cdetect -y 1` to scan bus
4. Check ATtiny85 fuses are set for 8MHz internal

### Inconsistent Readings

1. Add decoupling capacitor (100nF) near VCC
2. Increase averaging samples in code
3. Check sensor wiring and connections

### Programming Fails

1. Verify programmer connections
2. Check ATtiny85 fuse settings
3. Try slower programming speed

