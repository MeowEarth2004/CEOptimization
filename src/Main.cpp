#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// ===== CONFIG =====
const char* ssid = "Chroencabletv"; // ชื่อ WiFi
const char* password = "Charoen@88"; // รหัสผ่าน WiFi
const char* mqtt_server = "192.168.51.45"; // IP เครื่องคอมที่รัน Python
const int mqtt_port = 1883;
const int currentPin = 34; // ขา ADC sensor กระแส
const int relayPin = 15; // ขารีเลย์

// MQTT Client
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

// Relay Pins
const int RELAY_GRID = 15;
const int RELAY_BATTERY = 16;
const int RELAY_SOLAR = 17;

// Sensor Pins
const int VOLTAGE_PIN = 34;   
const int CURRENT_PIN = 35;   

// ===== SETUP WIFI =====
void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

// ===== MQTT CALLBACK ===== 
void callback(char* topic, byte* payload, unsigned int length) {
  String cmd = "";
  for (unsigned int i=0; i<length; i++) {
    cmd += (char)payload[i];
  }
  Serial.printf("📩 Received command: %s\n", cmd.c_str());

  if (cmd == "use_grid") {
    digitalWrite(RELAY_GRID, HIGH);
    digitalWrite(RELAY_BATTERY, LOW);
    digitalWrite(RELAY_SOLAR, LOW);
  } else if (cmd == "use_battery") {
    digitalWrite(RELAY_GRID, LOW);
    digitalWrite(RELAY_BATTERY, HIGH);
    digitalWrite(RELAY_SOLAR, LOW);
  } else if (cmd == "use_solar") {
    digitalWrite(RELAY_GRID, LOW);
    digitalWrite(RELAY_BATTERY, LOW);
    digitalWrite(RELAY_SOLAR, HIGH);
  }
}

// ===== MQTT RECONNECT =====
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting MQTT...");
    if (client.connect("ESP32Client")) {
      Serial.println("Connected!");
      client.subscribe("energy/data");
    } else {
      Serial.print(".");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(relayPin, OUTPUT);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
  pinMode(RELAY_GRID, OUTPUT);
  pinMode(RELAY_BATTERY, OUTPUT);
  pinMode(RELAY_SOLAR, OUTPUT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setup_wifi(); // Reconnect WiFi
  }

  if (!client.connected()) {
    reconnect();  // Reconnect MQTT
  }
  client.loop();

  // อ่านค่า Sensor
  int rawV = analogRead(VOLTAGE_PIN);
  int rawI = analogRead(CURRENT_PIN);

  float voltage = rawV * (3.3 / 4095.0) * 4.0;  
  float current = (rawI - 2048) * (5.0 / 1024.0); 
  float power = voltage * current;

  char msg[100];
  sprintf(msg, "{\"voltage\":%.2f,\"current\":%.2f,\"power\":%.2f}", voltage, current, power);
  client.publish("energy/data", msg); // ← ใช้ topic นี้ให้ตรงกับฝั่ง Python

  Serial.println(msg);
  delay(3000);
}