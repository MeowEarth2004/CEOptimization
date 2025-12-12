import { useEffect, useState } from "react";
import { io } from "socket.io-client";
// ✅ แก้ไข 1: เปลี่ยนจาก SOCKET_ENDPOINT เป็น SOCKET_URL ให้ตรงกับ config.js
import { SOCKET_URL } from "../constants/config";

export default function useEnergyData() {
  const [data, setData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    trend: "Waiting...",
  });

  useEffect(() => {
    console.log("🔌 Connecting to Socket:", SOCKET_URL); // log ดูว่า URL มาไหม

    // ✅ แก้ไข 2: เพิ่ม options { transports: ["polling"] }
    // เพื่อให้คุยกับ Server Python 3.14 ได้โดยไม่ Error
    const socket = io(SOCKET_URL, {
      transports: ["polling"], 
    });

    socket.on("connect", () => {
      console.log("✅ App Connected to server ID:", socket.id);
    });

    socket.on("update", (msg) => {
      console.log("📱 App Received:", msg); // log ดูข้อมูล
      setData({
        voltage: msg.data?.voltage || 0,
        current: msg.data?.current || 0,
        power: msg.data?.power || 0,
        trend: msg.trend || "N/A",
      });
    });

    socket.on("disconnect", () => {
      console.warn("⚠️ Disconnected from server");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket Error:", err.message);
    });

    return () => socket.disconnect();
  }, []);

  return data;
}