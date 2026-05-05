import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/axios.js"; // Connecting to our Axios instance

const AuthContext = createContext(null);
const USER_KEY = "cc.user";
const TOKEN_KEY = "token";

export function AuthProvider({ children }) {
  // Initialize user from local storage to prevent data (like avatars) from clearing on refresh
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch {
      return null;
    }
  });

  // Sync user object to local storage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  // Connects to POST /api/auth/login
  const login = async ({ email, password }) => {
    const { data } = await api.post("/auth/login", { email, password });

    // Save the secure token for future requests
    localStorage.setItem(TOKEN_KEY, data.token);

    // Save user data (including their specific role and avatar) to global state
    setUser({
      id: data._id,
      email: data.email,
      name: data.name,
      role: data.role.toLowerCase(), // Ensure role is lowercase for frontend routing
      avatar: data.avatar,
    });
  };

  // Connects to POST /api/auth/register
  const register = async (userData) => {
    // 1. Create the account in the backend
    await api.post("/auth/register", userData);

    // 🚨 SECURE FIX: We deliberately DO NOT save the token to localStorage 
    // or set the User state here. This prevents the auto-login.
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const updateProfile = (patch) => setUser((u) => (u ? { ...u, ...patch } : u));

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);