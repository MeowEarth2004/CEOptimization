import os
import json
import time
import random
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# โหลดค่า Config จากไฟล์ .env (ที่เดียวกับ Main.py)
load_dotenv()

# ===== CONFIG =====
BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8883
MQTT_USER = os.getenv('MQTT_USER')
MQTT_PASS = os.getenv('MQTT_PASS')
DATA_TOPIC = "energy/data"

# เช็คว่ามี User/Pass ไหม
if not MQTT_USER or not MQTT_PASS:
    print("⚠️  Error: ไม่พบ MQTT_USER หรือ MQTT_PASS ในไฟล์ .env")
    exit()

# ===== SETUP MQTT =====
client = mqtt.Client()
client.tls_set() # สำคัญ! เพราะ HiveMQ Cloud ใช้ SSL
client.username_pw_set(MQTT_USER, MQTT_PASS)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅  Connected to HiveMQ (Hardware Simulator Ready!)")
    else:
        print(f"❌  Connection failed code: {rc}")

client.on_connect = on_connect

print("⏳ Connecting to Broker...")
client.connect(BROKER_IP, PORT, 60)
client.loop_start() # รัน Background thread

# ===== MAIN LOOP (จำลองการส่งค่า) =====
try:
    while True:
        # 1. สุ่มค่าให้ดูสมจริง (Voltage แกว่งนิดๆ, Current เปลี่ยนตามโหลด)
        voltage = round(random.uniform(225.0, 235.0), 2)  # ไฟบ้าน 220-230V
        current = round(random.uniform(1.5, 5.0), 2)      # กระแส 1.5 - 5 Amp
        power = round(voltage * current, 2)               # Power = V * I

        # 2. สร้างข้อมูล JSON
        payload = {
            "voltage": voltage,
            "current": current,
            "power": power
        }

        # 3. ส่งขึ้น MQTT (เหมือนที่ ESP32 ทำ)
        client.publish(DATA_TOPIC, json.dumps(payload))
        
        print(f"📤 Sent: {payload}")
        
        # 4. รอ 3 วินาที แล้วส่งใหม่
        time.sleep(3)

except KeyboardInterrupt:
    print("\n🛑 Stopping simulator...")
    client.loop_stop()
    client.disconnect()