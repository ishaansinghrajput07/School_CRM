// Thin wrapper around Socket.io so controllers can push live updates without
// importing the raw `io` instance everywhere. server.js calls initRealtime(io)
// once at boot; every other module just imports the emit helpers below.

let ioInstance = null;

// Map of userId (string) -> Set of socket ids, so we can target a single user
// even if they have multiple tabs open.
const userSockets = new Map();

const initRealtime = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    // Client sends { userId, role } right after connecting (see frontend socket.js)
    socket.on("register", ({ userId, role } = {}) => {
      if (!userId) return;
      socket.data.userId = userId;
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);
      // Admins join a shared room so emitToAdmins() below can reach every
      // admin session at once without tracking each one individually.
      if (role === "admin") socket.join("admins");
    });

    // Anyone viewing an event's detail/registration page joins its room so
    // they see the live registered-count update the moment anyone else
    // registers or cancels, without polling.
    socket.on("event:join", (eventId) => {
      if (eventId) socket.join(`event:${eventId}`);
    });
    socket.on("event:leave", (eventId) => {
      if (eventId) socket.leave(`event:${eventId}`);
    });

    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) userSockets.delete(userId);
      }
    });
  });
};

// Push an event to every socket belonging to one user (e.g. a new notification)
const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  const sockets = userSockets.get(String(userId));
  if (!sockets) return;
  sockets.forEach((socketId) => ioInstance.to(socketId).emit(event, payload));
};

// Push an event to every connected admin session (e.g. "a new ticket came in")
// Relies on the client also joining an "admins" room after registering as admin.
const emitToAdmins = (event, payload) => {
  if (!ioInstance) return;
  ioInstance.to("admins").emit(event, payload);
};

// Push an event to every socket currently viewing a given event's room
// (see event:join above) - used for live registered-count updates.
const emitToEvent = (eventId, event, payload) => {
  if (!ioInstance || !eventId) return;
  ioInstance.to(`event:${eventId}`).emit(event, payload);
};

module.exports = { initRealtime, emitToUser, emitToAdmins, emitToEvent };
