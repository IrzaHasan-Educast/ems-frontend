// src/components/Sidebar.jsx
import React, { useState } from "react";
import { Nav } from "react-bootstrap";
import { useNavigate, NavLink } from "react-router-dom";

import Logo from "../assets/images/Educast-Logo.png";

const Sidebar = ({ isOpen, onLogout, user }) => {
  const [showEmployees, setShowEmployees] = useState(false);
  const [showShifts, setShowShifts] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    if (onLogout) onLogout(); // update App state
    navigate("/login"); // SPA-friendly redirect
  };

  return (
    <div
      className={`sidebar d-flex flex-column justify-content-between p-3 ${
        isOpen ? "sidebar-open" : "sidebar-closed"
      }`}
      style={{
        backgroundColor: "#f58a29",
        color: "white",
        minHeight: "100dvh",
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

        <Nav className="flex-column">
          <NavLink to="/admin/dashboard" className="text-white mt-3" style={{ textDecoration: "none" }}>
            <i className="bi bi-speedometer2 me-2"></i>
            {isOpen && "Dashboard"}
          </NavLink>

         {/* Employees Dropdown */}
          <div className="mt-3">
            <Nav.Link
              className="text-white"
              onClick={() => setShowEmployees(!showEmployees)}
              style={{ textDecoration: "none" }}
            >
              <i className="bi bi-people-fill me-2"></i>
              {isOpen && "Employees"}
              {isOpen && (
                <i
                  className={`bi ms-2 ${
                    showEmployees ? "bi-chevron-up" : "bi-chevron-down"
                  }`}
                ></i>
              )}
            </Nav.Link>

            {showEmployees && (
              <div className="ms-4 mt-2">
                <NavLink
                  to="/admin/employees"
                  className="text-white d-block mb-1"
                  style={{ textDecoration: "none" }}
                >
                  <i className="bi bi-person-lines-fill me-2"></i> All Employees
                </NavLink>

                <NavLink
                  to="/admin/employees/add"
                  className="text-white d-block mb-1"
                  style={{ textDecoration: "none" }}
                >
                  <i className="bi bi-person-plus me-2"></i> Add Employee
                </NavLink>
              </div>
            )}

          </div>

          {/* Shifts Dropdown */}
            <div className="mt-3">
              <Nav.Link
                className="text-white"
                onClick={() => setShowShifts(!showShifts)}
                style={{ textDecoration: "none" }}
              >
                <i className="bi bi-clock me-2"></i>
                {isOpen && "Shifts"}
                {isOpen && (
                  <i
                    className={`bi ms-2 ${
                      showShifts ? "bi-chevron-up" : "bi-chevron-down"
                    }`}
                  ></i>
                )}
              </Nav.Link>

              {showShifts && (
                <div className="ms-4 mt-2">
                  <NavLink
                    to="/admin/shifts"
                    className="text-white d-block mb-1"
                    style={{ textDecoration: "none" }}
                  >
                    <i className="bi bi-list-ul me-2"></i> All Shifts
                  </NavLink>

                  <NavLink
                    to="/admin/shifts/add"
                    className="text-white d-block mb-1"
                    style={{ textDecoration: "none" }}
                  >
                    <i className="bi bi-plus-circle me-2"></i> Add Shift
                  </NavLink>
                </div>
              )}
            </div>


          {/* Work Sessions Link */}
          <NavLink
            to="/admin/work-sessions"
            className="text-white mt-3"
            style={{ textDecoration: "none" }}
          >
            <i className="bi bi-clock-history me-2"></i> {isOpen && "Work Sessions"}
          </NavLink>

          <NavLink to="/admin/attendance" className="text-white mt-3" style={{ textDecoration: "none" }}>
            <i className="bi bi-calendar-check me-2"></i> {isOpen && "Attendance"}
          </NavLink>

          <NavLink to="/admin/leaves" className="text-white mt-3" style={{ textDecoration: "none" }}>
            <i className="bi bi-calendar2-event me-2"></i>
            {isOpen && "Leave Management"}
          </NavLink>


          {/*<NavLink to="/admin/settings" className="text-white mt-3" style={{ textDecoration: "none" }}>
            <i className="bi bi-gear me-2"></i> {isOpen && "Settings"}
          </NavLink> */}
        </Nav>
      </div>

      {/* Logout */}
      <div>
        <button
          className="btn btn-link text-start text-white w-100 p-3"
          onClick={handleLogout}
          style={{ textDecoration: "none" }}
        >
          <i className="bi bi-box-arrow-right me-2"></i> {isOpen && "Logout"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
