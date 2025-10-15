import os
import json
import time
import socket
import threading
import pandas as pd
import paho.mqtt.client as mqtt
from flask import Flask, render_template
from flask_socketio import SocketIO
from ai_predictor import predict_energy_trend
from flask import jsonify

# ===== CONFIG =====
BROKER_IP = "192.168.51.45"  # IP ของ MQTT Broker (ต้องตรงกับ ESP32)
MQTT_BROKER = "192.168.1.100"
PORT = 5500
TOPIC = "energy/data"

# ===== FLASK SETUP =====
app = Flask(__name__, template_folder="web/templates", static_folder="web/static")
socketio = SocketIO(app, cors_allowed_origins="*")

# ===== DATA STORAGE =====
data = pd.DataFrame(columns=["voltage", "current", "power"])

# ===== MQTT CALLBACK =====
def on_connect(client, userdata, flags, rc):
    print("✅ Connected to MQTT Broker:", rc)
    client.subscribe(TOPIC)

def on_message(client, userdata, msg):
    global data
    payload = json.loads(msg.payload.decode())
    print("📡 Received:", payload)

    data.loc[len(data)] = [
        payload["voltage"],
        payload["current"],
        payload["power"],
    ]

    trend = predict_energy_trend(data["power"].values) # ประมวลผล trend (AI)

    socketio.emit("update", {"data": payload, "trend": trend}) # ส่งข้อมูล real-time ไปหน้าเว็บ

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
        socketio.emit('sensor_data', {'value': time.time()})
        time.sleep(3)

# ===== ROUTES =====
@app.route('/')
def index():
    return render_template('index.html')  # โหลดหน้าเว็บ

@app.route('/control/<cmd>')
def control(cmd):
    if cmd in ["use_grid", "use_battery", "use_solar"]:
        mqtt_client.publish("energy/data", cmd)
        return jsonify({"status": f"Command {cmd} sent"})
    return jsonify({"status": "Invalid command"})

# ===== MAIN =====
if __name__ == "__main__":
    # ✅ สร้าง thread สำหรับ MQTT
    mqtt_thread = threading.Thread(target=mqtt_loop)
    mqtt_thread.daemon = True
    mqtt_thread.start()

    # ✅ สร้าง thread broadcast fake data
    broadcast_thread = threading.Thread(target=mqtt_loop)
    broadcast_thread.daemon = True
    broadcast_thread.start()

    # ✅ ใช้ socketio.run แทน app.run (เพราะใช้ Socket.IO)
    socketio.run(app, host="0.0.0.0", port=PORT, debug=True)
