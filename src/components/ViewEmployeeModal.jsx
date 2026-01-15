import React from "react";
import { Modal, Button, Row, Col, Badge } from "react-bootstrap";

const ViewEmployeeModal = ({ show, handleClose, employee }) => {
  if (!employee) return null;

  const DetailItem = ({ label, value }) => (
    <div className="mb-3">
      <div className="text-muted text-uppercase fw-bold" style={{ fontSize: "0.7rem" }}>{label}</div>
      <div className="fw-semibold text-dark text-break">{value || "--"}</div>
    </div>
  );

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton className="bg-light py-2">
        <Modal.Title className="fw-bold text-primary fs-5">
          <i className="bi bi-person-lines-fill me-2"></i>Employee Profile
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Row>
          {/* Identity Section */}
          <Col md={4} className="text-center border-end mb-3 mb-md-0">
             <div 
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm"
              style={{ width: "90px", height: "90px", backgroundColor: "#f58a29", color: "white", fontSize: "2rem", fontWeight: "bold" }}
            >
              {employee.fullName?.charAt(0).toUpperCase()}
            </div>
            <h5 className="fw-bold mb-1">{employee.fullName}</h5>
            <div className="text-muted small mb-2">{employee.designation}</div>
            <div className="mb-2">
               <Badge bg="info" className="me-1">{employee.role}</Badge>
               <Badge bg={employee.active ? "success" : "danger"}>{employee.active ? "Active" : "Inactive"}</Badge>
            </div>
          </Col>

          {/* Full Details Grid */}
          <Col md={8} className="ps-md-4">
             <h6 className="text-primary border-bottom pb-2 mb-3" style={{fontSize: "0.9rem"}}>Employee Information</h6>
             <Row>
               <Col sm={6}><DetailItem label="Email" value={employee.email} /></Col>
               <Col sm={6}><DetailItem label="Phone" value={employee.phone} /></Col>
               <Col sm={6}><DetailItem label="Gender" value={employee.gender} /></Col>
               <Col sm={6}><DetailItem label="Department" value={employee.department} /></Col>
               <Col sm={6}><DetailItem label="Assigned Shift" value={employee.assignedShift} /></Col>
               <Col sm={6}><DetailItem label="Joining Date" value={employee.joiningDate} /></Col>
             </Row>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer className="bg-light border-0 py-2">
        <Button variant="secondary" size="sm" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewEmployeeModal;