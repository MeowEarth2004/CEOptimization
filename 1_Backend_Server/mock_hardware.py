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
PORT = 8884
MQTT_USER = os.getenv('MQTT_USER')
MQTT_PASS = os.getenv('MQTT_PASS')
DATA_TOPIC = "energy/data"
COMMAND_TOPIC = "energy/command"

# ===== SETUP =====
client_id = f"hardware-ai-{uuid.uuid4().hex[:6]}"
print(f"🆔 Client ID: {client_id}")

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2, 
    client_id=client_id,
    transport='websockets'
)

client.ws_set_options(path="/mqtt")
client.tls_set(tls_version=ssl.PROTOCOL_TLSv1_2)
client.username_pw_set(MQTT_USER, MQTT_PASS)

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅ Hardware Connected! (Ready to Work)")
        client.subscribe(COMMAND_TOPIC) 
    else:
        print(f"❌ Connection failed code: {rc}")

def on_message(client, userdata, msg):
    command = msg.payload.decode()
    print(f"🚀 COMMAND RECEIVED: {command}")

client.on_connect = on_connect
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
        if client.is_connected():
            # 1. สุ่มเลขพื้นฐาน
            voltage = round(random.uniform(220.0, 240.0), 2)
            current = round(random.uniform(1.0, 5.0), 2)
            power = round(voltage * current, 2)
            
            # 2. 🧠 ส่วนสมอง AI (จำลองการวิเคราะห์)
            trend = "Normal ✅"
            if power > 1000:
                trend = "Overload ⚠️"
            elif power > 800:
                trend = "Peak Usage 📈"
            elif power < 300:
                trend = "Eco Mode 🌱"
            
            payload = {
                "voltage": voltage,
                "current": current,
                "power": power,
                "trend": trend  # <--- ส่งค่านี้เพิ่มไปให้แอปครับ!
            }

            client.publish(DATA_TOPIC, json.dumps(payload))
            print(f"📤 Sent: {payload}")
        
        time.sleep(3) # ส่งข้อมูลทุก 3 วินาที

except KeyboardInterrupt:
    print("\n🛑 Stopping...")
    client.loop_stop()
    client.disconnect()