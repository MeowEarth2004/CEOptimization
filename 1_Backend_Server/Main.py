import os
import json
import threading
import pandas as pd
import paho.mqtt.client as mqtt
from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from flask_cors import CORS # ต้องลง pip install flask-cors เพิ่ม
from ai_predictor import predict_energy_trend
from dotenv import load_dotenv

load_dotenv()

# ===== CONFIG =====
BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud"
PORT = 8883
MQTT_USER = os.getenv('MQTT_USER')
MQTT_PASS = os.getenv('MQTT_PASS')

DATA_TOPIC = "energy/data"
COMMAND_TOPIC = "energy/command"

# ===== FLASK SETUP =====
app = Flask(__name__, template_folder="web/templates", static_folder="web/static")
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'default_secret')
CORS(app) # อนุญาตให้ Mobile App ยิงเข้ามาได้

# ===== GLOBAL DATA =====
# เก็บข้อมูลล่าสุดไว้ตรงนี้
latest_data = {
    "voltage": 0,
    "current": 0,
    "power": 0,
    "trend": "Waiting..."
}
# เก็บประวัติสำหรับ AI
history_data = pd.DataFrame(columns=["power"])

# ===== MQTT CLIENT =====
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅ Python connected to HiveMQ!")
        client.subscribe(DATA_TOPIC)
    else:
        print(f"❌ Connection failed code {rc}")

def on_message(client, userdata, msg):
    global latest_data, history_data
    try:
        payload = json.loads(msg.payload.decode())
        print(f"📡 MQTT Received: {payload}")

        # อัปเดตข้อมูลล่าสุด
        latest_data["voltage"] = float(payload.get("voltage", 0))
        latest_data["current"] = float(payload.get("current", 0))
        latest_data["power"] = float(payload.get("power", 0))

        # เก็บประวัติเพื่อคำนวณ AI
        if len(history_data) > 50:
            history_data.drop(history_data.index[0], inplace=True)
        
        # เพิ่มข้อมูลใหม่ (แก้ Warning)
        new_row = pd.DataFrame({"power": [latest_data["power"]]})
        if history_data.empty:
            history_data = new_row
        else:
            history_data = pd.concat([history_data, new_row], ignore_index=True)

        # คำนวณ AI
        try:
            trend = predict_energy_trend(history_data["power"].values)
            latest_data["trend"] = trend
        except:
            latest_data["trend"] = "Analyzing..."

    except Exception as e:
        print(f"❌ Error parsing MQTT: {e}")

def start_mqtt():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    client.tls_set()
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    try:
        client.connect(BROKER_IP, PORT, 60)
        client.loop_forever()
    except Exception as e:
        print(f"❌ MQTT Start Error: {e}")

# ===== ROUTES =====
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = request.form.get('username')
        pw = request.form.get('password')
        if user == os.getenv('FLASK_USERNAME') and pw == os.getenv('FLASK_PASSWORD'):
            session['logged_in'] = True
            return redirect(url_for('index'))
        return "Invalid credentials", 401
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/')
def index():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('index.html')

# API สำหรับดึงข้อมูลล่าสุด (Polling)
@app.route('/api/data')
def get_data():
    return jsonify(latest_data)

@app.route('/control/<cmd>')
def control(cmd):
    # ส่งคำสั่งกลับไปที่ ESP32 (ต้องสร้าง client ชั่วคราวหรือใช้ตัว global)
    # เพื่อความง่ายในระบบนี้ เราจะใช้ publish ผ่าน client ตัวใหม่สั้นๆ
    try:
        pub_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        pub_client.tls_set()
        pub_client.username_pw_set(MQTT_USER, MQTT_PASS)
        pub_client.connect(BROKER_IP, PORT, 60)
        pub_client.publish(COMMAND_TOPIC, cmd)
        pub_client.disconnect()
        print(f"📤 Sent command: {cmd}")
        return jsonify({"status": f"Sent {cmd}"})
    except Exception as e:
        return jsonify({"status": "Error", "details": str(e)}), 500

if __name__ == "__main__":
    # รัน MQTT ใน Thread แยก
    mqtt_thread = threading.Thread(target=start_mqtt)
    mqtt_thread.daemon = True
    mqtt_thread.start()

    print("🚀 Server starting on http://0.0.0.0:5500")
    app.run(host="0.0.0.0", port=5500, debug=True, use_reloader=False)