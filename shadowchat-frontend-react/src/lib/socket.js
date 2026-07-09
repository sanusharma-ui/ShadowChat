import { io } from "socket.io-client";

export function createSocket(token) {
  return io(import.meta.env.VITE_SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    timeout: 10000,
    auth: {
      token
    }
  });
}
