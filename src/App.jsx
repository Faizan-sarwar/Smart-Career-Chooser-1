import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

// Fixed: Changed from "../src/context/..." to "./context/..."
import { AuthProvider, useAuth } from "../src/context/AuthContext.jsx";
import { AssessmentProvider } from "../src/context/AssessmentContext.jsx";

import LoginPage from "./pages/auth/LoginPage.jsx";
// Fixed: Changed from "../src/pages/..." to "./pages/..."
import RegisterPage from "./pages/auth/RegisterPage.jsx";

// Correct: These go up one level to the components folder outside of src
import AppShell from "../src/components/layout/AppShell.jsx";
import ProtectedRoute from "../src/components/layout/ProtectedRoute.jsx";

// Fixed: Changed from "../src/pages/..." to "./pages/..."
import LandingPage from "./pages/public/LandingPage.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import AssessmentFlow from "./pages/student/AssessmentFlow.jsx";
import Recommendations from "./pages/student/Recommendations.jsx";
import CommunityFeed from "./pages/student/CommunityFeed.jsx";
import MarketInsights from "./pages/student/MarketInsights.jsx";
import SkillRoadmap from "./pages/student/SkillRoadmap.jsx";
import CommunityHub from "./pages/student/CommunityHub.jsx";
import StudentMessages from "./pages/student/StudentMessages.jsx";
import ProfilePage from "./pages/student/ProfilePage.jsx";
import SettingsPage from "./pages/student/SettingsPage.jsx";
import NotificationsPage from "./pages/student/NotificationsPage.jsx";

import MentorDashboard from "./pages/mentor/MentorDashboard.jsx";
import MenteeDetail from "./pages/mentor/MenteeDetail.jsx";
import CommunicationHub from "./pages/mentor/CommunicationHub.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import ManageMarket from "./pages/admin/ManageMarket.jsx";
import ManageRoadmaps from "./pages/admin/ManageRoadmaps.jsx";
import Moderation from "./pages/admin/Moderation.jsx";

import NotFound from "./pages/NotFound.jsx";

function Home() {
  const { user } = useAuth();
  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <LandingPage />;
}

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />


      <Route element={<ProtectedRoute role="student"><AppShell /></ProtectedRoute>}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/assessment" element={<AssessmentFlow />} />
        <Route path="/student/recommendations" element={<Recommendations />} />
        <Route path="/student/market" element={<MarketInsights />} />
        <Route path="/student/roadmap" element={<SkillRoadmap />} />
        <Route path="/student/community" element={<CommunityFeed />} />
        <Route path="/student/hub" element={<CommunityHub />} />
        <Route path="/student/messages" element={<StudentMessages />} />
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student/settings" element={<SettingsPage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<ProtectedRoute role="mentor"><AppShell /></ProtectedRoute>}>
        <Route path="/mentor/dashboard" element={<MentorDashboard />} />
        <Route path="/mentor/mentees/:id" element={<MenteeDetail />} />
        <Route path="/mentor/hub" element={<CommunicationHub />} />
      </Route>

      <Route element={<ProtectedRoute role="admin"><AppShell /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/market-data" element={<ManageMarket />} />
        <Route path="/admin/roadmaps" element={<ManageRoadmaps />} />
        <Route path="/admin/moderation" element={<Moderation />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AssessmentProvider>
        <BrowserRouter>
          <Router />
        </BrowserRouter>
      </AssessmentProvider>
    </AuthProvider>
  );
}