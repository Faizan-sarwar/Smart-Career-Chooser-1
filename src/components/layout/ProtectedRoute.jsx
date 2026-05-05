import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx"; // Fixed import path

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  
  // 1. If not logged in at all, kick them to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // 2. If they are logged in, but trying to access a URL for a different role
  // (e.g., a student trying to type /admin/dashboard in the URL bar)
  if (role && user.role?.toLowerCase() !== role.toLowerCase()) {
    // Kick them back to their own dashboard
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
  }
  
  // 3. If they pass all checks, render the page!
  return children;
}