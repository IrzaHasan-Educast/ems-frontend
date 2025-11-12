// src/components/Navbar.jsx
import React from "react";
import { Navbar, Nav } from "react-bootstrap";

const TopNavbar = ({ toggleSidebar }) => {
  return (
    <Navbar
      expand="lg"
      className="shadow-sm px-4"
      style={{ backgroundColor: "#ffffff" }}
    >
      <button
        className="btn btn-outline-warning me-3"
        onClick={toggleSidebar}
      >
        <i className="bi bi-list"></i>
      </button>

      <Navbar.Collapse className="justify-content-end">
        <Nav>
          <div className="text-end">
            <h6 className="mb-0 fw-semibold text-dark">Irza Hasan</h6>
            <small className="text-muted">Admin</small>
          </div>
          <div
                className="profile-icon d-flex align-items-center justify-content-center rounded-circle text-white fw-bold me-2 mx-2"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#f69b49",
                }}
              >
                IH
              </div>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default TopNavbar;
