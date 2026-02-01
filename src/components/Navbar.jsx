import React from "react";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PersonCircle, BoxArrowRight, List } from "react-bootstrap-icons";

const TopNavbar = ({ toggleSidebar, username, role, onLogout }) => {
  const navigate = useNavigate();
  const displayName = username || "User";
  const displayRole = role || "";
  
  // Create Initials for Avatar
  const getInitials = (name) => {
    return name
      ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "U";
  };

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    else {
        localStorage.clear();
        navigate("/login");
    }
  };

  return (
    <Navbar
      expand="lg"
      className="shadow-sm top-navbar px-3"
      sticky="top"
    >
      <Container fluid>
        {/* Toggle Button + Brand (Brand hidden on desktop as Sidebar has it) */}
        <div className="d-flex align-items-center">
          <button
            className="btn-toggle me-3"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <List size={24} />
          </button>
          <div style={{ fontWeight: "bold", fontSize: "1.5rem" }}>
            <span style={{ color: "#f58a29" }}>Edu</span>
            <span style={{ color: "#055993" }}>Cast</span>
          </div>
          
          {/* Mobile Only Brand Name (Optional)
          <div className="d-lg-none fw-bold fs-4">
            <span style={{ color: "#f58a29" }}>Edu</span>
            <span style={{ color: "#055993" }}>Cast</span>
          </div> */}
        </div>

        {/* Right Side - User Profile Dropdown */}
        <Nav className="ms-auto">
          <NavDropdown
            align="end"
            flip={false}
            popperConfig={{
              strategy: "fixed",
              modifiers: [
                {
                  name: "preventOverflow",
                  options: {
                    boundary: "window"
                  }
                }
              ]
            }}
            title={
              <div className="d-flex align-items-center">
                <div className="d-none d-md-block text-end me-2">
                   <div className="fw-semibold text-dark" style={{lineHeight: "1.2"}}>{displayName}</div>
                   <small className="text-muted" style={{fontSize: "0.75rem"}}>{displayRole}</small>
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#f58a29",
                    border: "2px solid #fff"
                  }}
                >
                  {getInitials(displayName)}
                </div>
              </div>
            }
            id="user-nav-dropdown"
            className="nav-profile-dropdown"
          >
            <NavDropdown.Header className="d-md-none text-center">
               <strong>{displayName}</strong><br/>
               <small>{displayRole}</small>
            </NavDropdown.Header>
            <NavDropdown.Divider className="d-md-none" />

            <NavDropdown.Item as={Link} to="/employee/my-profile">
              <PersonCircle className="me-2 text-primary" /> My Profile
            </NavDropdown.Item>
            
            <NavDropdown.Divider />
            
            <NavDropdown.Item onClick={handleLogoutClick} className="text-danger">
              <BoxArrowRight className="me-2" /> Logout
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default TopNavbar;