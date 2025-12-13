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
DATA_TOPIC = "energy/data"     # 👈 เช็คคำนี้ต้องตรงกับ Main.py เป๊ะๆ
COMMAND_TOPIC = "energy/command"

# ===== SETUP =====
client_id = f"hardware-{uuid.uuid4()}"
print(f"🆔 Client ID: {client_id}")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
client.tls_set()
client.username_pw_set(MQTT_USER, MQTT_PASS)

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅ Hardware Connected! (Stable)")
        client.subscribe(COMMAND_TOPIC)
    else:
        print(f"❌ Connection failed code: {rc}")

# ✅ เพิ่มตัวเช็ค: ทำไมถึงหลุด?
def on_disconnect(client, userdata, flags, rc, properties=None):
    print(f"⚠️ DISCONNECTED! Code: {rc}")
    if rc != 0:
        print("   👉 (Server/Network kicked us out)")

def on_message(client, userdata, msg):
    print(f"\n🔔 COMMAND: {msg.payload.decode()}\n")

client.on_connect = on_connect
client.on_disconnect = on_disconnect # ผูกฟังก์ชัน
client.on_message = on_message

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
        payload = {
            "voltage": round(random.uniform(225.0, 235.0), 2),
            "current": round(random.uniform(1.5, 5.0), 2),
            "power": 0 
        }
        payload["power"] = round(payload["voltage"] * payload["current"], 2)

        client.publish(DATA_TOPIC, json.dumps(payload))
        print(f"📤 Sent: {payload}")
        
        time.sleep(3) # ส่งทุก 3 วินาที

except KeyboardInterrupt:
    print("\n🛑 Stopping simulator...")
    client.loop_stop()
    client.disconnect()