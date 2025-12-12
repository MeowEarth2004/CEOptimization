import os
import json
import time
import random
import uuid # ✅ เพิ่ม library นี้
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

# ===== CONFIG =====
BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8883
MQTT_USER = os.getenv('MQTT_USER')
MQTT_PASS = os.getenv('MQTT_PASS')
DATA_TOPIC = "energy/data"

# ===== Check User/Pass =====
if not MQTT_USER or not MQTT_PASS:
    print("⚠️  Error: ไม่พบ MQTT_USER หรือ MQTT_PASS ในไฟล์ .env")
    exit()

# ===== SETUP MQTT =====
# ✅ สร้าง ID สุ่ม : ป้องกันการโดนเตะออกจาก Server
client_id = f"hardware-{uuid.uuid4()}"
print(f"🆔 Client ID: {client_id}")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
client.tls_set()
client.username_pw_set(MQTT_USER, MQTT_PASS)

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅  Hardware Connected! (Ready to send)")
    else:
        print(f"❌  Connection failed code: {rc}")

client.on_connect = on_connect

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
        
        print(f"📤 Sent: {payload}")
        
        time.sleep(3)

except KeyboardInterrupt:
    print("\n🛑 Stopping simulator...")
    client.loop_stop()
    client.disconnect()