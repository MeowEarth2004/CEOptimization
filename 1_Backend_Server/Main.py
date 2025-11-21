import os
import json
import time
import threading
import pandas as pd
import paho.mqtt.client as mqtt
from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from flask_socketio import SocketIO
from ai_predictor import predict_energy_trend
from dotenv import load_dotenv 

# โหลดค่าจาก .env
load_dotenv() 

# ===== CONFIG =====
# ใช้ค่า Cloud Broker ของคุณ
BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud" 
PORT = 8883 # Port สำหรับ SSL/TLS
MQTT_USER = os.getenv('MQTT_USER') # ดึงจาก .env
MQTT_PASS = os.getenv('MQTT_PASS') # ดึงจาก .env

DATA_TOPIC = "energy/data"
COMMAND_TOPIC = "energy/command"

# ===== FLASK SETUP =====
app = Flask(__name__, template_folder="web/templates", static_folder="web/static")
SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret')
app.secret_key = SECRET_KEY
socketio = SocketIO(app, cors_allowed_origins="*")

# ===== DATA STORAGE =====
data = pd.DataFrame(columns=["voltage", "current", "power"])

# ===== MQTT CALLBACKS =====
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to HiveMQ Cloud Broker!")
        client.subscribe(DATA_TOPIC)
    else:
        print(f"❌ Connection failed with code {rc}")

def on_message(client, userdata, msg):
    global data
    try:
        payload = json.loads(msg.payload.decode())
        print(f"📡 Received: {payload}")

        # เก็บข้อมูล
        data.loc[len(data)] = [
            payload.get("voltage", 0),
            payload.get("current", 0),
            payload.get("power", 0),
        ]

        # AI Prediction (Mockup)
        try:
            trend = predict_energy_trend(data["power"].values)
        except:
            trend = "N/A"

        # ส่งเข้าหน้าเว็บ (Dashboard)
        socketio.emit("update", {"data": payload, "trend": trend})

    except Exception as e:
        print(f"❌ Error processing message: {e}")

# ===== MQTT SETUP =====
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# สำคัญ: ตั้งค่า SSL/TLS สำหรับ HiveMQ Cloud
mqtt_client.tls_set() 

# ตั้งค่า Username/Password
mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)

# เชื่อมต่อ
try:
    mqtt_client.connect(BROKER_IP, PORT, 60)
except Exception as e:
    print(f"❌ MQTT Connection Error: {e}")

# ===== MQTT LOOP THREAD =====
def mqtt_loop():
    mqtt_client.loop_forever()

# ===== WEB ROUTES =====
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = request.form.get('username')
        pw = request.form.get('password')
        # ดึง User/Pass จาก .env
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

@app.route('/control/<cmd>')
def control(cmd):
    # ส่งคำสั่งกลับไปที่ ESP32 ผ่าน HiveMQ
    valid_cmds = ["use_grid", "use_battery", "use_solar"]
    if cmd in valid_cmds:
        mqtt_client.publish(COMMAND_TOPIC, cmd)
        print(f"📤 Sent command to ESP32: {cmd}")
        return jsonify({"status": f"Command '{cmd}' sent"})
    return jsonify({"status": "Invalid command"}), 400

# ===== MAIN =====
if __name__ == "__main__":
    # Start MQTT Thread
    mqtt_thread = threading.Thread(target=mqtt_loop, daemon=True)
    mqtt_thread.start()

    # Start Flask App
    socketio.run(app, host="0.0.0.0", port=5500, debug=True, allow_unsafe_werkzeug=True)
    