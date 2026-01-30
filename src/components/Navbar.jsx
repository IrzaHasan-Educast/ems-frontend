import React from "react";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PersonCircle, BoxArrowRight, List } from "react-bootstrap-icons";

const TopNavbar = ({ toggleSidebar, username, role, onLogout }) => {
  const navigate = useNavigate();
  const displayName = username || "User";
  const displayRole = role || "";
  
  const getInitials = (name) => {
    return name
      ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "U";
  };

  const handleLogoutClick = (e) => {
    // Prevent any default link behavior
    e.preventDefault(); 
    
    // 1. Clear Storage
    localStorage.clear();
    sessionStorage.clear();

    // 2. Execute parent callback if exists
    if (onLogout) {
        onLogout();
    }

    // 3. Force Navigate to Login
    // setTimeout ensure karta hai ki state update hone ke baad redirect ho
    setTimeout(() => {
        navigate("/login", { replace: true });
    }, 100);
  };

  return (
    <Navbar
      expand={false} // ✅ Changed to 'false' to prevent default collapse behavior
      className="shadow-sm top-navbar px-2 px-md-3"
      sticky="top"
      style={{ backgroundColor: "#fff", height: "70px" }}
    >
      {/* ✅ 'flex-nowrap' ensures Logo and Profile stay in one line */}
      <Container fluid className="d-flex flex-nowrap align-items-center">
        
        {/* --- LEFT: Toggle + Brand --- */}
        <div className="d-flex align-items-center">
          <button
            className="btn-toggle me-2 border-0 bg-transparent"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
            style={{ color: "#333", padding: 0 }}
          >
            <List size={28} />
          </button>
          
          {/* ✅ 'whiteSpace: nowrap' prevents text from breaking */}
          <div style={{ fontWeight: "bold", fontSize: "1.4rem", whiteSpace: "nowrap" }} className="ms-2">
            <span style={{ color: "#f58a29" }}>Edu</span>
            <span style={{ color: "#055993" }}>Cast</span>
          </div>
        </div>

        {/* --- RIGHT: User Profile --- */}
        {/* ✅ 'd-flex flex-row' forces horizontal layout even on mobile */}
        <Nav className="ms-auto d-flex flex-row align-items-center">
          <NavDropdown
            align="end"
            title={
              <div className="d-flex align-items-center">
                <div className="d-none d-md-block text-end me-2">
                   <div className="fw-semibold text-dark" style={{lineHeight: "1.2"}}>{displayName}</div>
                   <small className="text-muted" style={{fontSize: "0.75rem"}}>{displayRole}</small>
                </div>
                
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                  style={{
                    width: "38px",
                    height: "38px",
                    minWidth: "38px", // Prevents shrinking
                    backgroundColor: "#f58a29",
                    border: "2px solid #fff"
                  }}
                >
                  {getInitials(displayName)}
                </div>
              </div>
            }
            id="user-nav-dropdown"
            className="nav-profile-dropdown p-0" // Removed padding to save space
            style={{ position: "static" }} // Helps with dropdown positioning
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