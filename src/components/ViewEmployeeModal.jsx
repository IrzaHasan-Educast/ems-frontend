// src/components/ViewEmployeeModal.jsx
import React from "react";
import { Modal, Button, Row, Col, Badge } from "react-bootstrap";

const ViewEmployeeModal = ({ show, handleClose, employee }) => {
  if (!employee) return null;

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header
        closeButton
        style={{
          backgroundColor: "#FFA50033",
          borderBottom: "2px solid #FFA500",
          borderRadius: "25px 25px 0 0",
        }}
      >
        <Modal.Title
          style={{
            color: "#055993",
            fontWeight: "bold",
            textAlign: "center",
            width: "100%",
          }}
        >
          Employee Details
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{
          border: "2px solid #FFA500",
          borderRadius: "0 0 25px 25px",
          padding: "20px",
          boxShadow: "15px 22px 23px -14px #ffa50026",
        }}
      >
        <Row className="mb-2">
          <Col sm={4}><strong>Full Name:</strong></Col>
          <Col sm={8}>{employee.fullName}</Col>
        </Row>
        <Row className="mb-2">
          <Col sm={4}><strong>Email:</strong></Col>
          <Col sm={8}>{employee.email}</Col>
        </Row>
        <Row className="mb-2">
          <Col sm={4}><strong>Phone:</strong></Col>
          <Col sm={8}>{employee.phone || "-"}</Col>
        </Row>
        <Row className="mb-2">
          <Col sm={4}><strong>Gender:</strong></Col>
          <Col sm={8}>{employee.gender || "-"}</Col>
        </Row>
        <Row className="mb-2">
          <Col sm={4}><strong>Department:</strong></Col>
          <Col sm={8}>{employee.department || "-"}</Col>
        </Row>
        <Row className="mb-2">
          <Col sm={4}><strong>Role:</strong></Col>
          <Col sm={8}>{employee.role || "-"}</Col>
        </Row>
        <Row className="mb-2">
          <Col sm={4}><strong>Designation:</strong></Col>
          <Col sm={8}>{employee.designation || "-"}</Col>
        </Row>
        <Row className="mb-2">
          <Col sm={4}><strong>Joining Date:</strong></Col>
          <Col sm={8}>{employee.joiningDate}</Col>
        </Row>
        <Row className="mb-2">
          <Col sm={4}><strong>Status:</strong></Col>
          <Col sm={8}>
            <Badge bg={employee.active ? "success" : "danger"}>
              {employee.active ? "Active" : "Inactive"}
            </Badge>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewEmployeeModal;
