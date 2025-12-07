import io from 'socket.io-client';
import { SERVER_URL } from '../constants/config'; 

const socket = io(SERVER_URL, {

  path: '/socket.io/', 

  transports: ['websocket'], 
  
  reconnection: true, 
  reconnectionAttempts: 5,
  reconnectionDelay: 2000, 
  timeout: 10000 
});

socket.on('connect_error', (error) => {
    console.log("Socket Connection Failed:", error.message); 
});
