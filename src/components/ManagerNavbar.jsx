import React from "react";
import { Navbar, Container, Dropdown } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const ManagerNavbar = ({ toggleSidebar, username = "Manager", role = "Manager" }) => {
  return (
    <Navbar
      expand="lg"
      className="shadow-sm px-3"
      style={{ backgroundColor: "#055993" }}
    >
      <Container fluid>
        <button
          className="btn btn-link text-white me-2"
          onClick={toggleSidebar}
          style={{ fontSize: "1.5rem" }}
        >
          <i className="bi bi-list"></i>
        </button>

        <Navbar.Brand className="text-white fw-bold">
          <i className="bi bi-person-workspace me-2"></i>
          Manager Portal
        </Navbar.Brand>

        <div className="ms-auto d-flex align-items-center gap-3">
          {/* Notifications */}
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="link"
              className="text-white position-relative p-0"
              style={{ fontSize: "1.3rem" }}
            >
              <i className="bi bi-bell"></i>
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: "0.6rem" }}
              >
                3
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Header>Notifications</Dropdown.Header>
              <Dropdown.Item>New leave request</Dropdown.Item>
              <Dropdown.Item>Team member clocked in</Dropdown.Item>
              <Dropdown.Item>Attendance report ready</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Profile */}
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="link"
              className="text-white d-flex align-items-center gap-2 p-0"
            >
              <div
                className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, fontWeight: "bold" }}
              >
                {username?.charAt(0)?.toUpperCase() || "M"}
              </div>
              <div className="text-start d-none d-md-block">
                <div style={{ fontSize: "0.9rem", lineHeight: 1.2 }}>{username}</div>
                <small style={{ opacity: 0.8 }}>{role}</small>
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item href="/manager/profile">
                <i className="bi bi-person me-2"></i>Profile
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item href="/login">
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Container>
    </Navbar>
  );
};

export default ManagerNavbar;