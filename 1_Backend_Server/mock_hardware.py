import os
import json
import time
import random
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# โหลดค่าจาก .env
load_dotenv()

# ===== CONFIG =====
BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8883
MQTT_USER = os.getenv('MQTT_USER')
MQTT_PASS = os.getenv('MQTT_PASS')

DATA_TOPIC = "energy/data"      # ช่องส่งข้อมูล (Hardware -> Server)
COMMAND_TOPIC = "energy/command" # ช่องรับคำสั่ง (Server -> Hardware)

# ===== Check User/Pass =====
if not MQTT_USER or not MQTT_PASS:
    print("⚠️  Error: ไม่พบ MQTT_USER หรือ MQTT_PASS ในไฟล์ .env")
    exit()

# ===== SETUP MQTT =====
client = mqtt.Client()
client.tls_set()
client.username_pw_set(MQTT_USER, MQTT_PASS)

# สถานะจำลอง (เก็บไว้ดูเล่นว่าตอนนี้ใช้ไฟอะไรอยู่)
current_source = "GRID" 

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅  Hardware Simulator Connected!")
        # 🟢 สำคัญ: บอก Broker ว่าขอฟังคำสั่งจาก Server ด้วย
        client.subscribe(COMMAND_TOPIC)
        print(f"👂 Listening for commands on: {COMMAND_TOPIC}")
    else:
        print(f"❌  Connection failed code: {rc}")

# 🟢 ฟังก์ชันใหม่: ทำงานเมื่อได้รับคำสั่งจากแอป
def on_message(client, userdata, msg):
    global current_source
    try:
        command = msg.payload.decode()
        print(f"\n📩 RECEIVED COMMAND: [ {command} ]")
        
        # จำลองการทำงานจริง (Switching Logic)
        if command == "use_battery":
            print("   ⚙️  Switching Relay -> BATTERY SOURCE 🔋")
            current_source = "BATTERY"
        elif command == "use_solar":
            print("   ⚙️  Switching Relay -> SOLAR SOURCE ☀️")
            current_source = "SOLAR"
        elif command == "use_grid":
            print("   ⚙️  Switching Relay -> MAIN GRID ⚡")
            current_source = "GRID"
        
        print("   ✅  Action Complete.\n")
    except Exception as e:
        print(f"❌ Error processing command: {e}")

client.on_connect = on_connect
client.on_message = on_message # ผูกฟังก์ชันรับข้อความ

print("⏳ Connecting to Broker...")
client.connect(BROKER_IP, PORT, 60)
client.loop_start()

# ===== MAIN LOOP ===== (จำลองการส่งค่า)
try:
    print("🚀 Simulator Started. Press Ctrl+C to stop.")
    while True:
        # สุ่มค่าแบบเนียนๆ ตามแหล่งจ่ายไฟที่เลือกอยู่
        if current_source == "GRID":
            voltage = round(random.uniform(228.0, 232.0), 2) # ไฟบ้านนิ่งๆ
        elif current_source == "BATTERY":
            voltage = round(random.uniform(11.5, 12.8), 2)   # ไฟแบต 12V
        else:
            voltage = round(random.uniform(18.0, 21.0), 2)   # ไฟโซลาร์

        current = round(random.uniform(1.5, 5.0), 2)
        power = round(voltage * current, 2)

        payload = {
            "voltage": voltage,
            "current": current,
            "power": power,
            "source": current_source # ส่งสถานะกลับไปโชว์ด้วยก็ได้
        }

        client.publish(DATA_TOPIC, json.dumps(payload))
        
        # print(f"📤 Sent Data: {payload}") # ปิดไว้จะได้ไม่ลายตาตอนดูคำสั่ง
        time.sleep(3) # ส่งทุก 3 วิ

except KeyboardInterrupt:  # <--- จุดที่ Error คือบรรทัดนี้ต้องอยู่ชิดซ้ายสุดและห้ามหายครับ
    print("\n🛑 Stopping simulator...")
    client.loop_stop()
    client.disconnect()