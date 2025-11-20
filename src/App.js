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
import jwtHelper from "./utils/jwtHelper";

function App() {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = jwtHelper.getRoleFromToken(token);
    if (token && role) setUserRole(role.toUpperCase());
    setIsLoading(false); //role loaded
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserRole(null);
  };

  if(isLoading){
    return <div>Loading...</div>
  }

  // Protected Route wrapper
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!userRole) return <Navigate to="/login" replace />;
    if (!allowedRoles.includes(userRole)) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Login */}
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

        {/* Admin Routes */}
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

        {/* HR Routes */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={["HR"]}>
              <HrDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Employee Routes */}
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

        {/* Catch all */}
        <Route path="*" element={<Navigate to={userRole ? `/${userRole.toLowerCase()}` : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
