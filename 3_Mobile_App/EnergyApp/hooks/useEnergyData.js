import { useState, useEffect } from 'react';
import Paho from 'paho-mqtt';

// 🛠️ 1. แก้บั๊ก Paho (หลอกว่ามี localStorage)
if (!global.localStorage) {
  global.localStorage = {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null,
  };
}

// ตั้งค่า HiveMQ
const BROKER_HOST = "aeb3327ea07a4330abc85c0b337ebf7b.s1.eu.hivemq.cloud";
const BROKER_PORT = 8884;
const MQTT_USER = "CEOptimization.admin2004";
const MQTT_PASS = "Admin1234";

export default function useEnergyData() {
  const [data, setData] = useState({ 
    voltage: 0, 
    current: 0, 
    power: 0, 
    // ใช้ตรงนี้โชว์สถานะการเชื่อมต่อแทน AI ชั่วคราว จะได้รู้ว่าติดตรงไหน
    trend: 'Connecting...' 
  });

  useEffect(() => {
    console.log("🔌 App Connecting...");
    setData(prev => ({ ...prev, trend: 'Initiating...' }));
    
    const clientID = `app-${Math.random().toString(16).slice(2)}`;
    const client = new Paho.Client(BROKER_HOST, BROKER_PORT, "/mqtt", clientID);

    client.onConnectionLost = (responseObject) => {
      console.log("❌ Lost:", responseObject.errorMessage);
      setData(prev => ({ ...prev, trend: `Lost: ${responseObject.errorMessage}` }));
    };

    client.onMessageArrived = (message) => {
      try {
        const parsed = JSON.parse(message.payloadString);
        setData({
          voltage: parsed.voltage || 0,
          current: parsed.current || 0,
          power: parsed.power || 0,
          trend: parsed.trend || 'Normal ✅' // ถ้าข้อมูลมา trend จะเปลี่ยนตามจริง
        });
      } catch (err) {
        console.error("❌ Parse Error:", err);
      }
    };

    // เชื่อมต่อ
    try {
        client.connect({
          useSSL: true, 
          userName: MQTT_USER,
          password: MQTT_PASS,
          onSuccess: () => {
            console.log("✅ Connected!");
            setData(prev => ({ ...prev, trend: 'Connected! Waiting for data...' }));
            client.subscribe("energy/data");
          },
          onFailure: (err) => {
            console.error("❌ Failed:", err.errorMessage);
            // ให้มันฟ้องบนหน้าจอเลยว่า Error อะไร
            setData(prev => ({ ...prev, trend: `Error: ${err.errorMessage}` }));
          }
        });
    } catch (e) {
        setData(prev => ({ ...prev, trend: `Crash: ${e.message}` }));
    }

    return () => {
      if (client.isConnected()) client.disconnect();
    };
  }, []);

  return data;
}