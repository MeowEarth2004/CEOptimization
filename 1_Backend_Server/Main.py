# File: 1_Backend_Server/main.py
# [REVISED] - อัปเดตความปลอดภัยโดยใช้ .env

import os
import json
import time
import threading
import pandas as pd
import paho.mqtt.client as mqtt
from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from flask_socketio import SocketIO
from ai_predictor import predict_energy_trend
from dotenv import load_dotenv # [NEW] - Import dotenv

# [NEW] - โหลดค่าจากไฟล์ .env เข้าสู่ Environment Variables
load_dotenv() 

# ===== CONFIG (ดึงค่าจาก .env) =====
BROKER_IP = "192.168.51.152" 
PORT = 5500
DATA_TOPIC = "energy/data"
COMMAND_TOPIC = "energy/command"

# [REVISED] - ดึงค่า Secret Key จาก .env
# ถ้าหาไม่เจอ ให้ใช้ค่า Default (แต่จะแสดงคำเตือน)
SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'DEFAULT_KEY_PLEASE_CHANGE_ME')
if SECRET_KEY == 'DEFAULT_KEY_PLEASE_CHANGE_ME':
    print("⚠️ WARNING: FLASK_SECRET_KEY ไม่ได้ตั้งค่าใน .env! ใช้ค่า Default ที่ไม่ปลอดภัย")

# [REVISED] - ดึงค่า Login จาก .env
USERNAME = os.getenv('FLASK_USERNAME', 'admin')
PASSWORD = os.getenv('FLASK_PASSWORD', '1234')
if USERNAME == 'admin' and PASSWORD == '1234':
     print("⚠️ WARNING: FLASL_USERNAME/PASSWORD ใช้ค่า Default ที่ไม่ปลอดภัย! (ตั้งค่าใน .env)")


# ===== FLASK & SOCKET.IO SETUP =====
app = Flask(__name__, template_folder="web/templates", static_folder="web/static")
socketio = SocketIO(app, cors_allowed_origins="*")
app.secret_key = SECRET_KEY # [REVISED] - ใช้ Secret Key ที่ดึงมา

# ... (ส่วนที่เหลือของโค้ด: DATA STORAGE, MQTT CALLBACK, MQTT SETUP, MQTT LOOP) ...
# ... (โค้ดส่วนนี้เหมือนเดิม ไม่ต้องแก้ไข) ...
# ...
# def on_connect(client, userdata, flags, rc): ...
# def on_message(client, userdata, msg): ...
# mqtt_client = mqtt.Client() ...
# def mqtt_loop(): ...
# def fake_data_broadcast(): ...
# def backup_data(): ...
# ... (จบส่วนที่ไม่ต้องแก้ไข) ...


# ===== security (Login) =====
# [REVISED] - ส่วนนี้ไม่ต้องแก้ เพราะตัวแปร USERNAME/PASSWORD ถูกแก้ด้านบนแล้ว
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