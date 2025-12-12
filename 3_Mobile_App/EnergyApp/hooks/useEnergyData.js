import { useState, useEffect } from 'react';
import socket from '../components/mqttService';

const useEnergyData = () => {
  const [data, setData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    energy: 0,
    frequency: 50,
    pf: 0.9,
  });
  
  const [trend, setTrend] = useState("Stable");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. เชื่อมต่อ Socket
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      console.log("✅ Socket Connected via Hook");
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("❌ Socket Disconnected");
      setIsConnected(false);
    };

    // 2. รับข้อมูล (หัวใจสำคัญอยู่ตรงนี้)
    const onUpdate = (response) => {
      // console.log("📦 Raw Data received:", response); // เปิดดูถ้าอยากเห็นไส้ใน

      if (response && response.data) {
        // กรณี Server ส่งมาแบบ { data: { voltage: ... } }
        setData(prev => ({
          ...prev, // เก็บค่าเก่าไว้ก่อน (เผื่อบางค่าไม่ส่งมา)
          ...response.data // เอาค่าใหม่ทับลงไป
        }));
        
        if (response.trend) {
          setTrend(response.trend);
        }
      } else {
        // กรณี Server ส่งมาแบบ { voltage: ... } (กันเหนียว)
        setData(prev => ({ ...prev, ...response }));
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('update', onUpdate); // ชื่อ event ต้องตรงกับ Server (บรรทัด socketio.emit("update", ...))

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('update', onUpdate);
    };
  }, []);

  return { data, trend, isConnected };
};

export default useEnergyData;