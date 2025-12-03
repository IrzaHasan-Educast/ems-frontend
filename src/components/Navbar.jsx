import React from "react";
import { Navbar, Nav } from "react-bootstrap";

const TopNavbar = ({ toggleSidebar, username, role }) => {
  const displayName = username || "User";
  const displayRole = role || "";

  return (
    <Navbar
      expand="lg"
      className="shadow-sm px-4"
      style={{
        backgroundColor: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Toggle Button + Company Name */}
      <div className="d-flex align-items-center">
        <button
          className="btn btn-outline-warning me-3"
          onClick={toggleSidebar}
        >
          <i className="bi bi-list"></i>
        </button>
        <div style={{ fontWeight: "bold", fontSize: "1.5rem" }}>
          <span style={{ color: "#f58a29" }}>Edu</span>
          <span style={{ color: "#055993" }}>Cast</span>
        </div>
      </div>

      <Navbar.Collapse className="justify-content-end">
        <Nav>
          <div className="text-end">
            <h6 className="mb-0 fw-semibold text-dark">{displayName}</h6>
            <small className="text-muted">{displayRole}</small>
          </div>
          <div
            className="profile-icon d-flex align-items-center justify-content-center rounded-circle text-white fw-bold me-2 mx-2"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#f69b49",
            }}
          >
            {displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default TopNavbar;
