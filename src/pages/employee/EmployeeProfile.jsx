import React, { useEffect, useState } from "react";
import { Spinner, Row, Col, Badge, Card, Container } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import PageHeading from "../../components/PageHeading";
import { getMyDetails } from "../../api/employeeApi";
import jwtHelper from "../../utils/jwtHelper";
import { Envelope, Telephone, GenderAmbiguous, CalendarCheck, Briefcase, Building, Clock } from "react-bootstrap-icons";
import CardContainer from "../../components/CardContainer"
const EmployeeProfile = ({ onLogout }) => {
  const token = localStorage.getItem("token");
  const role = jwtHelper.getRoleFromToken(token);
  const userName = localStorage.getItem("name");

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric"
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyDetails();
        setEmployee(res.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const InfoItem = ({ icon, label, value }) => (
    <div className="d-flex align-items-center mb-3 p-3 bg-light rounded shadow-sm h-100">
      <div className="bg-white p-2 rounded-circle text-primary shadow-sm me-3 fs-4 d-flex align-items-center justify-content-center" style={{width: "50px", height: "50px"}}>
        {icon}
      </div>
      <div>
        <div className="text-muted text-uppercase fw-bold" style={{fontSize: "0.7rem"}}>{label}</div>
        <div className="fw-semibold text-dark text-break">{value || "--"}</div>
      </div>
    </div>
  );

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar} />
      
      <div className="flex-grow-1">
        <TopNavbar 
            toggleSidebar={toggleSidebar}
            username={localStorage.getItem("name")}
            role={localStorage.getItem("role")}
        />
        <div className="p-3 container-fluid">
          <PageHeading title="My Profile" />

          {loading ? (
            <div className="d-flex justify-content-center align-items-center vh-50">
               <Spinner animation="border" variant="warning" />
            </div>
          ) : employee ? (
            <CardContainer>
              <Row className="justify-content-center">
                
                {/* Left Card: Avatar & Main Info */}
                <Col lg={3} md={4}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="text-center p-5">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                        style={{ width: "120px", height: "120px", backgroundColor: "#f58a29", color: "white", fontSize: "3rem", fontWeight: "bold" }}
                      >
                        {employee.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <h4 className="fw-bold mb-1">{employee.fullName}</h4>
                      <p className="text-muted mb-3">{employee.designation}</p>
                      
                      <div className="d-flex justify-content-center gap-2">
                         <Badge bg="info" className="px-3 py-2 fw-normal">{employee.role}</Badge>
                         <Badge bg={employee.active ? "success" : "danger"} className="px-3 py-2 fw-normal">
                            {employee.active ? "Active" : "Inactive"}
                         </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Right Card: Detailed Info */}
                <Col lg={8} md={7}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-white py-3 border-0">
                      <h5 className="mb-0 fw-bold text-primary">Personal & Work Details</h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Row>
                        <Col md={6}>
                          <InfoItem icon={<Envelope />} label="Email Address" value={employee.email} />
                        </Col>
                        <Col md={6}>
                          <InfoItem icon={<Telephone />} label="Phone Number" value={employee.phone} />
                        </Col>
                        <Col md={6}>
                          <InfoItem icon={<Building />} label="Department" value={employee.department} />
                        </Col>
                        <Col md={6}>
                          <InfoItem icon={<Clock />} label="Assigned Shift" value={employee.assignedShift} />
                        </Col>
                        <Col md={6}>
                          <InfoItem icon={<CalendarCheck />} label="Joining Date" value={formatDate(employee.joiningDate)} />
                        </Col>
                        <Col md={6}>
                          <InfoItem icon={<GenderAmbiguous />} label="Gender" value={employee.gender} />
                        </Col>
                       
                        {employee.username && (
                            <Col md={6}>
                              <InfoItem icon={<Briefcase />} label="System Username" value={employee.username} />
                            </Col>
                        )}
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>

              </Row>
            </CardContainer>
          ) : (
            <div className="text-center p-5 text-muted">Failed to load profile details.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;