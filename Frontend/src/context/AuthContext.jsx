import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/endpoints";
import { connectSocket, disconnectSocket } from "../api/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("erp_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Revalidate the session on load so stale/expired tokens are caught early
    const token = localStorage.getItem("erp_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ data }) => {
        setUser(data.user);
        connectSocket(data.user); // resume real-time updates after a page refresh
      })
      .catch(() => {
        localStorage.removeItem("erp_token");
        localStorage.removeItem("erp_user");
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => disconnectSocket();
  }, []);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem("erp_token", data.token);
    localStorage.setItem("erp_user", JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.user); // open the real-time channel as soon as we're logged in
    return data.user;
  };

  const signup = async (payload) => {
    const { data } = await authApi.signup(payload);
    localStorage.setItem("erp_token", data.token);
    localStorage.setItem("erp_user", JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.user);
    return data.user;
  };

  const logout = () => {
    disconnectSocket();
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setUser(null);
  };

  // Merge a partial user update (e.g. after changing the avatar) into local
  // state + storage, without a full re-login.
  const updateUser = (partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("erp_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
