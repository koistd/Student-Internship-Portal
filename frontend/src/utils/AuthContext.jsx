import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { loginUser, logoutUser, observeAuth, profileForUser } from "../firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => observeAuth(async (firebaseUser) => {
    setUser(firebaseUser ? await profileForUser(firebaseUser) : null);
    setLoading(false);
  }), []);

  const login = (userData) => setUser(userData);

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
