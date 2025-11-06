#pragma once
#include <Arduino.h>

const int RELAY_GRID = 15;  // ต่อรีเลย์ไฟบ้าน
const int RELAY_BAT = 16;   // ต่อรีเลย์แบตเตอรี่

void setupRelay() {
  pinMode(RELAY_GRID, OUTPUT);
  pinMode(RELAY_BAT, OUTPUT);
  digitalWrite(RELAY_GRID, HIGH);
  digitalWrite(RELAY_BAT, LOW);
  Serial.println("Relay ready.");
}

void controlRelay(float power) {
  if (power < 100.0) {
    digitalWrite(RELAY_GRID, HIGH);
    digitalWrite(RELAY_BAT, LOW);
    Serial.println("Using Grid Power");
  } else {
    digitalWrite(RELAY_GRID, LOW);
    digitalWrite(RELAY_BAT, HIGH);
    Serial.println("Using Battery Power");
  }
}
