import os
import json
import time
import random
import paho.mqtt.client as mqtt

# ===== CONFIG (HARDCODED) =====
# ใส่รหัสตรงๆ เพื่อความชัวร์ 100%
BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8883
MQTT_USER = "CEOptimization.admin2004"
MQTT_PASS = "CEO.admin2004"
DATA_TOPIC = "energy/data"

# ===== SETUP MQTT =====
# ใช้ Callback API Version 2 เพื่อรองรับ Library ใหม่ๆ
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.tls_set()
client.username_pw_set(MQTT_USER, MQTT_PASS)

def on_connect(client, userdata, flags, rc, properties):
    if rc == 0:
        print("✅  Connected to HiveMQ (Hardware Simulator Ready!)")
    else:
        # rc จะแสดงเป็นข้อความ Error โดยตรงในเวอร์ชันใหม่
        print(f"❌  Connection failed: {rc}")

client.on_connect = on_connect

print(f"⏳ Connecting to {BROKER_IP}...")
try:
    client.connect(BROKER_IP, PORT, 60)
    client.loop_start()

    # ===== MAIN LOOP =====
    while True:
        # จำลองค่า Voltage (225-235V)
        voltage = round(random.uniform(225.0, 235.0), 2)
        # จำลองค่า Current (1.5-5.0A)
        current = round(random.uniform(1.5, 5.0), 2)
        # คำนวณ Power
        power = round(voltage * current, 2)

        payload = {
            "voltage": voltage,
            "current": current,
            "power": power
        }

        client.publish(DATA_TOPIC, json.dumps(payload))
        
        print(f"📤 Sent: {payload}")
        
        time.sleep(3) # ส่งทุก 3 วินาที

except KeyboardInterrupt:
    print("\n🛑 Stopping simulator...")
    client.loop_stop()
    client.disconnect()
except Exception as e:
    print(f"\n❌ Error: {e}")