import { createContext, useContext, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  const login = (userData, access, refresh) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    setUser(userData);
  };

  const logout = async () => {
    try { await api.post("/auth/logout/", { refresh: localStorage.getItem("refresh_token") }); } catch { /* Tokens are still cleared locally. */ }
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
