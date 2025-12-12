import os
import json
import time
import random
import uuid
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

# ===== CONFIG =====
BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8883
MQTT_USER = os.getenv('MQTT_USER')
MQTT_PASS = os.getenv('MQTT_PASS')
DATA_TOPIC = "energy/data"
COMMAND_TOPIC = "energy/command"  # ✅ เพิ่ม Topic สำหรับรับคำสั่ง

# ===== Check User/Pass =====
if not MQTT_USER or not MQTT_PASS:
    print("⚠️  Error: ไม่พบ MQTT_USER หรือ MQTT_PASS ในไฟล์ .env")
    exit()

# ===== SETUP MQTT =====
client_id = f"hardware-{uuid.uuid4()}"
print(f"🆔 Client ID: {client_id}")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
client.tls_set()
client.username_pw_set(MQTT_USER, MQTT_PASS)

# ✅ ฟังก์ชันเมื่อต่อเน็ตติด
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅ Hardware Connected! (Ready to send & receive)")
        # ติดหูฟังรอรับคำสั่งทันที
        client.subscribe(COMMAND_TOPIC)
        print(f"👂 Listening for commands on: {COMMAND_TOPIC}")
    else:
        print(f"❌ Connection failed code: {rc}")

# ✅ ฟังก์ชันเมื่อมีคำสั่งส่งเข้ามา
def on_message(client, userdata, msg):
    command = msg.payload.decode()
    print(f"\n🔔 ! COMMAND RECEIVED ! 🔔")
    print(f"👉 Order: {command}")
    print("--------------------------------\n")

client.on_connect = on_connect
client.on_message = on_message # ผูกฟังก์ชันรับข้อความ

print("⏳ Connecting to Broker...")
try:
    client.connect(BROKER_IP, PORT, 60)
    client.loop_start()
except Exception as e:
    print(f"❌ Error Connecting: {e}")
    exit()

# ===== MAIN LOOP ===== 
try:
    while True:
        voltage = round(random.uniform(225.0, 235.0), 2)
        current = round(random.uniform(1.5, 5.0), 2)
        power = round(voltage * current, 2)

        payload = {
            "voltage": voltage,
            "current": current,
            "power": power
        }

        client.publish(DATA_TOPIC, json.dumps(payload))
        
        # print(f"📤 Sent: {payload}") # ปิดอันนี้ไว้ก่อน จะได้ไม่รกตาตอนรอดูคำสั่ง
        
        time.sleep(3)

except KeyboardInterrupt:
    print("\n🛑 Stopping simulator...")
    client.loop_stop()
    client.disconnect()