import { io } from 'socket.io-client';

// Singleton Socket.io client instance initialization
// Connect to the same origin (Vite proxy will forward it to the backend)
export const socket = io({
    autoConnect: false, // Connect manually when needed (Phase 1)
});
