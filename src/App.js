// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap"; 

// Images
import Logo from "./assets/images/Educast-Logo.png"; 

// Components
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

import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerLeaveRequests from "./pages/manager/ManagerLeaveRequests";
import ManagerTeam from "./pages/manager/ManagerTeam";
import TeamWorkSessions from "./pages/manager/TeamWorkSessions";
import TeamAttendance from "./pages/manager/TeamAttendance";

import jwtHelper from "./utils/jwtHelper";
import { isTokenExpired } from "./utils/checkToken";
import ApplyLeave from "./pages/employee/ApplyLeave";
import EditShift from "./pages/admin/shifts/EditShift";
import ViewEmployeeShifts from "./pages/admin/employeeShift/ViewEmployeeShifts";
import EmployeeProfile from "./pages/employee/EmployeeProfile";

function App() {

  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ------------------------------------------------
  // 🔥 AUTH CHECK WITH DELAY (SPLASH SCREEN)
  // ------------------------------------------------
  useEffect(() => {
    // Artificial Delay of 2 Seconds (2000ms)
    const timer = setTimeout(() => {
        const token = localStorage.getItem("token");

        if (token && !isTokenExpired(token)) {
            const role = jwtHelper.getRoleFromToken(token);
            if (role) setUserRole(role.toUpperCase());
        } else {
            localStorage.clear();
            setUserRole(null);
        }
        
        setIsLoading(false); // Stop loading after 2 seconds
    }, 2000);

    return () => clearTimeout(timer); // Cleanup
  }, []);

  // ------------------------------------------------
  // 🔐 Logout
  // ------------------------------------------------
  const handleLogout = () => {
    localStorage.clear();
    setUserRole(null);
  };

  // ------------------------------------------------
  // 🔐 Protected Route Component
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

  // ------------------------------------------------
  // ✨ IMPROVED LOADING SCREEN
  // ------------------------------------------------
  if (isLoading) {
    return (
      <div 
        className="d-flex flex-column justify-content-center align-items-center vh-100" 
        style={{ backgroundColor: "#f8f9fa" }}
      >
        <div className="text-center">
            {/* Logo Animation */}
            <div className="mb-4">
                <img 
                    src={Logo} 
                    alt="EduCast Logo" 
                    style={{ width: "90px", animation: "fadeIn 1.5s ease-in-out" }} 
                />
            </div>
            
            <h2 className="fw-bold mb-4" style={{ letterSpacing: "1px", fontFamily: "sans-serif" }}>
                <span style={{ color: "#f58a29" }}>Edu</span>
                <span style={{ color: "#055993" }}>Cast</span>
            </h2>

            {/* Bootstrap Spinners */}
            <div className="d-flex justify-content-center gap-2 mt-2">
                <Spinner animation="grow" variant="warning" size="sm" style={{animationDuration: "1s"}} />
                <Spinner animation="grow" variant="primary" size="sm" style={{animationDuration: "1.2s"}} />
                <Spinner animation="grow" variant="warning" size="sm" style={{animationDuration: "1.4s"}} />
            </div>
            
            <p className="mt-3 text-muted small fw-semibold">Securely Loading...</p>
        </div>
      </div>
    );
  }

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

        <Route path="/admin/shifts" element={
          <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <ViewShifts onLogout={handleLogout}/>
            </ProtectedRoute>
            } />
        <Route path="/admin/shifts/add" element={
          <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <AddShift onLogout={handleLogout}/>
            </ProtectedRoute>} />
        <Route path="/admin/shifts/edit/:id" element={
          <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <EditShift onLogout={handleLogout}/>
            </ProtectedRoute>
          } />

        {/* ===== EMPLOYEE ↔ SHIFT ===== */}
        <Route
            path="/admin/employee-shifts/assign"
            element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <ViewEmployeeShifts onLogout={handleLogout} />
            </ProtectedRoute>
            }
        />

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

        {/* MANAGER ROUTES */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]}>
              <ManagerDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="/manager/team" element={<ProtectedRoute allowedRoles={["MANAGER"]}><ManagerTeam onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/manager/team-sessions" element={
          <ProtectedRoute allowedRoles={["MANAGER"]}><TeamWorkSessions onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="/manager/team-attendance" element={<ProtectedRoute allowedRoles={["MANAGER"]}><TeamAttendance onLogout={handleLogout} /></ProtectedRoute>} />
        <Route
          path="/manager/team-leave"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]}><ManagerLeaveRequests onLogout={handleLogout} />
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
          path="/employee/my-profile"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE","ADMIN","HR","MANAGER"]}>
              <EmployeeProfile onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/work-history"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE", "MANAGER"]}>
              <WorkSessionHistory onLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/attendance-history"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE", "MANAGER"]}>
              <AttendanceHistory onLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leave-history"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE", "MANAGER"]}>
              <LeaveHistory onLogout={handleLogout}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leave/apply"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE", "MANAGER"]}>
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