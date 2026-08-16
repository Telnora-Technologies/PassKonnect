import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import SiteHeader from "./components/SiteHeader";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NewBusiness from "./pages/NewBusiness";
import BusinessDetail from "./pages/BusinessDetail";
import PublicProfile from "./pages/PublicProfile";
import Directory from "./pages/Directory";
import AdminQueue from "./pages/AdminQueue";

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="page">
        <SiteHeader />

        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/p/:id" element={<PublicProfile />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/businesses/new"
            element={
              <ProtectedRoute>
                <NewBusiness />
              </ProtectedRoute>
            }
          />
          <Route
            path="/businesses/:id"
            element={
              <ProtectedRoute>
                <BusinessDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminQueue />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <p className="footer">Built by Telnora Technologies · AfCFTA Digital Innovation Challenge</p>
      </div>
    </AuthProvider>
  );
}
