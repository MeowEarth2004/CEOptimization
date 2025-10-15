#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// ===== WIFI CONFIG =====
const char* ssid = "Chroencabletv";          // ชื่อ WiFi
const char* password = "Charoen@88";         // รหัสผ่าน WiFi

// ===== MQTT CONFIG =====
const char* mqtt_server = "192.168.51.45";   // IP เครื่องที่รัน Python
const int mqtt_port = 1883;
const char* mqtt_topic = "energy/data";      // ต้องตรงกับฝั่ง Python

// ===== RELAY PINS =====
const int RELAY_GRID    = 15;
const int RELAY_BATTERY = 16;
const int RELAY_SOLAR   = 17;

// ===== SENSOR PINS =====
const int VOLTAGE_PIN = 34;   // ขาวัดแรงดัน
const int CURRENT_PIN = 35;   // ขาวัดกระแส

// ===== MQTT CLIENT =====
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

// ===== WIFI CONNECT =====
void setup_wifi() {
  delay(10);
  Serial.println("\n[WiFi] Connecting...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// ===== MQTT CALLBACK =====
void callback(char* topic, byte* payload, unsigned int length) {
  String cmd = "";
  for (unsigned int i = 0; i < length; i++) {
    cmd += (char)payload[i];
  }
  Serial.printf("📩 Received command: %s\n", cmd.c_str());

  if (cmd == "use_grid") {
    digitalWrite(RELAY_GRID, HIGH);
    digitalWrite(RELAY_BATTERY, LOW);
    digitalWrite(RELAY_SOLAR, LOW);
  } 
  else if (cmd == "use_battery") {
    digitalWrite(RELAY_GRID, LOW);
    digitalWrite(RELAY_BATTERY, HIGH);
    digitalWrite(RELAY_SOLAR, LOW);
  } 
  else if (cmd == "use_solar") {
    digitalWrite(RELAY_GRID, LOW);
    digitalWrite(RELAY_BATTERY, LOW);
    digitalWrite(RELAY_SOLAR, HIGH);
  }
}

// ===== MQTT RECONNECT =====
void reconnect() {
  while (!client.connected()) {
    Serial.print("[MQTT] Connecting...");
    if (client.connect("ESP32Client")) {
      Serial.println("✅ connected!");
      client.subscribe(mqtt_topic);
    } else {
      Serial.print(" failed, rc=");
      Serial.print(client.state());
      Serial.println(" retry in 2 seconds");
      delay(2000);
    }
  }
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  pinMode(RELAY_GRID, OUTPUT);
  pinMode(RELAY_BATTERY, OUTPUT);
  pinMode(RELAY_SOLAR, OUTPUT);

  // Shotdown and Reset to power on.
  digitalWrite(RELAY_GRID, LOW);
  digitalWrite(RELAY_BATTERY, LOW);
  digitalWrite(RELAY_SOLAR, LOW);

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// ===== LOOP =====
void loop() {
  // ตรวจสอบ WiFi
  if (WiFi.status() != WL_CONNECTED) {
    setup_wifi();
  }

  // ตรวจสอบ MQTT
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // อ่านค่า Sensor
  int rawV = analogRead(VOLTAGE_PIN);
  int rawI = analogRead(CURRENT_PIN);

  // ===== คำนวณค่า (ตัวอย่าง scaling) =====
  float voltage = rawV * (3.3 / 4095.0) * 4.0;    // สามารถปรับตามเซนเซอร์จริงได้
  float current = (rawI - 2048) * (5.0 / 1024.0); // Offset กลาง ADC
  float power   = voltage * current;

  // ===== ส่งข้อมูล JSON ผ่าน MQTT =====
  char msg[100];
  sprintf(msg, "{\"voltage\":%.2f,\"current\":%.2f,\"power\":%.2f}", voltage, current, power);
  client.publish(mqtt_topic, msg);

  Serial.printf("📡 Send -> V: %.2f V | I: %.2f A | P: %.2f W\n", voltage, current, power);

  delay(3000);
}
