// src/pages/Dashboard.jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/Navbar";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} />
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
