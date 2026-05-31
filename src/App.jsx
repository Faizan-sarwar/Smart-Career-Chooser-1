// src/App.jsx
import { AnimatePresence } from "framer-motion";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google'; // 🚨 ADDED GOOGLE PROVIDER
import PageTransition from "../src/components/common/PageTransition.jsx";
import "./index.css";

import { AuthProvider, useAuth } from "../src/context/AuthContext.jsx";
import { AssessmentProvider } from "../src/context/AssessmentContext.jsx";
import { SocketProvider } from "../src/context/SocketContext.jsx";
import { NotificationProvider } from "../src/context/NotificationContext.jsx";
import { ChatProvider } from "../src/context/ChatContext.jsx";

import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";

import AppShell from "../src/components/layout/AppShell.jsx";
import ProtectedRoute from "../src/components/layout/ProtectedRoute.jsx";

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
import FindMentor from "./pages/student/FindMentor.jsx";

import MentorDashboard from "./pages/mentor/MentorDashboard.jsx";
import MyMentees from "./pages/mentor/MyMentees.jsx";
import MentorSessions from "./pages/mentor/MentorSessions.jsx";
import MentorInsights from "./pages/mentor/MentorInsights.jsx";
import CommunicationHub from "./pages/mentor/CommunicationHub.jsx";
import MentorRequests from "./pages/mentor/MentorRequests.jsx";
import MentorProfilePage from "./pages/mentor/ProfilePage.jsx";
import MentorSettingsPage from "./pages/mentor/SettingsPage.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import ManageMarket from "./pages/admin/ManageMarket.jsx";
import ManageRoadmaps from "./pages/admin/ManageRoadmaps.jsx";
import Moderation from "./pages/admin/Moderation.jsx";
import ManageCareers from "./pages/admin/ManageCareers.jsx";
import ManageEvents from "./pages/admin/ManageEvents.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";

import NotFound from "./pages/NotFound.jsx";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error(
    "❌ VITE_GOOGLE_CLIENT_ID is missing. Check frontend/.env and restart `npm run dev`."
  );
}
function Home() {
  const { user } = useAuth();
  if (user) return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
  return <LandingPage />;
}

function AnimatedRouter() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />

        {/* Student Portal */}
        <Route element={<ProtectedRoute role="student"><AppShell /></ProtectedRoute>}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/assessment" element={<AssessmentFlow />} />
          <Route path="/student/recommendations" element={<Recommendations />} />
          <Route path="/student/market" element={<MarketInsights />} />
          <Route path="/student/roadmap" element={<SkillRoadmap />} />
          <Route path="/student/community" element={<CommunityFeed />} />
          <Route path="/student/hub" element={<CommunityHub />} />
          <Route path="/student/mentors" element={<FindMentor />} />
          <Route path="/student/messages" element={<StudentMessages />} />
          <Route path="/student/profile" element={<ProfilePage />} />
          <Route path="/student/settings" element={<SettingsPage />} />
          <Route path="/student/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Mentor Portal */}
        <Route path="/mentor" element={<ProtectedRoute role="Mentor"><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/mentor/dashboard" replace />} />
          <Route path="dashboard" element={<MentorDashboard />} />
          <Route path="requests" element={<MentorRequests />} />
          <Route path="mentees" element={<MyMentees />} />
          <Route path="mentees/:id" element={<MyMentees />} />
          <Route path="sessions" element={<MentorSessions />} />
          <Route path="insights" element={<MentorInsights />} />
          <Route path="hub" element={<CommunicationHub />} />
          <Route path="profile" element={<MentorProfilePage />} />
          <Route path="settings" element={<MentorSettingsPage />} />
        </Route>

        {/* Admin Portal */}
        <Route element={<ProtectedRoute role="admin"><AppShell /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/careers" element={<ManageCareers />} />
          <Route path="/admin/events" element={<ManageEvents />} />
          <Route path="/admin/market-data" element={<ManageMarket />} />
          <Route path="/admin/roadmaps" element={<ManageRoadmaps />} />
          <Route path="/admin/moderation" element={<Moderation />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <NotificationProvider>
          <SocketProvider>
            <AssessmentProvider>
              <ChatProvider>
                <BrowserRouter>
                  <AnimatedRouter />
                </BrowserRouter>
              </ChatProvider>
            </AssessmentProvider>
          </SocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}