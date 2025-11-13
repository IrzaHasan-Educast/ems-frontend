// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import AdminDashboard from "./pages/AdminDashboard";
import HrDashboard from "./pages/HrDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

function App() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      setUserRole(role.toUpperCase());
    }
  }, []);

  // 🔁 Logout handler (shared)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUserRole(null); // reset state
  };

  return (
    <Router>
      <Routes>
        {/* 🔐 Login Route */}
        <Route
          path="/login"
          element={
            userRole ? (
              <Navigate to={`/${userRole.toLowerCase()}`} />
            ) : (
              <LoginForm setUserRole={(role) => setUserRole(role.toUpperCase())} />
            )
          }
        />

        {/* 🧭 Admin Dashboard */}
        <Route
          path="/admin"
          element={
            userRole === "ADMIN" ? (
              <AdminDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 👩‍💼 HR Dashboard */}
        <Route
          path="/hr"
          element={
            userRole === "HR" ? (
              <HrDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 👨‍🔧 Employee Dashboard */}
        <Route
          path="/employee"
          element={
            userRole === "EMPLOYEE" ? (
              <EmployeeDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
