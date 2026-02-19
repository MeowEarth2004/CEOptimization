#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// ===== WIFI CONFIG =====
const char* ssid = "OPPO A78 5G aedl";
const char* password = "gxei9552";

// ===== MQTT CONFIG =====
const char* mqtt_server = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "CEOptimization.admin2004";
const char* mqtt_pass = "CEO.admin2004";

const char* topic_data = "energy/data";

// ===== SENSOR PINS (ESP32-S3) =====
const int VOLTAGE_PIN = 7; 
const int CURRENT_PIN = 6; 

WiFiClientSecure espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

// ตัวแปรเก็บค่า Offset อัตโนมัติ
float zeroOffsetI = 3071.0; 

void setup_wifi() {
  delay(10);
  Serial.println("\n[WiFi] Connecting...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected!");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("[MQTT] Connecting...");
    String clientId = "ESP32S3-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) { 
      Serial.println("✅ connected!");
    } else {
      delay(5000);
    }
  }
}

// ฟังก์ชันหาค่า 0 Ampere อัตโนมัติตอนเปิดเครื่อง
void calibrateCurrentSensor() {
  Serial.println("Calibrating Current Sensor... (Please make sure NO LOAD is connected)");
  long sumI = 0;
  // อ่านค่า 100 ครั้งเพื่อหาค่าเฉลี่ยที่แม่นยำ
  for (int i = 0; i < 100; i++) {
    sumI += analogRead(CURRENT_PIN);
    delay(10);
  }
  zeroOffsetI = sumI / 100.0;
  Serial.print("✅ Calibration Done! New Zero Offset: ");
  Serial.println(zeroOffsetI);
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); 
  
  // เรียกใช้ฟังก์ชันคาลิเบรตก่อนทำอย่างอื่น (สำคัญ: ตอนเปิดเครื่องห้ามต่อโหลด)
  calibrateCurrentSensor();

  setup_wifi();
  espClient.setInsecure(); 
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 1000) { 
    lastMsg = now;

    // --- 1. อ่าน Voltage (Pin 7) ---
    int rawV = analogRead(VOLTAGE_PIN);
    float voltage = (rawV / 4095.0) * 3.3 * 5.0; 
    
    // ตัดค่า Volt ลอย
    if (voltage < 5.0) voltage = 0.0;

    // --- 2. อ่าน Current (Pin 6) ---
    long sumI = 0;
    for (int i = 0; i < 50; i++) { 
      sumI += analogRead(CURRENT_PIN);
      delay(1);
    }
    float avgRawI = sumI / 50.0;

    Serial.print(">>> RAW ADC Current (Avg): ");
    Serial.println(avgRawI);

    float current = (avgRawI - zeroOffsetI) * 0.026; 

    if (abs(current) < 0.35) current = 0.0;

    float power = voltage * current;

    char msg[100];
    snprintf(msg, sizeof(msg), "{\"voltage\":%.2f,\"current\":%.2f,\"power\":%.2f}", voltage, current, power);
    
    client.publish(topic_data, msg);
    Serial.printf("📡 Send -> V: %.2f V | I: %.2f A | P: %.2f W\n", voltage, current, power);
    Serial.println("--------------------------------");
  }
}