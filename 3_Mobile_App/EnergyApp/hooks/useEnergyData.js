import { useState, useEffect } from 'react';
import mqtt from 'precompiled-mqtt';

// ตั้งค่า HiveMQ (Broker เดียวกับ Python)
const MQTT_BROKER = 'wss://aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud:8884/mqtt';
const MQTT_USER = 'CEOptimization.admin2004'; 
const MQTT_PASS = 'Admin1234'; 

export default function useEnergyData() {
  // เพิ่ม trend: 'Waiting...' เป็นค่าเริ่มต้น
  const [data, setData] = useState({ 
    voltage: 0, 
    current: 0, 
    power: 0, 
    trend: 'Analyzing...' 
  });

  useEffect(() => {
    console.log("🔌 Connecting to MQTT...");
    
    const client = mqtt.connect(MQTT_BROKER, {
      username: MQTT_USER,
      password: MQTT_PASS,
      clientId: `app-${Math.random().toString(16).slice(2)}`,
    });

    client.on('connect', () => {
      console.log('✅ Connected!');
      client.subscribe('energy/data');
    });

    client.on('message', (topic, message) => {
      try {
        const parsed = JSON.parse(message.toString());
        // รับค่าทั้งหมดรวมถึง trend จาก Server
        setData({
          voltage: parsed.voltage || 0,
          current: parsed.current || 0,
          power: parsed.power || 0,
          trend: parsed.trend || 'Normal ✅' // ถ้าไม่มีส่งมา ให้ขึ้น Normal ไว้ก่อน
        });
      } catch (err) {
        console.error('❌ JSON Error:', err);
      }
    });

    return () => client.end();
  }, []);

  return data;
}