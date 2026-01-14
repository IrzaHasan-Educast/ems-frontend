import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
// import "../styles/Sidebar.css";

const ManagerSidebar = ({ isOpen, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded ${
      isActive ? "active bg-white text-primary fw-semibold" : "text-white"
    }`;

  return (
    <div
      className={`sidebar d-flex flex-column p-3 ${isOpen ? "open" : "closed"}`}
      style={{
        width: isOpen ? "250px" : "0px",
        minHeight: "100vh",
        backgroundColor: "#055993",
        transition: "width 0.3s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div className="text-center mb-4">
        <h4 className="text-white fw-bold">
          <i className="bi bi-person-workspace me-2"></i>
          {isOpen && "Manager Panel"}
        </h4>
      </div>

      {/* Navigation */}
      <ul className="nav flex-column gap-2 flex-grow-1">
        <li className="nav-item">
          <NavLink to="/manager/dashboard" className={linkClass}>
            <i className="bi bi-speedometer2"></i>
            {isOpen && <span>Dashboard</span>}
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink to="/employee/work-history" className={linkClass}>
            <i className="bi bi-clock-history"></i>
            {isOpen && <span>My Work History</span>}
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink to="/employee/attendance-history" className={linkClass}>
            <i className="bi bi-calendar-check"></i>
            {isOpen && <span>My Attendance</span>}
          </NavLink>
        </li>

        <hr className="bg-white" />

        <li className="nav-item">
          <NavLink to="/manager/team-sessions" className={linkClass}>
            <i className="bi bi-people-fill"></i>
            {isOpen && <span>Team Work Sessions</span>}
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink to="/manager/team-attendance" className={linkClass}>
            <i className="bi bi-calendar2-week"></i>
            {isOpen && <span>Team Attendance</span>}
          </NavLink>
        </li>

        {/* <li className="nav-item">
          <NavLink to="/manager/leave-requests" className={linkClass}>
            <i className="bi bi-envelope-paper"></i>
            {isOpen && <span>Leave Requests</span>}
          </NavLink>
        </li> */}
      </ul>

      {/* Logout */}
      <div className="mt-auto">
        <button
          className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right"></i>
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default ManagerSidebar;