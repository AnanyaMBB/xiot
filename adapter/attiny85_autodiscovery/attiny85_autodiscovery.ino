/**
 * ATtiny85 I2C Adapter with Auto-Discovery
 * 
 * Unified firmware that supports:
 * - Actuator mode: receives commands and controls output
 * - Auto-discovery: responds to IDENTIFY command (0xFF) with device info
 * 
 * Configure DEVICE settings below before flashing!
 * 
 * I2C Address: Set via SLAVE_ADDR (default: 8)
 * 
 * Commands:
 *   0x00 - Turn output OFF
 *   0x01 - Turn output ON
 *   0x02 - Toggle output
 *   0xFF - IDENTIFY (triggers 4-byte response on next read)
 */

#include <TinyWireS.h>

// =============================================================================
// DEVICE CONFIGURATION - MODIFY THESE FOR EACH ADAPTER
// =============================================================================

#define SLAVE_ADDR 8  // I2C address (8-119 valid range)

// Device identification bytes (for auto-discovery)
#define XIOT_MAGIC   0xA5  // Confirms this is an XIOT device
#define DEV_CLASS    0x02  // 0x01=Sensor, 0x02=Actuator
#define DEV_SUBTYPE  0x20  // 0x20=LED, 0x21=Relay, 0x22=Servo, etc.
#define DEV_CAPS     0x12  // Capabilities: 0x02=Write, 0x10=Digital

// =============================================================================
// PIN DEFINITIONS
// =============================================================================

// Shift register pins (used ONLY before I2C starts)
const int latchPin = 1;   // PB1
const int clockPin = 0;   // PB0 (becomes SDA after I2C init)
const int dataPin = 2;    // PB2 (becomes SCL after I2C init)

// Actuator output pin
const int outputPin = 3;  // PB3

// =============================================================================
// STATE VARIABLES
// =============================================================================

uint8_t outputState = LOW;

// Command handling (volatile for ISR access)
volatile uint8_t receivedCommand = 0xFF;
volatile bool hasNewCommand = false;
volatile bool identifyRequested = false;

// Commands
#define CMD_OFF      0x00
#define CMD_ON       0x01
#define CMD_TOGGLE   0x02
#define CMD_IDENTIFY 0xFF

// =============================================================================
// SETUP FUNCTIONS
// =============================================================================

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
    setup_shift_register(B10010011);
    
    // Configure output pin
    pinMode(outputPin, OUTPUT);
    digitalWrite(outputPin, LOW);
    
    // Initialize as I2C slave (takes over PB0=SDA, PB2=SCL)
    TinyWireS.begin(SLAVE_ADDR);
    TinyWireS.onReceive(receiveEvent);
    TinyWireS.onRequest(requestEvent);
}

// =============================================================================
// MAIN LOOP
// =============================================================================

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

// =============================================================================
// I2C HANDLERS
// =============================================================================

// Called when master sends data to us
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

// Called when master requests data from us
void requestEvent() {
    if (identifyRequested) {
        // Send device identification (4 bytes)
        TinyWireS.write(XIOT_MAGIC);    // Byte 0: 0xA5
        TinyWireS.write(DEV_CLASS);     // Byte 1: Device class
        TinyWireS.write(DEV_SUBTYPE);   // Byte 2: Device subtype
        TinyWireS.write(DEV_CAPS);      // Byte 3: Capabilities
        identifyRequested = false;
    } else {
        // Send current output state
        TinyWireS.write(outputState);
    }
}

// =============================================================================
// COMMAND PROCESSING
// =============================================================================

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
