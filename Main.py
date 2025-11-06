import os
import json
import time
import threading
import pandas as pd
import paho.mqtt.client as mqtt
from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from flask_socketio import SocketIO #fvdvddvd
from ai_predictor import predict_energy_trend  # โมเดล AI อยากได้แบบอื่นค่อยเปลี่ยน

# ===== CONFIG =====
BROKER_IP = "192.168.51.152"  # IP ของ MQTT Broker
PORT = 5500
DATA_TOPIC = "energy/data"
COMMAND_TOPIC = "energy/command"

# ===== FLASK & SOCKET.IO SETUP =====
app = Flask(__name__, template_folder="web/templates", static_folder="web/static")
socketio = SocketIO(app, cors_allowed_origins="*")
app.secret_key = 'ID6810530001BD20041103'  # 🔐 รหัสความปลอดภัย

# ===== DATA STORAGE =====
data = pd.DataFrame(columns=["voltage", "current", "power"])

# ===== MQTT CALLBACK =====
def on_connect(client, userdata, flags, rc):
    print(f"✅ Connected to MQTT Broker with code: {rc}")
    client.subscribe(DATA_TOPIC)

def on_message(client, userdata, msg):
    global data
    try:
        payload = json.loads(msg.payload.decode())
        print("📡 Received:", payload)

        # เก็บข้อมูลใหม่ใน DataFrame
        data.loc[len(data)] = [
            payload.get("voltage", 0),
            payload.get("current", 0),
            payload.get("power", 0),
        ]

        try:
            trend = predict_energy_trend(data["power"].values) # AI trend prediction (กัน error)
        except Exception as e:
            print("❌ Trend error:", e)
            trend = "N/A"

        socketio.emit("update", {"data": payload, "trend": trend}) # ส่งข้อมูลไปหน้าเว็บแบบ real-time

    except Exception as e:
        print("❌ MQTT message error:", e)

# ===== MQTT SETUP =====
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.connect(BROKER_IP, 1883, 60)

# ===== MQTT LOOP THREAD =====
def mqtt_loop():
    mqtt_client.loop_forever()

# ===== DEMO THREAD (optional) =====
def fake_data_broadcast():
    while True:
        fake_payload = {
            "voltage": round(220 + (time.time() % 5), 2),
            "current": round(1 + (time.time() % 3), 2),
            "power": round(500 + (time.time() % 50), 2),
        }
        socketio.emit("update", {"data": fake_payload, "trend": "stable"})
        time.sleep(3) # จำลองข้อมูลสำหรับการทดสอบ

def backup_data():
    while True:
        try:
            if not data.empty:
                data.tail(5000).to_csv("backup_energy_data.csv", index=False)
                print("💾 Backup completed")
        except Exception as e:
            print(f"❌ Backup error: {e}")
        time.sleep(300) # backup ไฟล์ 5000 แถว ทุก 5 นาที ใช้เป็นการสำรองข้อมูล

backup_thread = threading.Thread(target=backup_data, daemon=True)
backup_thread.start()

# ===== security (Login) =====
USERNAME = "admin"
PASSWORD = "1234"

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = request.form.get('username')
        pw = request.form.get('password')
        if user == USERNAME and pw == PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('index'))
        return "Invalid credentials", 401
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))
 
# ===== ROUTES =====
@app.route('/')
def index():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/control/<cmd>')
def control(cmd):
    """ส่งคำสั่งควบคุมไปยัง ESP32"""
    valid_cmds = ["use_grid", "use_battery", "use_solar"]
    if cmd in valid_cmds:
        mqtt_client.publish(COMMAND_TOPIC, cmd)
        print(f"📤 Sent command: {cmd}")
        return jsonify({"status": f"Command '{cmd}' sent"})
    return jsonify({"status": "Invalid command"}), 400

@app.route('/api/data')
def get_data():
    if data.empty:
        return jsonify({"status": "no data"})
    latest = data.iloc[-1].to_dict()
    return jsonify(latest)

# ===== MAIN =====
if __name__ == "__main__":
    # สร้าง thread ให้ MQTT
    mqtt_thread = threading.Thread(target=mqtt_loop, daemon=True)
    mqtt_thread.start()

    # สร้าง thread broadcast fake data
    broadcast_thread = threading.Thread(target=fake_data_broadcast, daemon=True)
    broadcast_thread.start()

    # ใช้ socketio.run แทน app.run (เพราะใช้ Socket.IO)
    socketio.run(app, host="0.0.0.0", port=PORT, debug=True)
