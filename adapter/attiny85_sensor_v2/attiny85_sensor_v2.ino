/**
 * ATtiny85 I2C Actuator Adapter (FIXED, PORTABLE)
 */

#include <TinyWireS.h>

#define SLAVE_ADDR 8

// Shift register pins (used ONLY before I2C starts)
const uint8_t latchPin = 1;   // PB1
const uint8_t clockPin = 0;   // PB0 (SDA after I2C)
const uint8_t dataPin  = 2;   // PB2 (SCL after I2C)

// Actuator output
const uint8_t outputPin = 3;  // PB3

// Commands
#define CMD_OFF    0x00
#define CMD_ON     0x01
#define CMD_TOGGLE 0x02

volatile uint8_t receivedCommand = 0xFF;
volatile bool hasNewCommand = false;

uint8_t outputState = LOW;

void setup_shift_register(uint8_t config_bits) {
    digitalWrite(latchPin, LOW);
    shiftOut(dataPin, clockPin, LSBFIRST, config_bits);
    digitalWrite(latchPin, HIGH);
}

void receiveEvent(uint8_t numBytes) {
    if (numBytes > 0) {
        receivedCommand = TinyWireS.read();
        hasNewCommand = true;
    }
    while (TinyWireS.available()) {
        TinyWireS.read();
    }
}

void processCommand(uint8_t cmd) {
    switch (cmd) {
        case CMD_OFF:
            outputState = LOW;
            break;
        case CMD_ON:
            outputState = HIGH;
            break;
        case CMD_TOGGLE:
            outputState = !outputState;
            break;
        default:
            break;
    }
}

void setup() {
    // Configure shift register pins
    pinMode(latchPin, OUTPUT);
    pinMode(clockPin, OUTPUT);
    pinMode(dataPin, OUTPUT);

    // Configure shift register
    setup_shift_register(B10010011);

    // Configure actuator output
    pinMode(outputPin, OUTPUT);
    analogWrite(outputPin, 0);   // HARD-disable PWM on PB3
    outputState = LOW;
    digitalWrite(outputPin, outputState);

    // Start I2C slave
    TinyWireS.begin(SLAVE_ADDR);
    TinyWireS.onReceive(receiveEvent);
}

void loop() {
    if (hasNewCommand) {
        processCommand(receivedCommand);
        hasNewCommand = false;
    }

    // KEEP OUTPUT ASSERTED
    digitalWrite(outputPin, outputState);

    // TinyWireS housekeeping
    TinyWireS_stop_check();
}
