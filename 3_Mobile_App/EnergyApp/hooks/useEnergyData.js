import { io } from 'socket.io-client';
import { SERVER_URL } from '../constants/config'; 

const socket = io(SERVER_URL, {
  path: '/socket.io/',
  transports: ['websocket'], // บังคับใช้ websocket เพื่อความชัวร์
  reconnection: true, 
  reconnectionAttempts: 10,
  reconnectionDelay: 2000, 
  timeout: 20000,
  // 👇 เพิ่มตรงนี้: บัตรผ่านทาง Ngrok (สำคัญมาก!)
  extraHeaders: {
    "ngrok-skip-browser-warning": "true"
  }
});

socket.on('connect', () => {
    console.log("✅ Socket Connected via Ngrok!", socket.id);
});

socket.on('connect_error', (err) => {
    console.log("❌ Socket Error Details:", err.message);
});

export default socket;