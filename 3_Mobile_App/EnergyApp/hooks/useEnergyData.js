import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../constants/config"; 

export default function useEnergyData() {
  const [data, setData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    trend: "Waiting...",
  });

  useEffect(() => {
    console.log("🔌 Connecting to Socket:", SOCKET_URL);

    // ✅ แก้ไข: บังคับใช้ polling ให้ตรงกับ Server
    const socket = io(SOCKET_URL, {
      transports: ["polling"], // 👈 ใช้โหมดนี้ เสถียรสุดบน Py 3.14
    });

    socket.on("connect", () => {
      console.log("✅ App Connected to Server!");
    });

    socket.on("update", (msg) => {
      console.log("📱 App Received Data:", msg);
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