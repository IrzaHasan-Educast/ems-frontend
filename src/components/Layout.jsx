// src/components/Layout.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./Navbar";

const Layout = ({ children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="d-flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onLogout={onLogout} 
        toggleSidebar={toggleSidebar} 
      />
      
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <TopNavbar 
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role")}
          onLogout={onLogout}
        />
        
        <div className="p-3 container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;