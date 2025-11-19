// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AllEmployees from "./pages/admin/AllEmployees";
import AddEmployee from "./pages/admin/AddEmployee";
import EditEmployee from "./pages/admin/EditEmployee";
import HrDashboard from "./pages/HrDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import AttendanceHistory from "./pages/employee/AttendanceHistory";

function App() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      setUserRole(role.toUpperCase());
    }
  }, []);

  // 🔁 Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUserRole(null);
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

        {/* 🧭 Admin Routes */}
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

        {/* Admin - Employee CRUD routes */}
        <Route
          path="/admin/employees"
          element={
            userRole === "ADMIN" ? <AllEmployees /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/admin/employees/add"
          element={
            userRole === "ADMIN" ? <AddEmployee /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/admin/employees/edit/:id"
          element={
            userRole === "ADMIN" ? <EditEmployee /> : <Navigate to="/login" />
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
        {/* 👨‍🔧 Employee - Attendance History */}
        <Route
          path="/employee/attendance-history"
          element={
            userRole === "EMPLOYEE" ? (
              <AttendanceHistory />
            ) : (
              <Navigate to="/login" />
            )
          }
        />


        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" />} />


        <Route path="/admin/employees" element={<AllEmployees />} />
        <Route path="/admin/employees/add" element={<AddEmployee />} />
        <Route path="/admin/employees/edit/:id" element={<EditEmployee />} />


      </Routes>
    </Router>
  );
}

export default App;
