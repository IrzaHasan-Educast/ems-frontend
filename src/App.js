// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LoginForm from "./components/LoginForm";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AllEmployees from "./pages/admin/AllEmployees";
import AddEmployee from "./pages/admin/AddEmployee";
import EditEmployee from "./pages/admin/EditEmployee";
import WorkSessions from "./pages/admin/WorkSessions";

import HrDashboard from "./pages/HrDashboard";

import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import AttendanceHistory from "./pages/employee/AttendanceHistory";

import jwtHelper from "./utils/jwtHelper";
import { isTokenExpired } from "./utils/checkToken";

function App() {

  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ------------------------------------------------
  // 🔥 FIXED useEffect — no redirects here
  // ------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token && !isTokenExpired(token)) {
      const role = jwtHelper.getRoleFromToken(token);
      if (role) setUserRole(role.toUpperCase());
    } else {
      localStorage.clear();
      setUserRole(null);
    }

    setIsLoading(false);
  }, []);

  // ------------------------------------------------
  // 🔐 Logout
  // ------------------------------------------------
  const handleLogout = () => {
    localStorage.clear();
    setUserRole(null);
  };

  // ------------------------------------------------
  // 🔐 Protected Route
  // ------------------------------------------------
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!userRole) {
      return <Navigate to="/login" replace />;
    }
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  if (isLoading) return <div>Loading...</div>;

  // ------------------------------------------------
  // 🔥 ROUTES
  // ------------------------------------------------
  return (
    <Router>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            userRole ? (
              <Navigate to={`/${userRole.toLowerCase()}`} replace />
            ) : (
              <LoginForm setUserRole={(role) => setUserRole(role.toUpperCase())} />
            )
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AllEmployees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employees/add"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AddEmployee />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employees/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <EditEmployee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/work-sessions"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <WorkSessions onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* HR ROUTES */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <HrDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* EMPLOYEE ROUTES */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <EmployeeDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/attendance-history"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <AttendanceHistory />
            </ProtectedRoute>
          }
        />

        {/* DEFAULT */}
        <Route
          path="*"
          element={
            userRole ? (
              <Navigate to={`/${userRole.toLowerCase()}`} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
