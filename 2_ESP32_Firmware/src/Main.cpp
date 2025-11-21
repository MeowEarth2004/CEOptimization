#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// ===== WIFI CONFIG =====
const char* ssid = "Chroencabletv";
const char* password = "Charoen@88";

// ===== MQTT CONFIG =====
const char* mqtt_server = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "CEOptimization.admin2004";
const char* mqtt_pass = "CEO.admin2004";

// หัวข้อ MQTT
const char* topic_data = "energy/data";       // ส่งข้อมูล Sensor ไปที่นี่
const char* topic_command = "energy/command"; // รอรับคำสั่งจากที่นี่

// ===== RELAY PINS =====
const int RELAY_GRID    = 15;
const int RELAY_BATTERY = 16;
const int RELAY_SOLAR   = 17;

// ===== SENSOR PINS =====
const int VOLTAGE_PIN = 34;
const int CURRENT_PIN = 35;

// ===== MQTT CLIENT =====
WiFiClientSecure espClient;
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

  // สลับรีเลย์ตามคำสั่ง
  if (cmd == "use_grid") {
    digitalWrite(RELAY_GRID, HIGH);   // ตัวอย่าง: เปิด Grid (Active HIGH)
    digitalWrite(RELAY_BATTERY, LOW);
    digitalWrite(RELAY_SOLAR, LOW);
    Serial.println("Switched to: GRID");
  } 
  else if (cmd == "use_battery") {
    digitalWrite(RELAY_GRID, LOW);
    digitalWrite(RELAY_BATTERY, HIGH);
    digitalWrite(RELAY_SOLAR, LOW);
    Serial.println("Switched to: BATTERY");
  } 
  else if (cmd == "use_solar") {
    digitalWrite(RELAY_GRID, LOW);
    digitalWrite(RELAY_BATTERY, LOW);
    digitalWrite(RELAY_SOLAR, HIGH);
    Serial.println("Switched to: SOLAR");
  }
}

// ===== MQTT RECONNECT =====
void reconnect() {
  while (!client.connected()) {
    Serial.print("[MQTT] Connecting...");
    
    // สร้าง Client ID แบบสุ่ม เพื่อไม่ให้ซ้ำกับ Backend
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    // เชื่อมต่อด้วย User/Pass ที่ถูกต้อง
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) { 
      Serial.println("✅ connected!");
      // Subscribe หัวข้อ Command เพื่อรอรับคำสั่ง
      client.subscribe(topic_command); 
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  
  // ตั้งค่า Pin
  pinMode(RELAY_GRID, OUTPUT);
  pinMode(RELAY_BATTERY, OUTPUT);
  pinMode(RELAY_SOLAR, OUTPUT);
  
  // เริ่มต้นแบบปิดหมด (หรือเปิด Grid เป็นค่า Default)
  digitalWrite(RELAY_GRID, HIGH); // เปิด Grid ก่อนเพื่อความปลอดภัย
  digitalWrite(RELAY_BATTERY, LOW);
  digitalWrite(RELAY_SOLAR, LOW);

  setup_wifi();
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// ===== LOOP =====
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  unsigned long now = millis();
  if (now - lastMsg > 3000) { // ส่งข้อมูลทุก 3 วินาที
    lastMsg = now;

    // อ่านค่า Sensor (นี่คือสูตรคำนวณเบื้องต้น คุณต้อง Calibrate หน้างานอีกที)
    int rawV = analogRead(VOLTAGE_PIN);
    int rawI = analogRead(CURRENT_PIN);

    // สูตรสมมติ: (ค่าดิบ / 4095) * แรงดันอ้างอิง * อัตราส่วนแบ่งแรงดัน
    float voltage = (rawV / 4095.0) * 3.3 * 5.0; // เช่น Voltage Divider 1:5
    
    // สูตรสมมติ ACS712: (ค่าดิบ - ค่ากลาง) * สเกล
    // ค่ากลาง ADC ESP32 ~1800-2000 (ไม่เป๊ะเหมือน Arduino 5V)
    float current = (rawI - 2000) * 0.02; 
    
    // กรองค่า Noise (ถ้ากระแสติดลบ หรือน้อยมาก ให้เป็น 0)
    if (current < 0.05) current = 0;
    
    float power = voltage * current;

    // สร้าง JSON String
    char msg[100];
    snprintf(msg, sizeof(msg), "{\"voltage\":%.2f,\"current\":%.2f,\"power\":%.2f}", voltage, current, power);
    
    // ส่งข้อมูล
    client.publish(topic_data, msg);
    Serial.printf("📡 Send -> V: %.2f V | I: %.2f A | P: %.2f W\n", voltage, current, power);
  }
}
