// src/App.jsx
//
// FIXED — the previous version had `<Routes key={location.pathname}>` which
// caused every route (including AppShell, Topbar, Sidebar) to unmount and
// remount on every navigation. That made the notification dropdown flash
// reload-style on each click.
//
// Now AppShell mounts ONCE per portal (student/mentor/admin). Only the
// inner page content animates between routes — which is what AnimatePresence
// was actually meant for.
//
// Also fixed provider order — BrowserRouter is now above NotificationProvider
// so contexts have access to router state if needed.

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./index.css";

import { AuthProvider, useAuth } from "../src/context/AuthContext.jsx";
import { AssessmentProvider } from "../src/context/AssessmentContext.jsx";
import { SocketProvider } from "../src/context/SocketContext.jsx";
import { NotificationProvider } from "../src/context/NotificationContext.jsx";
import { ChatProvider } from "../src/context/ChatContext.jsx"; // 🚨 ADDED CHAT PROVIDER

import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";

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

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import UserManagement from "./pages/admin/UserManagement.jsx";
import ManageMarket from "./pages/admin/ManageMarket.jsx";
import ManageRoadmaps from "./pages/admin/ManageRoadmaps.jsx";
import Moderation from "./pages/admin/Moderation.jsx";
import ManageCareers from "./pages/admin/ManageCareers.jsx";
import ManageEvents from "./pages/admin/ManageEvents.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";

import NotFound from "./pages/NotFound.jsx";

function Home() {
  const { user } = useAuth();
  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NotificationProvider>
          <SocketProvider>
            <AssessmentProvider>
              {/* 🚨 CHAT PROVIDER ADDED HERE 🚨 */}
              <ChatProvider>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Student portal — AppShell mounts ONCE for all student routes */}
                  <Route
                    element={
                      <ProtectedRoute role="student">
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
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

                  {/* Mentor portal — AppShell mounts ONCE */}
                  <Route
                    path="/mentor"
                    element={
                      <ProtectedRoute role="Mentor">
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/mentor/dashboard" replace />} />
                    <Route path="dashboard" element={<MentorDashboard />} />
                    <Route path="requests" element={<MentorRequests />} />
                    <Route path="mentees" element={<MyMentees />} />
                    <Route path="mentees/:id" element={<MyMentees />} />
                    <Route path="sessions" element={<MentorSessions />} />
                    <Route path="insights" element={<MentorInsights />} />
                    <Route path="hub" element={<CommunicationHub />} />
                  </Route>

                  {/* Admin portal — AppShell mounts ONCE */}
                  <Route
                    element={
                      <ProtectedRoute role="admin">
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/careers" element={<ManageCareers />} />
                    <Route path="/admin/events" element={<ManageEvents />} />
                    <Route path="/admin/market-data" element={<ManageMarket />} />
                    <Route path="/admin/roadmaps" element={<ManageRoadmaps />} />
                    <Route path="/admin/moderation" element={<Moderation />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ChatProvider>
            </AssessmentProvider>
          </SocketProvider>
        </NotificationProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}