import { useEffect, useState } from "react";
import { io } from "socket.io-client";
// ✅ แก้ไข: เรียกใช้ SOCKET_URL ให้ตรงกับ config.js
import { SOCKET_URL } from "../constants/config"; 

export default function useEnergyData() {
  const [data, setData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    trend: "Waiting...",
  });

  useEffect(() => {
    console.log("🔌 Connecting to Socket:", SOCKET_URL); // Log ดู URL

    // ✅ แก้ไข: ใช้ SOCKET_URL
    const socket = io(SOCKET_URL, {
      transports: ["websocket"], // บังคับใช้ websocket เพื่อความเสถียร
    });

    socket.on("connect", () => {
      console.log("✅ App Connected to Server!");
    });

    socket.on("update", (msg) => {
      console.log("📱 App Received Data:", msg); // Log ดูข้อมูลที่เข้า
      setData({
        voltage: msg.data?.voltage || 0,
        current: msg.data?.current || 0,
        power: msg.data?.power || 0,
        trend: msg.trend || "N/A",
      });
    });

    socket.on("disconnect", () => {
      console.warn("⚠️ App Disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Connection Error:", err.message);
    });

    return () => socket.disconnect();
  }, []);

  return data;
}