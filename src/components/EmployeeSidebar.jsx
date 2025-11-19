// src/components/EmployeeSidebar.jsx
import React from "react";
import { Nav } from "react-bootstrap";
import { useNavigate, NavLink } from "react-router-dom";
import Logo from "../assets/images/Educast-Logo.png";

const EmployeeSidebar = ({ isOpen, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  return (
    <div
      className={`sidebar d-flex flex-column justify-content-between p-3 ${
        isOpen ? "sidebar-open" : "sidebar-closed"
      }`}
      style={{
        backgroundColor: "#f58a29",
        color: "white",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
      }}
    >
      {/* Logo Section */}
      <div>
        <div className="text-center">
          <div className="bg-white border rounded-4 p-2">
            <img src={Logo} alt="Educast" width={isOpen ? "100" : "40"} />
          </div>
          {isOpen && <h5 className="mt-2 fw-bold">Educast</h5>}
        </div>

        <Nav className="flex-column mt-4">
          <NavLink
            to="/employee/dashboard"
            className="text-white mb-2"
            style={{ textDecoration: "none" }}
          >
            <i className="bi bi-speedometer2 me-2"></i> {isOpen && "Dashboard"}
          </NavLink>
          <NavLink
            to="/employee/attendance-history"
            className="text-white mb-2"
            style={{ textDecoration: "none" }}
          >
            <i className="bi bi-speedometer2 me-2"></i> {isOpen && "Attendance History"}
          </NavLink>

          <NavLink
            to="/employee/apply-leave"
            className="text-white mt-2"
            style={{ textDecoration: "none" }}
          >
            <i className="bi bi-calendar2-plus me-2"></i> {isOpen && "Apply Leave"}
          </NavLink>
        </Nav>
      </div>

      {/* Logout Button */}
      <div>
        <button
          className="btn btn-link text-white text-start w-100 p-0"
          onClick={handleLogout}
          style={{ textDecoration: "none" }}
        >
          <i className="bi bi-box-arrow-right me-2"></i> {isOpen && "Logout"}
        </button>
      </div>
    </div>
  );
};

export default EmployeeSidebar;
