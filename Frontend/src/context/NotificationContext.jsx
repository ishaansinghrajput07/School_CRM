import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { notifyInfo } from "../utils/toast";
import { notificationsApi } from "../api/endpoints";
import { getSocket } from "../api/socket";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(() => {
    if (!user) return;
    notificationsApi.list().then(({ data }) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Subscribe to live push events once the socket is connected (AuthContext opens it on login)
  useEffect(() => {
    if (!user) return;
    // The socket may connect slightly after this effect runs, so poll briefly for it
    let socket = getSocket();
    let attempts = 0;
    const attach = setInterval(() => {
      socket = getSocket();
      attempts += 1;
      if (socket || attempts > 20) clearInterval(attach);
      if (socket) {
        socket.on("notification:new", (notification) => {
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          notifyInfo(notification.title);
        });
      }
    }, 250);

    return () => {
      clearInterval(attach);
      socket?.off("notification:new");
    };
  }, [user]);

  const markAsRead = async (id) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refresh: load }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
