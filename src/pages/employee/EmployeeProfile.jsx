// EmployeeProfile.jsx
import React, { useEffect, useState } from "react";
import { Spinner, Row, Col, Badge } from "react-bootstrap";
import PageHeading from "../../components/PageHeading";
import { getMyDetails } from "../../api/employeeApi";
import { Envelope, Telephone, GenderAmbiguous, CalendarCheck, Building, Clock } from "react-bootstrap-icons";
import CardContainer from "../../components/CardContainer";

const EmployeeProfile = () => {
  // Sidebar wala code hata diya - ab Layout handle karega
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
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
    <div className="d-flex align-items-center mb-3 p-3 border rounded bg-light h-100">
      <div className="me-3 text-primary fs-4">{icon}</div>
      <div>
        <div className="text-muted text-uppercase fw-bold" style={{fontSize: "0.7rem", letterSpacing: "0.5px"}}>{label}</div>
        <div className="fw-semibold text-dark text-break">{value || "--"}</div>
      </div>
    </div>
  );

  // Direct return - no wrapper divs for sidebar/navbar
  return (
    <>
      <PageHeading title="My Profile" />

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
           <Spinner animation="border" variant="warning" />
        </div>
      ) : employee ? (
        <CardContainer>
          {/* Aapka existing content as-is */}
          <Row>
            <Col lg={4} md={5} className="text-center border-end mb-4 mb-md-0 d-flex flex-column align-items-center justify-content-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-3"
                  style={{ width: "130px", height: "130px", backgroundColor: "#f58a29", color: "white", fontSize: "3.5rem", fontWeight: "bold" }}
                >
                  {employee.fullName?.charAt(0).toUpperCase()}
                </div>
                
                <h4 className="fw-bold mb-1 text-dark">{employee.fullName}</h4>
                <p className="text-muted mb-3">{employee.designation}</p>
                
                <div className="d-flex gap-2">
                   <Badge bg="info" text="dark" className="px-3 py-2 fw-normal">{employee.role}</Badge>
                   <Badge bg={employee.active ? "success" : "danger"} className="px-3 py-2 fw-normal">
                      {employee.active ? "Active Employee" : "Inactive"}
                   </Badge>
                </div>
            </Col>

            <Col lg={8} md={7} className="ps-md-4">
              <h5 className="fw-bold text-primary mb-3 border-bottom pb-2">Personal & Work Information</h5>
              
              <Row className="g-2">
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
              </Row>
            </Col>
          </Row>
        </CardContainer>
      ) : (
        <div className="text-center p-5 text-muted">
            <i className="bi bi-exclamation-circle fs-1 text-secondary"></i>
            <p className="mt-2">Failed to load profile details.</p>
        </div>
      )}
    </>
  );
};

export default EmployeeProfile;