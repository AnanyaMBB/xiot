#include <TinyWireS.h>

#define SLAVE_ADDR 8

// Shift register pins (configured once at startup before I2C takes over PB0/PB2)
const int latchPin = 1;   // PB1
const int clockPin = 0;   // PB0 (shared with SDA - only used before I2C init)
const int dataPin = 2;    // PB2 (shared with SCL - only used before I2C init)

// Other pins
const int sensorInput = A2;  // PB4
const int ledPin = 3;        // PB3

// Global variables
uint16_t sensorValue = 0;
uint8_t ledState = LOW;

// Command handling - use 0xFF as "no command" since 0x00 is a valid command (LED OFF)
volatile uint8_t receivedCommand = 0xFF;
volatile bool hasNewCommand = false;

// LED Commands
#define CMD_LED_OFF    0x00
#define CMD_LED_ON     0x01
#define CMD_LED_TOGGLE 0x02

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
    
    // Configure shift register (must happen before TinyWireS.begin())
    // After this, PB0 and PB2 will be taken over by I2C
    setup_shift_register(B01100011);
    
    // Configure other pins
    pinMode(ledPin, OUTPUT);
    pinMode(sensorInput, INPUT);
    digitalWrite(ledPin, LOW);
    
    analogReference(DEFAULT);
    
    // Initialize as I2C slave (takes over PB0=SDA, PB2=SCL)
    TinyWireS.begin(SLAVE_ADDR);
    TinyWireS.onRequest(requestEvent);
    TinyWireS.onReceive(receiveEvent);
}

void loop() {
    // Read sensor with averaging
    sensorValue = 0;
    for (int i = 0; i < 5; i++) {
        sensorValue += analogRead(sensorInput);
        delay(2);
    }
    sensorValue = sensorValue / 5;
    
    // Process any received commands (using flag instead of checking value)
    if (hasNewCommand) {
        processCommand(receivedCommand);
        hasNewCommand = false;
    }
    
    // Required for TinyWireS to work properly
    TinyWireS_stop_check();
    delay(50);
}

// I2C request handler - send sensor data (2 bytes, LSB first)
void requestEvent() {
    TinyWireS.write((uint8_t)(sensorValue & 0xFF));        // Low byte
    TinyWireS.write((uint8_t)((sensorValue >> 8) & 0x03)); // High byte (2 bits)
}

// I2C receive handler - receive commands from master
void receiveEvent(uint8_t numBytes) {
    if (numBytes > 0) {
        receivedCommand = TinyWireS.read();
        hasNewCommand = true;  // Set flag so even 0x00 commands are processed
    }
    // Drain any extra bytes
    while (TinyWireS.available()) {
        TinyWireS.read();
    }
}

// Process received commands
void processCommand(uint8_t cmd) {
    switch (cmd) {
        case CMD_LED_OFF:
            digitalWrite(ledPin, LOW);
            ledState = LOW;
            break;
        case CMD_LED_ON:
            digitalWrite(ledPin, HIGH);
            ledState = HIGH;
            break;
        case CMD_LED_TOGGLE:
            ledState = !ledState;
            digitalWrite(ledPin, ledState);
            break;
        default:
            // Unknown command, ignore
            break;
    }
}

