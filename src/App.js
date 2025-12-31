// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LoginForm from "./components/LoginForm";
import AdminDashboard from "./pages/admin/AdminDashboard";
import HrDashboard from "./pages/hr/HrDashboard";
import AllEmployees from "./pages/admin/AllEmployees";
import AddEmployee from "./pages/admin/AddEmployee";
import EditEmployee from "./pages/admin/EditEmployee";
import ViewShifts from "./pages/admin/shifts/ViewShifts";
import AddShift from "./pages/admin/shifts/AddShift";

import WorkSessions from "./pages/admin/WorkSessions";
import Attendance from "./pages/admin/Attendance";
import LeaveHistory from "./pages/employee/LeaveHistory"; 
import AllLeaves from "./pages/admin/AllLeaves"; 

import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import WorkSessionHistory from "./pages/employee/WorkSessionHistory";
import AttendanceHistory from "./pages/employee/AttendanceHistory";

import jwtHelper from "./utils/jwtHelper";
import { isTokenExpired } from "./utils/checkToken";
import ApplyLeave from "./pages/employee/ApplyLeave";
import EditShift from "./pages/admin/shifts/EditShift";
import ViewEmployeeShifts from "./pages/admin/employeeShift/ViewEmployeeShifts";
import AssignEmployeeShift from "./pages/admin/employeeShift/AssignEmployeeShift";

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
            <ProtectedRoute allowedRoles={["ADMIN","HR"]}>
              <AllEmployees onLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employees/add"
          element={
            <ProtectedRoute allowedRoles={["ADMIN","HR"]}>
              <AddEmployee onLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employees/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <EditEmployee onLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />

        <Route path="/admin/shifts" element={<ViewShifts />} />
        <Route path="/admin/shifts/add" element={<AddShift />} />
        <Route path="/admin/shifts/edit/:id" element={<EditShift />} />

{/* ===== EMPLOYEE ↔ SHIFT ===== */}
      <Route
        path="/admin/employee-shifts/assign"
        element={<ViewEmployeeShifts onLogout={handleLogout} />}
      />
      {/* <Route
        path="/admin/shifts/assign"
        element={<AssignEmployeeShift onLogout={handleLogout} />}
      /> */}
      {/* <Route
        path="/admin/employee-shifts/edit/:id"
        element={<EditEmployeeShift onLogout={handleLogout} />}
      /> */}

        <Route
          path="/admin/work-sessions"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <WorkSessions onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <Attendance onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/leaves"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <AllLeaves onLogout={handleLogout} />
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
          path="/employee/work-history"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <WorkSessionHistory onLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/attendance-history"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <AttendanceHistory onLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leave-history"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <LeaveHistory onLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leave/apply"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <ApplyLeave onLogout={handleLogout}/>
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
