import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

import eventlet
eventlet.monkey_patch()

import os
import json
import time
import sqlite3 # เพิ่ม Library ฐานข้อมูล
import pandas as pd
import paho.mqtt.client as mqtt
from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from flask_socketio import SocketIO
from ai_predictor import predict_energy_trend
from dotenv import load_dotenv 

load_dotenv() 

# ===== CONFIG =====
# ใช้ค่าจาก .env หรือใส่ Hardcode เพื่อความชัวร์ในช่วงทดสอบ
BROKER_IP = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud" 
PORT = 8883 
MQTT_USER = os.getenv('MQTT_USER', 'CEOptimization.admin2004') 
MQTT_PASS = os.getenv('MQTT_PASS', 'CEO.admin2004') 

DATA_TOPIC = "energy/data"
COMMAND_TOPIC = "energy/command"
DB_NAME = "energy_data.db" # ชื่อไฟล์ฐานข้อมูล

# ===== DATABASE SETUP =====
def init_db():
    """สร้างฐานข้อมูลและตารางเก็บข้อมูลถ้ายังไม่มี"""
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        # สร้างตาราง logs เก็บ voltage, current, power และเวลา
        c.execute('''CREATE TABLE IF NOT EXISTS measurements 
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
                      voltage REAL, 
                      current REAL, 
                      power REAL)''')
        conn.commit()
        conn.close()
        print(f"✅ Database initialized: {DB_NAME}")
    except Exception as e:
        print(f"❌ Database Error: {e}")

# เรียกใช้งานทันทีที่เริ่มโปรแกรม
init_db()

# ===== FLASK SETUP =====
app = Flask(__name__, template_folder="web/templates", static_folder="web/static")
SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret')
app.secret_key = SECRET_KEY
socketio = SocketIO(app, cors_allowed_origins="*")

# ===== DATA STORAGE (RAM for AI) =====
data = pd.DataFrame(columns=["voltage", "current", "power"])

# ===== MQTT CALLBACKS =====
def on_connect(client, userdata, flags, rc, properties=None):
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

        v = payload.get("voltage", 0)
        i = payload.get("current", 0)
        p = payload.get("power", 0)

        # 1. บันทึกลง Database (SQLite)
        try:
            conn = sqlite3.connect(DB_NAME)
            c = conn.cursor()
            c.execute("INSERT INTO measurements (voltage, current, power) VALUES (?, ?, ?)", (v, i, p))
            conn.commit()
            conn.close()
        except Exception as db_err:
            print(f"⚠️ DB Write Error: {db_err}")

        # 2. เก็บใน RAM สำหรับ AI Trend (เก็บแค่ 20 ค่าล่าสุดพอ ไม่ให้ RAM เต็ม)
        data.loc[len(data)] = [v, i, p]
        if len(data) > 20: 
            data = data.tail(20)

        # 3. คำนวณ AI Trend
        try:
            trend = predict_energy_trend(data["power"].values)
        except:
            trend = "N/A"

        # 4. ส่งไปหน้าเว็บ Dashboard
        socketio.emit("update", {"data": payload, "trend": trend})

    except Exception as e:
        print(f"❌ Error processing message: {e}")

# ===== MQTT SETUP =====
# ตรวจสอบเวอร์ชันของ Paho MQTT เพื่อความเข้ากันได้
mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.tls_set() 
mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)

try:
    mqtt_client.connect(BROKER_IP, PORT, 60)
except Exception as e:
    print(f"❌ MQTT Connection Error: {e}")

# ===== WEB ROUTES =====
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

@app.route('/api/history')
def get_history():
    """API สำหรับดึงข้อมูลย้อนหลังไปพล็อตกราฟ"""
    try:
        conn = sqlite3.connect(DB_NAME)
        # ดึง 50 ค่าล่าสุด
        df = pd.read_sql_query("SELECT * FROM measurements ORDER BY id DESC LIMIT 50", conn)
        conn.close()
        # แปลงเป็น JSON กลับไปให้กราฟ
        return df.to_json(orient="records")
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/control/<cmd>')
def control(cmd):
    valid_cmds = ["use_grid", "use_battery", "use_solar"]
    if cmd in valid_cmds:
        mqtt_client.publish(COMMAND_TOPIC, cmd)
        print(f"📤 Sent command to ESP32: {cmd}")
        return jsonify({"status": f"Command '{cmd}' sent"})
    return jsonify({"status": "Invalid command"}), 400

# ===== MAIN =====
if __name__ == "__main__":
    mqtt_client.loop_start()
    print("🚀 Starting Web Server on http://localhost:5500")
    socketio.run(app, host="0.0.0.0", port=5500, debug=False, allow_unsafe_werkzeug=True)