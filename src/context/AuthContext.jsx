import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/axios.js";

const AuthContext = createContext(null);
const USER_KEY = "cc.user";
const TOKEN_KEY = "token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = (data, token) => {
    localStorage.setItem(TOKEN_KEY, token);

    setUser({
      id: data._id,
      email: data.email,
      name: data.name,
      role: data.role.toLowerCase(),
      avatar: data.avatar,
      authProvider: data.authProvider || 'local'
    });
  };

  const register = async (userData) => {
    await api.post("/auth/register", userData);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      // CRITICAL: sync to localStorage so refresh shows new data
      try {
        localStorage.setItem('cc.user', JSON.stringify(next));
      } catch (e) {
        console.error('[AuthContext] Failed to persist user:', e);
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);