import os
import json
import time
import random
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

# ===== CONFIG =====
BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8883
MQTT_USER = os.getenv('MQTT_USER')
MQTT_PASS = os.getenv('MQTT_PASS')
DATA_TOPIC = "energy/data"

# ===== Chack User/Pass =====
if not MQTT_USER or not MQTT_PASS:
    print("⚠️  Error: ไม่พบ MQTT_USER หรือ MQTT_PASS ในไฟล์ .env")
    exit()

# ===== SETUP MQTT =====
client = mqtt.Client()
client.tls_set()
client.username_pw_set(MQTT_USER, MQTT_PASS)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅  Connected to HiveMQ (Hardware Simulator Ready!)")
    else:
        print(f"❌  Connection failed code: {rc}")

client.on_connect = on_connect

print("⏳ Connecting to Broker...")
client.connect(BROKER_IP, PORT, 60)
client.loop_start()

# ===== MAIN LOOP ===== (จำลองการส่งค่า)
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