import React, { useState, useEffect } from "react";
import { Nav } from "react-bootstrap";
import { useNavigate, NavLink } from "react-router-dom";
import Logo from "../assets/images/Educast-Logo.png"; // Apna path check kar lena
import jwtHelper from "../utils/jwtHelper";

const Sidebar = ({ isOpen, onLogout }) => {
  const navigate = useNavigate();
  
  // State for Dropdowns
  const [showEmployees, setShowEmployees] = useState(false);
  const [showShifts, setShowShifts] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  // Get Role from Token
  const token = localStorage.getItem("token");
  const role = jwtHelper.getRoleFromToken(token); 
  // Agar role null hai (token nahi hai), toh empty string maan lo safety ke liye
  const userRole = role ? role.toUpperCase() : "";

  const handleLogout = () => {
    localStorage.clear(); // Token, role, sab clear
    if (onLogout) onLogout(); 
    navigate("/login"); 
  };

  // Common Style for links
  const linkStyle = { textDecoration: "none", color: "white" };

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
        transition: "width 0.3s",
        width: isOpen ? "250px" : "80px"
      }}
    >
      {/* ================= HEADER & LOGO ================= */}
      <div>
        <div className="text-center">
          <div className="bg-white border rounded-4 p-2 d-inline-block">
            <img src={Logo} alt="Educast" width={isOpen ? "100" : "40"} />
          </div>
          {isOpen && <h5 className="mt-2 fw-bold">Educast</h5>}
        </div>

        <Nav className="flex-column mt-4">
          
          {/* =======================================================
              SECTION 1: ADMIN & HR VIEW
          ======================================================== */}
          {(userRole === "ADMIN" || userRole === "HR") && (
            <>
              <NavLink to="/admin/dashboard" className="text-white mt-2" style={linkStyle}>
                <i className="bi bi-speedometer2 me-2"></i>
                {isOpen && "Dashboard"}
              </NavLink>

              {/* Employees Dropdown */}
              <div className="mt-2">
                <Nav.Link className="text-white d-block mb-1" onClick={() => setShowEmployees(!showEmployees)}>
                  <i className="bi bi-people-fill me-2"></i>
                  {isOpen && "Employees"}
                  {isOpen && <i className={`bi ms-2 ${showEmployees ? "bi-chevron-up" : "bi-chevron-down"}`}></i>}
                </Nav.Link>
                {showEmployees && isOpen && (
                  <div className="ms-4 mt-2">
                    <NavLink to="/admin/employees" className="text-white d-block mb-1" style={linkStyle}>
                      <i className="bi bi-person-lines-fill me-2"></i> All Employees
                    </NavLink>
                    <NavLink to="/admin/employees/add" className="text-white d-block mb-1" style={linkStyle}>
                      <i className="bi bi-person-plus me-2"></i> Add Employee
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Shifts Dropdown */}
              <div className="mt-2">
                <Nav.Link className="text-white d-block mb-1" onClick={() => setShowShifts(!showShifts)}>
                  <i className="bi bi-clock me-2"></i>
                  {isOpen && "Shifts"}
                  {isOpen && <i className={`bi ms-2 ${showShifts ? "bi-chevron-up" : "bi-chevron-down"}`}></i>}
                </Nav.Link>
                {showShifts && isOpen && (
                  <div className="ms-4 mt-2">
                    <NavLink to="/admin/shifts" className="text-white d-block mb-1" style={linkStyle}>
                      <i className="bi bi-list-ul me-2"></i> All Shifts
                    </NavLink>
                    <NavLink to="/admin/shifts/add" className="text-white d-block mb-1" style={linkStyle}>
                      <i className="bi bi-plus-circle me-2"></i> Add Shift
                    </NavLink>
                  </div>
                )}
              </div>

              <NavLink to="/admin/work-sessions" className="text-white mt-2" style={linkStyle}>
                <i className="bi bi-clock-history me-2"></i> {isOpen && "Work Sessions"}
              </NavLink>

              <NavLink to="/admin/attendance" className="text-white mt-2" style={linkStyle}>
                <i className="bi bi-calendar-check me-2"></i> {isOpen && "Attendance"}
              </NavLink>

              <NavLink to="/admin/leaves" className="text-white mt-2" style={linkStyle}>
                <i className="bi bi-calendar2-event me-2"></i> {isOpen && "Leave Management"}
              </NavLink>
            </>
          )}

          {/* =======================================================
              SECTION 2: EMPLOYEE & MANAGER VIEW
          ======================================================== */}
          {(userRole === "EMPLOYEE" || userRole === "MANAGER") && (
            <>
              <NavLink to="/employee/dashboard" className="text-white mb-2" style={linkStyle}>
                <i className="bi bi-speedometer2 me-2"></i> {isOpen && "Dashboard"}
              </NavLink>
              
              <NavLink to="/employee/work-history" className="text-white mb-2" style={linkStyle}>
                <i className="bi bi-clock-history me-2"></i> {isOpen && "Work Sessions"}
              </NavLink>

              <NavLink to="/employee/attendance-history" className="text-white mb-2" style={linkStyle}>
                <i className="bi bi-calendar-check me-2"></i> {isOpen && "Attendance History"}
              </NavLink>

              {/* Leave Dropdown */}
              <div>
                <Nav.Link className="text-white d-block mb-1" onClick={() => setLeaveOpen(!leaveOpen)}>
                  <i className="bi bi-calendar2-plus me-2"></i>
                  {isOpen && "Leave"}
                  {isOpen && <i className={`bi ms-2 ${leaveOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>}
                </Nav.Link>
                {leaveOpen && isOpen && (
                  <div className="ms-4 mt-2">
                    <NavLink to="/employee/leave-history" className="text-white d-block mb-1" style={linkStyle}>
                       Leave History
                    </NavLink>
                    <NavLink to="/employee/leave/apply" className="text-white d-block mb-1" style={linkStyle}>
                       Apply Leave
                    </NavLink>
                  </div>
                )}
              </div>

              {/* =======================================================
                  SECTION 3: MANAGER EXCLUSIVE (Nested inside Employee view)
              ======================================================== */}
              {userRole === "MANAGER" && (
                <>
                  {isOpen && <hr className="bg-white my-3" />}
                  
                  <NavLink to="/manager/team-sessions" className="text-white mb-2" style={linkStyle}>
                    <i className="bi bi-people-fill me-2"></i>
                    {isOpen && "Team Sessions"}
                  </NavLink>

                  <NavLink to="/manager/team-attendance" className="text-white mb-2" style={linkStyle}>
                    <i className="bi bi-calendar2-week me-2"></i>
                    {isOpen && "Team Attendance"}
                  </NavLink>
                </>
              )}
            </>
          )}

        </Nav>
      </div>

      {/* ================= FOOTER (LOGOUT) ================= */}
      <div>
        <button
          className="btn btn-link text-white text-start w-100 d-block mb-1 mt-2"
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