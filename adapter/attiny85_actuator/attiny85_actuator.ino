/**
 * ATtiny85 I2C Actuator Adapter with Auto-Discovery
 * 
 * This program configures the ATtiny85 as an actuator node that:
 * - Receives commands from master (Raspberry Pi) over I2C
 * - Controls output pins based on received commands
 * - Responds to IDENTIFY command (0xFF) with device info
 * 
 * I2C Address: 8 (configurable)
 * 
 * Commands:
 *   0x00 - Turn output OFF
 *   0x01 - Turn output ON
 *   0x02 - Toggle output
 *   0xFF - IDENTIFY (triggers response on next read)
 */

#include <TinyWireS.h>

#define SLAVE_ADDR 8

// Shift register pins (configured once at startup before I2C takes over PB0/PB2)
const int latchPin = 1;   // PB1
const int clockPin = 0;   // PB0 (shared with SDA - only used before I2C init)
const int dataPin = 2;    // PB2 (shared with SCL - only used before I2C init)

// Actuator output pin
const int outputPin = 3;  // PB3

// Output state
uint8_t outputState = LOW;

// Command handling
volatile uint8_t receivedCommand = 0xFF;
volatile bool hasNewCommand = false;
volatile bool identifyRequested = false;

// Commands
#define CMD_OFF      0x00
#define CMD_ON       0x01
#define CMD_TOGGLE   0x02
#define CMD_IDENTIFY 0xFF

// Device identification (for auto-discovery)
#define XIOT_MAGIC   0xA5
#define DEV_CLASS    0x02  // Actuator
#define DEV_SUBTYPE  0x20  // LED
#define DEV_CAPS     0x12  // Write + Digital

void setup_shift_register(int config_bits) {
    digitalWrite(latchPin, LOW);
    shiftOut(dataPin, clockPin, LSBFIRST, config_bits);
    digitalWrite(latchPin, HIGH);
    delay(1000);
}

void setup() {
    // Configure shift register pins BEFORE I2C initialization
    pinMode(latchPin, OUTPUT);
    pinMode(clockPin, OUTPUT);
    pinMode(dataPin, OUTPUT);
    
    // Configure shift register for actuator mode
    // Adjust config_bits based on your mux/actuator configuration
    setup_shift_register(B10010011);
    
    // Configure output pin
    pinMode(outputPin, OUTPUT);
    digitalWrite(outputPin, LOW);
    
    // Initialize as I2C slave (takes over PB0=SDA, PB2=SCL)
    TinyWireS.begin(SLAVE_ADDR);
    TinyWireS.onReceive(receiveEvent);
    TinyWireS.onRequest(requestEvent);
}

void loop() {
    // Process any received commands
    if (hasNewCommand) {
        processCommand(receivedCommand);
        hasNewCommand = false;
    }
    
    // Required for TinyWireS to work properly
    TinyWireS_stop_check();
    delay(10);
}

// I2C receive handler - receive commands from master
void receiveEvent(uint8_t numBytes) {
    if (numBytes > 0) {
        receivedCommand = TinyWireS.read();
        
        // Check for IDENTIFY command
        if (receivedCommand == CMD_IDENTIFY) {
            identifyRequested = true;
        } else {
            hasNewCommand = true;
        }
    }
    // Drain any extra bytes
    while (TinyWireS.available()) {
        TinyWireS.read();
    }
}

// I2C request handler - send data to master
void requestEvent() {
    if (identifyRequested) {
        // Send device identification (4 bytes)
        TinyWireS.write(XIOT_MAGIC);    // 0xA5
        TinyWireS.write(DEV_CLASS);     // 0x02 (actuator)
        TinyWireS.write(DEV_SUBTYPE);   // 0x20 (LED)
        TinyWireS.write(DEV_CAPS);      // 0x12 (write+digital)
        identifyRequested = false;
    } else {
        // Send current state
        TinyWireS.write(outputState);
    }
}

// Process received commands
void processCommand(uint8_t cmd) {
    switch (cmd) {
        case CMD_OFF:
            digitalWrite(outputPin, LOW);
            outputState = LOW;
            break;
        case CMD_ON:
            digitalWrite(outputPin, HIGH);
            outputState = HIGH;
            break;
        case CMD_TOGGLE:
            outputState = !outputState;
            digitalWrite(outputPin, outputState);
            break;
        default:
            // Unknown command, ignore
            break;
    }
}

