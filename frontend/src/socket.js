import { io } from 'socket.io-client';

// Singleton Socket.io client instance initialization
// Connect to a deployed backend URL if provided, otherwise default to same origin (for local Vite proxy)
const backendUrl = import.meta.env.VITE_BACKEND_URL || undefined;

export const socket = io(backendUrl, {
    autoConnect: false, // Connect manually when needed (Phase 1)
});
