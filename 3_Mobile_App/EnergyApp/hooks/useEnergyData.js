import { useEffect, useState } from "react";
import { io } from "socket.io-client";
// ✅ แก้ไข 1: เรียกใช้ SOCKET_URL ให้ตรงกับไฟล์ config
import { SOCKET_URL } from "../constants/config";

export default function useEnergyData() {
  const [data, setData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    trend: "Waiting...",
  });

  useEffect(() => {
    // ป้องกัน Error กรณี URL เป็น undefined
    if (!SOCKET_URL) {
      console.error("❌ SOCKET_URL is missing in config!");
      return;
    }

    console.log("🔌 Hook Connecting to:", SOCKET_URL);

    // ✅ แก้ไข 2: บังคับใช้ polling เท่านั้น (สำคัญมากสำหรับ Python 3.14)
    const socket = io(SOCKET_URL, {
      transports: ["polling"],
    });

    socket.on("connect", () => {
      console.log("✅ Hook Connected ID:", socket.id);
    });

    socket.on("update", (msg) => {
      setData({
        voltage: msg.data?.voltage || 0,
        current: msg.data?.current || 0,
        power: msg.data?.power || 0,
        trend: msg.trend || "N/A",
      });
    });

    socket.on("disconnect", () => {
      console.warn("⚠️ Hook Disconnected");
    });

    return () => socket.disconnect();
  }, []);

  return data;
}