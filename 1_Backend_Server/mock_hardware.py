import time
import json
import random
import uuid
import ssl
import paho.mqtt.client as mqtt

# ===== CONFIG (ฝังรหัสตรงนี้เลย ชัวร์กว่า) =====
BROKER = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8884
MQTT_USER = "CEOptimization.admin2004"
MQTT_PASS = "Admin1234"
DATA_TOPIC = "energy/data"

# ===== SETUP =====
client_id = f"hardware-{uuid.uuid4().hex[:6]}"
print(f"🆔 Client ID: {client_id}")

client = mqtt.Client(client_id=client_id, transport='websockets')
client.ws_set_options(path="/mqtt")
client.tls_set(tls_version=ssl.PROTOCOL_TLSv1_2)
client.username_pw_set(MQTT_USER, MQTT_PASS)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Hardware Connected! (พร้อมส่งข้อมูลแล้ว)")
    else:
        print(f"❌ Connection Failed code: {rc}")

client.on_connect = on_connect

print("⏳ Connecting to HiveMQ...")
try:
    client.connect(BROKER, PORT, 60)
    client.loop_start()
except Exception as e:
    print(f"❌ Error: {e}")

# ===== LOOP ส่งข้อมูล =====
try:
    while True:
        # สุ่มเลขจำลอง
        voltage = round(random.uniform(220.0, 240.0), 2)
        current = round(random.uniform(1.0, 5.0), 2)
        power = round(voltage * current, 2)
        
        # คำนวณ AI Trend
        trend = "Normal ✅"
        if power > 1000: trend = "Overload ⚠️"
        elif power > 800: trend = "Peak Usage 📈"
        elif power < 300: trend = "Eco Mode 🌱"

        payload = {
            "voltage": voltage,
            "current": current,
            "power": power,
            "trend": trend
        }
        
        # ส่งขึ้น Cloud
        client.publish(DATA_TOPIC, json.dumps(payload))
        print(f"📤 Sent: {power}W | Trend: {trend}")
        time.sleep(2)

except KeyboardInterrupt:
    print("Stopping...")
    client.loop_stop()