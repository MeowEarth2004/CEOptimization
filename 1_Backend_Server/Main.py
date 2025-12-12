from gevent import monkey
monkey.patch_all()

import os
import json
import time
import uuid
import pandas as pd
import paho.mqtt.client as mqtt
from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from flask_socketio import SocketIO
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
SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret')
app.secret_key = SECRET_KEY

# ✅ เปลี่ยนโหมดเป็น gevent (เสถียรสุดสำหรับงานนี้)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

# ===== DATA STORAGE =====
data = pd.DataFrame(columns=["voltage", "current", "power"])

# ===== MQTT CALLBACKS =====
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("✅ SERVER: Connected to Broker!")
        client.subscribe(DATA_TOPIC)
        print(f"👂 SERVER: Subscribed to {DATA_TOPIC}")
    else:
        print(f"❌ SERVER: Connection failed with code {rc}")

def on_message(client, userdata, msg):
    global data
    try:
        payload = json.loads(msg.payload.decode())
        print(f"📡 SERVER RECEIVED: {payload}") 

        data.loc[len(data)] = [
            payload.get("voltage", 0),
            payload.get("current", 0),
            payload.get("power", 0),
        ]

        trend = "N/A"
        try:
            if len(data) > 0:
                trend = predict_energy_trend(data["power"].values)
        except Exception as e:
            print(f"⚠️ Prediction Warning: {e}")

        socketio.emit("update", {"data": payload, "trend": trend})

    except Exception as e:
        print(f"❌ Error processing message: {e}")

# ===== MQTT SETUP =====
print("⏳ SERVER: Setting up MQTT...")
client_id = f"server-{uuid.uuid4()}"
print(f"🆔 Client ID: {client_id}")

mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
mqtt_client.tls_set() 
mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)

try:
    mqtt_client.connect(BROKER_IP, PORT, 60)
    mqtt_client.loop_start() 
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

@app.route('/control/<cmd>')
def control(cmd):
    valid_cmds = ["use_grid", "use_battery", "use_solar"]
    if cmd in valid_cmds:
        mqtt_client.publish(COMMAND_TOPIC, cmd)
        print(f"📤 Command Sent to Device: {cmd}")
        return jsonify({"status": f"Command '{cmd}' sent"})
    return jsonify({"status": "Invalid command"}), 400

# ===== MAIN =====
if __name__ == "__main__":
    print("🚀 Starting Web Server on http://0.0.0.0:5500")
    socketio.run(app, host="0.0.0.0", port=5500, debug=False)