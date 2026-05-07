// src/App.jsx
import { AnimatePresence } from "framer-motion";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import PageTransition from "../src/components/common/PageTransition.jsx";
import "./index.css";

import { AuthProvider, useAuth } from "../src/context/AuthContext.jsx";
import { AssessmentProvider } from "../src/context/AssessmentContext.jsx";

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

import MentorDashboard from "./pages/mentor/MentorDashboard.jsx";
import MenteeDetail from "./pages/mentor/MenteeDetail.jsx";
import CommunicationHub from "./pages/mentor/CommunicationHub.jsx";

// ADMIN IMPORTS
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

function AnimatedRouter() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes with transitions */}
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />

        {/* Note: The ProtectedRoute/AppShell wrap their children. 
            Internal sub-page transitions are handled inside AppShell.jsx 
        */}
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
    <AuthProvider>
      <AssessmentProvider>
        <BrowserRouter>
          <AnimatedRouter />
        </BrowserRouter>
      </AssessmentProvider>
    </AuthProvider>
  );
}