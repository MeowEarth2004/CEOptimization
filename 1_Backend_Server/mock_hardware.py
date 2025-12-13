import os
import json
import time
import random
import uuid
import ssl
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

# ===== CONFIG =====
BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8884 # ใช้ WSS (WebSockets Secure) เพื่อความเสถียรสูงสุด
MQTT_USER = os.getenv('MQTT_USER')
MQTT_PASS = os.getenv('MQTT_PASS')
DATA_TOPIC = "energy/data"
COMMAND_TOPIC = "energy/command"

# ===== SETUP =====
client_id = f"hardware-final-{uuid.uuid4().hex[:6]}"
print(f"🆔 Client ID: {client_id}")

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2, 
    client_id=client_id,
    transport='websockets' # ✅ ใช้ WebSockets ทะลุบล็อก
)

# ตั้งค่า Path และ SSL
client.ws_set_options(path="/mqtt")
client.tls_set(tls_version=ssl.PROTOCOL_TLSv1_2)
client.username_pw_set(MQTT_USER, MQTT_PASS)

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅ Hardware Connected! (Ready to Work)")
        # ✅ Subscribe รอรับคำสั่งจากแอป
        client.subscribe(COMMAND_TOPIC) 
        print(f"👂 Listening for commands on: {COMMAND_TOPIC}")
    else:
        print(f"❌ Connection failed code: {rc}")

def on_disconnect(client, userdata, flags, rc, properties=None):
    if rc != 0:
        print(f"⚠️ DISCONNECTED! Code: {rc} (Auto-reconnecting...)")

def on_message(client, userdata, msg):
    # ✅ ฟังก์ชันรับคำสั่ง (Control)
    command = msg.payload.decode()
    print("\n" + "="*40)
    print(f"🚀  COMMAND RECEIVED: {command}")
    print("="*40 + "\n")

client.on_connect = on_connect
client.on_disconnect = on_disconnect
client.on_message = on_message

print("⏳ Connecting to HiveMQ (WSS)...")
try:
    client.connect(BROKER_IP, PORT, 60)
    client.loop_start()
except Exception as e:
    print(f"❌ Error Connecting: {e}")
    exit()

# ===== MAIN LOOP ===== 
time.sleep(2) 

try:
    while True:
        # เช็คว่าต่อติดไหม
        if client.is_connected():
            payload = {
                "voltage": round(random.uniform(225.0, 235.0), 2),
                "current": round(random.uniform(1.5, 5.0), 2),
                "power": 0
            }
            payload["power"] = round(payload["voltage"] * payload["current"], 2)

            client.publish(DATA_TOPIC, json.dumps(payload))
            print(f"📤 Sent: {payload}")
        else:
            print("⏳ Reconnecting...")
        
        time.sleep(3)

except KeyboardInterrupt:
    print("\n🛑 Stopping simulator...")
    client.loop_stop()
    client.disconnect()