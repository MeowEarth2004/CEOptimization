import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_ENDPOINT } from "../constants/config";

export default function useEnergyData() {
  const [data, setData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    trend: "Waiting...",
  });

  useEffect(() => {
    // --- เชื่อม Socket.IO ---
    const socket = io(SOCKET_ENDPOINT);

    socket.on("connect", () => {
      console.log("✅ Connected to server");
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
      console.warn("⚠️ Disconnected from server");
    });

    return () => socket.disconnect();
  }, []);

  return data;
}
