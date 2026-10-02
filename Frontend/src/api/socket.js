import { io } from "socket.io-client";

let socket = null;

// Derive the socket URL from VITE_API_URL by stripping the trailing /api.
// Guarded so a missing env var doesn't crash the whole app at import time.
const RAW_API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = RAW_API_URL ? RAW_API_URL.replace(/\/api\/?$/, "") : "";

// Call once after login (and on app load if already authenticated) to open
// the connection and tell the server who we are, so it can target us.
export function connectSocket(user) {
  if (!user) return null;
  if (!SOCKET_URL) return null; // VITE_API_URL missing - already logged from axios.js
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });

  socket.on("connect", () => {
    socket.emit("register", { userId: user.id, role: user.role });
  });

  return socket;
}

export function getSocket() {
  return socket;
}

// Join/leave a specific event's room so this tab receives live
// registered-count updates while the person is looking at that event.
export function joinEventRoom(eventId) {
  socket?.emit("event:join", eventId);
}
export function leaveEventRoom(eventId) {
  socket?.emit("event:leave", eventId);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
