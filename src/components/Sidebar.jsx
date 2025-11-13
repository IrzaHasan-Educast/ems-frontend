import React, { useState } from "react";
import { Nav } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/Educast-Logo.png";

const Sidebar = ({ isOpen, onLogout }) => {
  const [showEmployees, setShowEmployees] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    onLogout(); // 🔁 update App.js state
    navigate("/login");
  };

  return (
    <div
      className={`sidebar d-flex flex-column justify-content-between p-3 ${
        isOpen ? "sidebar-open" : "sidebar-closed"
      }`}
      style={{ backgroundColor: "#f58a29", color: "white", height: "100vh" }}
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
          <Nav.Link href="#" className="text-white">
            <i className="bi bi-speedometer2 me-2"></i> {isOpen && "Dashboard"}
          </Nav.Link>

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
                <Nav.Link href="#" className="text-white">
                  <i className="bi bi-person-lines-fill me-2"></i> All Employees
                </Nav.Link>
                <Nav.Link href="#" className="text-white">
                  <i className="bi bi-camera me-2"></i> Screenshots
                </Nav.Link>
                <Nav.Link href="#" className="text-white">
                  <i className="bi bi-person-plus me-2"></i> Add Employee
                </Nav.Link>
              </div>
            )}
          </div>

          <Nav.Link href="#" className="text-white mt-3">
            <i className="bi bi-calendar-check me-2"></i> {isOpen && "Attendance"}
          </Nav.Link>

          <Nav.Link href="#" className="text-white mt-3">
            <i className="bi bi-calendar2-event me-2"></i>{" "}
            {isOpen && "Leave Management"}
          </Nav.Link>

          <Nav.Link href="#" className="text-white mt-3">
            <i className="bi bi-gear me-2"></i> {isOpen && "Settings"}
          </Nav.Link>
        </Nav>
      </div>

      {/* ✅ Logout Button */}
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

export default Sidebar;
