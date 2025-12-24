/**
 * ATtiny85 I2C Sensor Adapter
 * 
 * This program configures the ATtiny85 as a sensor node that:
 * - Reads analog sensor data
 * - Sends data to master (Raspberry Pi) on I2C request
 * 
 * I2C Address: 8 (configurable)
 * Data format: 2 bytes (10-bit ADC value, LSB first)
 */

#include <TinyWireS.h>

#define SLAVE_ADDR 8

// Shift register pins (configured once at startup before I2C takes over PB0/PB2)
const int latchPin = 1;   // PB1
const int clockPin = 0;   // PB0 (shared with SDA - only used before I2C init)
const int dataPin = 2;    // PB2 (shared with SCL - only used before I2C init)

// Sensor pin
const int sensorInput = A2;  // PB4

// Sensor data
uint16_t sensorValue = 0;

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
    
    // Configure shift register for sensor mode
    // Adjust config_bits based on your mux/sensor configuration
    setup_shift_register(B01100011);
    
    // Configure sensor pin
    pinMode(sensorInput, INPUT);
    analogReference(DEFAULT);
    
    // Initialize as I2C slave (takes over PB0=SDA, PB2=SCL)
    TinyWireS.begin(SLAVE_ADDR);
    TinyWireS.onRequest(requestEvent);
}

void loop() {
    // Read sensor with averaging for stability
    sensorValue = 0;
    for (int i = 0; i < 5; i++) {
        sensorValue += analogRead(sensorInput);
        delay(2);
    }
    sensorValue = sensorValue / 5;
    
    // Required for TinyWireS to work properly
    TinyWireS_stop_check();
    delay(50);
}

// I2C request handler - send sensor data (2 bytes, LSB first)
void requestEvent() {
    TinyWireS.write((uint8_t)(sensorValue & 0xFF));        // Low byte
    TinyWireS.write((uint8_t)((sensorValue >> 8) & 0x03)); // High byte (2 bits)
}

