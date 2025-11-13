// src/pages/AdminDashboard.jsx
import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";

// The component now correctly receives 'onLogout' as a prop
const AdminDashboard = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="d-flex">
    {/* The 'onLogout' prop is passed down to the Sidebar component */}
    <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} />
        <div className="p-4">
          <h3 className="text-primary">Welcome to Educast Dashboard</h3>
          <p className="text-muted">
            Manage Employees, Attendance, Leaves, and Settings here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
