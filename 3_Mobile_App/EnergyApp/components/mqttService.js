import { io } from 'socket.io-client';
import { SERVER_URL } from '../constants/config'; 

const socket = io(SERVER_URL, {
  path: '/socket.io/', 
  transports: ['websocket'],
  reconnection: true, 
  reconnectionAttempts: 10,
  reconnectionDelay: 2000, 
  timeout: 20000 
});

socket.on('connect', () => {
    console.log("✅ Socket Connected!", socket.id);
});

socket.on('connect_error', (err) => {
    console.log("❌ Socket Error Details:", err.message);
});

export default socket;
