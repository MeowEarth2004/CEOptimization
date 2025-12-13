import time
import json
import random
import uuid
import ssl
import paho.mqtt.client as mqtt

# ===== CONFIG =====
BROKER = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8884
MQTT_USER = "CEOptimization.admin2004"
MQTT_PASS = "Admin1234" # 👈 ต้องตรงกับในเว็บ HiveMQ เป๊ะๆ
DATA_TOPIC = "energy/data"

# ===== SETUP =====
client_id = f"hardware-{uuid.uuid4().hex[:6]}"
print(f"🆔 Client ID: {client_id}")

# ใช้ Version 2 เพื่อแก้ Warning สีแดง
client = mqtt.Client(client_id=client_id, transport='websockets', protocol=mqtt.MQTTv311, callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
client.ws_set_options(path="/mqtt")
client.tls_set(tls_version=ssl.PROTOCOL_TLSv1_2)
client.username_pw_set(MQTT_USER, MQTT_PASS)

# ตัวแปรเช็คสถานะ
is_connected = False

def on_connect(client, userdata, flags, rc, properties=None):
    global is_connected
    if rc == 0:
        is_connected = True
        print("✅ Hardware Connected! (เชื่อมต่อสำเร็จ)")
    elif rc == 5:
        print("❌ รหัสผ่านผิด! (Code 5) กรุณาเช็คใน HiveMQ Dashboard")
    else:
        print(f"❌ เชื่อมต่อไม่ได้ Code: {rc}")

def on_disconnect(client, userdata, flags, rc, properties=None):
    global is_connected
    is_connected = False
    print("⚠️ หลุดการเชื่อมต่อ (Disconnected)")

client.on_connect = on_connect
client.on_disconnect = on_disconnect

print("⏳ Connecting to HiveMQ...")
try:
    client.connect(BROKER, PORT, 60)
    client.loop_start()
except Exception as e:
    print(f"❌ Error: {e}")

# ===== LOOP =====
try:
    while True:
        if is_connected:
            # สุ่มเลข
            voltage = round(random.uniform(220.0, 240.0), 2)
            current = round(random.uniform(1.0, 5.0), 2)
            power = round(voltage * current, 2)
            
            # AI Logic
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
            
            client.publish(DATA_TOPIC, json.dumps(payload))
            print(f"📤 Sent: {power}W | Trend: {trend}")
        else:
            print("⏳ รอการเชื่อมต่อ... (Waiting for connection)")
        
        time.sleep(2)

except KeyboardInterrupt:
    print("Stopping...")
    client.loop_stop()