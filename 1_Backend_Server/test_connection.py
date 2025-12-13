import os
import time
import uuid
import ssl
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8883 # ใช้ Port ปกติก่อน
MQTT_USER = os.getenv('MQTT_USER')
MQTT_PASS = os.getenv('MQTT_PASS')

client_id = f"test-conn-{uuid.uuid4()}"
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
client.tls_set(tls_version=ssl.PROTOCOL_TLSv1_2)
client.username_pw_set(MQTT_USER, MQTT_PASS)

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅ CONNECTED! (Waiting quietly...)")
    else:
        print(f"❌ Connection Failed: {rc}")

def on_disconnect(client, userdata, flags, rc, properties=None):
    print(f"⚠️ DISCONNECTED! Code: {rc}")

client.on_connect = on_connect
client.on_disconnect = on_disconnect

print("⏳ Connecting...")
client.connect(BROKER_IP, PORT, 60)
client.loop_start()

# นั่งเฉยๆ 20 วินาที ไม่ส่งข้อมูล
try:
    for i in range(20):
        time.sleep(1)
        print(f"⏱️ {i+1}s - Still connected? {client.is_connected()}")
except KeyboardInterrupt:
    pass

client.loop_stop()