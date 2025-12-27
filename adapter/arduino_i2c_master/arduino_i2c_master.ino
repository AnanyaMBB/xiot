/**
 * Arduino I2C master
 * Toggles ATtiny85 PB3 every few seconds
 */

#include <Wire.h>

#define ATTINY_ADDR 8
#define CMD_OFF 0x00
#define CMD_ON  0x01

void sendCmd(uint8_t cmd) {
    Wire.beginTransmission(ATTINY_ADDR);
    Wire.write(cmd);
    Wire.endTransmission();
}

void setup() {
    Wire.begin();
    delay(1000);  // let ATtiny boot
}

void loop() {
    sendCmd(CMD_ON);
    delay(3000);   // ON for 3 seconds

    sendCmd(CMD_OFF);
    delay(3000);   // OFF for 3 seconds
}
