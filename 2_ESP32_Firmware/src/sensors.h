#pragma once
#include <Arduino.h>

float readVoltage() {
  return 220.0 + random(-5, 5); // จำลองแรงดัน
}

float readCurrent() {
  return 1.2 + random(-10, 10) / 100.0; // จำลองกระแส
}

void setupSensors() {
  Serial.println("Sensors initialized.");
}
