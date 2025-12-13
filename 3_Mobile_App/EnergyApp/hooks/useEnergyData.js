import { useState, useEffect } from 'react';
import mqtt from 'precompiled-mqtt';

// ตั้งค่า Link แบบเต็ม (ใส่ wss:// และ /mqtt ให้ครบ)
const MQTT_URL = 'wss://aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud:8884/mqtt';
const MQTT_USER = 'CEOptimization.admin2004';
const MQTT_PASS = 'Admin1234';

export default function useEnergyData() {
  const [data, setData] = useState({ 
    voltage: 0, 
    current: 0, 
    power: 0, 
    trend: 'Waiting for Signal...' // เปลี่ยนคำพูดให้เรารู้สถานะ
  });

  useEffect(() => {
    console.log("🔌 App Connecting...");
    
    const client = mqtt.connect(MQTT_URL, {
      username: MQTT_USER,
      password: MQTT_PASS,
      clientId: `app-user-${Math.random().toString(16).slice(2)}`,
      reconnectPeriod: 1000, // ถ้าหลุดให้รีบต่อใหม่ใน 1 วิ
    });

    client.on('connect', () => {
      console.log('✅ App Connected to Cloud!');
      client.subscribe('energy/data', (err) => {
        if (!err) {
            console.log("📡 Subscribed to energy/data");
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const parsed = JSON.parse(message.toString());
        console.log("📩 Data received:", parsed); // เช็คว่าข้อมูลเข้าไหม
        setData({
          voltage: parsed.voltage || 0,
          current: parsed.current || 0,
          power: parsed.power || 0,
          trend: parsed.trend || 'Normal ✅'
        });
      } catch (err) {
        console.error('❌ Data Error:', err);
      }
    });

    client.on('error', (err) => {
      console.error('❌ Connection Error:', err);
    });

    return () => client.end();
  }, []);

  return data;
}