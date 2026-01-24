import React, { useState } from "react";
import { Nav } from "react-bootstrap";
import { useNavigate, NavLink } from "react-router-dom";
import Logo from "../assets/images/Educast-Logo.png"; 
import jwtHelper from "../utils/jwtHelper";

const Sidebar = ({ isOpen, onLogout, toggleSidebar }) => {
  const navigate = useNavigate();
  
  // State for Dropdowns
  const [showEmployees, setShowEmployees] = useState(false);
  const [showShifts, setShowShifts] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  // Get Role
  const token = localStorage.getItem("token");
  const role = jwtHelper.getRoleFromToken(token);
  const userRole = role ? role.toUpperCase() : "";

  // --- HELPER: Close sidebar on mobile when a link is clicked ---
  const handleMobileClose = () => {
    // Check if screen is small (mobile/tablet) AND sidebar is currently open
    if (window.innerWidth < 992 && isOpen && toggleSidebar) {
      toggleSidebar();
    }
  };

  const handleLogout = () => {
    handleMobileClose(); // Close sidebar on mobile
    localStorage.clear();
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Overlay (Backdrop) - Closes sidebar when clicking outside */}
      <div 
        className={`sidebar-overlay ${isOpen ? "show" : ""}`} 
        onClick={toggleSidebar}
      ></div>

      <div
        className={`sidebar d-flex flex-column justify-content-between p-3 ${
          isOpen ? "sidebar-open" : "sidebar-closed"
        }`}
      >
        {/* ================= HEADER ================= */}
        <div>
          <div className="text-center mb-4">
            <div className="bg-white border rounded-4 p-2 d-inline-block">
              <img 
                src={Logo} 
                alt="Educast" 
                className="sidebar-logo"
                width={isOpen ? "100" : "30"} 
                style={{transition: "width 0.3s"}}
              />
            </div>
            {/* Title only shows when open */}
            <h5 className={`mt-2 fw-bold ${!isOpen ? "d-none" : ""}`} style={{ whiteSpace: "nowrap" }}>
              Educast
            </h5>
          </div>

          <Nav className="flex-column">
            
            {/* --- ADMIN & HR --- */}
            {(userRole === "ADMIN" || userRole === "HR") && (
              <>
                <NavLink to="/admin/dashboard" className="mb-2" onClick={handleMobileClose}>
                  <i className="bi bi-speedometer2 me-2"></i>
                  <span className="link-text">Dashboard</span>
                </NavLink>

                {/* Employees Dropdown */}
                <div className="mb-2">
                  <div className="d-flex align-items-center justify-content-between" 
                       style={{cursor: "pointer", padding: "10px 12px", color: "white"}}
                       onClick={() => { if(isOpen) setShowEmployees(!showEmployees); else toggleSidebar(); }}>
                    <div className="d-flex align-items-center">
                       <i className="bi bi-people-fill me-2"></i>
                       <span className="link-text">Employees</span>
                    </div>
                    <i className={`bi dropdown-arrow ${showEmployees ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                  </div>
                  
                  {showEmployees && (
                    <div className="submenu-container sidebar-submenu">
                      <NavLink to="/admin/employees" className="mb-1" onClick={handleMobileClose}>
                        <i className="bi bi-dot"></i> All Employees
                      </NavLink>
                      <NavLink to="/admin/employees/add" className="mb-1" onClick={handleMobileClose}>
                        <i className="bi bi-dot"></i> Add Employee
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* Shifts Dropdown */}
                <div className="mb-2">
                  <div className="d-flex align-items-center justify-content-between" 
                       style={{cursor: "pointer", padding: "10px 12px", color: "white"}}
                       onClick={() => { if(isOpen) setShowShifts(!showShifts); else toggleSidebar(); }}>
                    <div className="d-flex align-items-center">
                       <i className="bi bi-clock me-2"></i>
                       <span className="link-text">Shifts</span>
                    </div>
                    <i className={`bi dropdown-arrow ${showShifts ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                  </div>
                  
                  {showShifts && (
                    <div className="submenu-container sidebar-submenu">
                      <NavLink to="/admin/shifts" className="mb-1" onClick={handleMobileClose}>
                        <i className="bi bi-dot"></i> All Shifts
                      </NavLink>
                      <NavLink to="/admin/shifts/add" className="mb-1" onClick={handleMobileClose}>
                        <i className="bi bi-dot"></i> Add Shift
                      </NavLink>
                    </div>
                  )}
                </div>

                <NavLink to="/admin/work-sessions" className="mb-2" onClick={handleMobileClose}>
                  <i className="bi bi-clock-history me-2"></i> <span className="link-text">Work Sessions</span>
                </NavLink>
                <NavLink to="/admin/attendance" className="mb-2" onClick={handleMobileClose}>
                  <i className="bi bi-calendar-check me-2"></i> <span className="link-text">Attendance</span>
                </NavLink>
                <NavLink to="/admin/leaves" className="mb-2" onClick={handleMobileClose}>
                  <i className="bi bi-calendar2-event me-2"></i> <span className="link-text">Leaves</span>
                </NavLink>
              </>
            )}

            {/* --- EMPLOYEE / MANAGER --- */}
            {(userRole === "EMPLOYEE" || userRole === "MANAGER") && (
              <>
                <NavLink to="/employee/dashboard" className="mb-2" onClick={handleMobileClose}>
                  <i className="bi bi-speedometer2 me-2"></i> <span className="link-text">Dashboard</span>
                </NavLink>
                
                <NavLink to="/employee/work-history" className="mb-2" onClick={handleMobileClose}>
                  <i className="bi bi-clock-history me-2"></i> <span className="link-text">Work History</span>
                </NavLink>

                <NavLink to="/employee/attendance-history" className="mb-2" onClick={handleMobileClose}>
                  <i className="bi bi-calendar-check me-2"></i> <span className="link-text">Attendance</span>
                </NavLink>

                {/* Leaves Dropdown */}
                 <div className="mb-2">
                  <div className="d-flex align-items-center justify-content-between" 
                       style={{cursor: "pointer", padding: "10px 12px", color: "white"}}
                       onClick={() => { if(isOpen) setLeaveOpen(!leaveOpen); else toggleSidebar(); }}>
                    <div className="d-flex align-items-center">
                       <i className="bi bi-calendar2-plus me-2"></i>
                       <span className="link-text">Leave</span>
                    </div>
                    <i className={`bi dropdown-arrow ${leaveOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                  </div>
                  
                  {leaveOpen && (
                    <div className="submenu-container sidebar-submenu">
                       <NavLink to="/employee/leave-history" className="mb-1" onClick={handleMobileClose}>
                        <i className="bi bi-dot"></i> History
                      </NavLink>
                      <NavLink to="/employee/leave/apply" className="mb-1" onClick={handleMobileClose}>
                        <i className="bi bi-dot"></i> Apply Leave
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* MANAGER SPECIFIC */}
                {userRole === "MANAGER" && (
                  <>
                    <div className="my-2 border-top border-light opacity-50"></div>
                    <small className="text-uppercase text-white-50 ms-2 mb-2 fw-bold link-text" style={{fontSize: "0.7rem"}}>Manager Panel</small>
                    
                    <NavLink to="/manager/team" className="mb-2" onClick={handleMobileClose}>
                      <i className="bi bi-people-fill me-2"></i> <span className="link-text">My Team</span>
                    </NavLink>
                    <NavLink to="/manager/team-sessions" className="mb-2" onClick={handleMobileClose}>
                      <i className="bi bi-person-lines-fill me-2"></i> <span className="link-text">Team Sessions</span>
                    </NavLink>
                    <NavLink to="/manager/team-attendance" className="mb-2" onClick={handleMobileClose}>
                      <i className="bi bi-calendar2-week me-2"></i> <span className="link-text">Team Attendance</span>
                    </NavLink>
                    <NavLink to="/manager/team-leave" className="mb-2" onClick={handleMobileClose}>
                      <i className="bi bi-card-text me-2"></i> <span className="link-text">Team Leaves</span>
                    </NavLink>
                  </>
                )}
              </>
            )}

            {/* --- COMMON --- */}
             <NavLink to="/employee/my-profile" className="mb-2 mt-2" onClick={handleMobileClose}>
                <i className="bi bi-person-circle me-2"></i>
                <span className="link-text">My Profile</span>
             </NavLink>
          </Nav>
        </div>

        {/* ================= FOOTER ================= */}
        <div>
          <button
            className="btn btn-link text-white text-start w-100 d-flex align-items-center"
            onClick={handleLogout}
            style={{ textDecoration: "none" }}
          >
            <i className="bi bi-box-arrow-right me-2"></i> 
            <span className="link-text">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;