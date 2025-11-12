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
      setUserRole(role.toUpperCase()); // Normalize role to uppercase
    }
  }, []);

  return (
    <Router>
      <Routes>
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

        <Route
          path="/admin"
          element={
            userRole === "ADMIN" ? <AdminDashboard /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/hr"
          element={userRole === "HR" ? <HrDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/employee"
          element={
            userRole === "EMPLOYEE" ? <EmployeeDashboard /> : <Navigate to="/login" />
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
