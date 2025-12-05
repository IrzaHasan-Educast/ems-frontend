import React, { useState, useEffect } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import CardContainer from "../../components/CardContainer";
import AppButton from "../../components/AppButton";
import { getCurrentUser } from "../../api/workSessionApi"; 
import { applyLeave, getLeaveTypes } from "../../api/leaveApi";

const ApplyLeave = ({ onLogout }) => {
  const [leave, setLeave] = useState({
    leaveType: "",
    startDate: "",
    endDate: null,
    duration: 0,
    description: "",
    prescription: null,
  });

  const [employee, setEmployee] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showPrescription, setShowPrescription] = useState(false);

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await getCurrentUser();
        setEmployee({ fullName: userRes.data.fullName, role: userRes.data.role, id: userRes.data.employeeId });

        const typesRes = await getLeaveTypes();
        setLeaveTypes(typesRes.data);
      } catch (err) {
        console.error("Failed:", err);
      }
    };
    fetchData();
  }, []);

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const diffTime = new Date(end) - new Date(start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // include start & end day
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    let updated = { ...leave };

    if (name === "leaveType") {
      setShowPrescription(value === "SICK");
    }

    if (name === "startDate") {
      if (leave.endDate && leave.endDate < value) {
        updated.endDate = null; // safe
      }
    }

    updated[name] = name === "prescription" ? files[0] : value;

    // Auto-calculate duration
    if (updated.startDate && updated.endDate) {
      updated.duration = calculateDuration(updated.startDate, updated.endDate);
    }

    setLeave(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!leave.leaveType || !leave.startDate || !leave.endDate) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("employeeId", employee.id);  
      formData.append("leaveType", leave.leaveType);
      formData.append("startDate", leave.startDate);
      formData.append("endDate", leave.endDate);
      formData.append("duration", leave.duration);
      formData.append("description", leave.description);
      if (leave.prescription) formData.append("prescription", leave.prescription);

      await applyLeave(formData);
      navigate("/leave-history");
    } catch (error) {
      console.error(error);
      alert(error.response?.data || "Failed to apply leave");
    }
  };

  if (!employee) return <div>Loading...</div>;

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar
          toggleSidebar={toggleSidebar}
          username={employee.fullName}
          role={employee.role}
        />

        <div className="p-4 d-flex justify-content-center">
          <div className="w-75">
            <CardContainer title="Apply for Leave">
              <Form onSubmit={handleSubmit}>

                {/* Leave Type */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Leave Type</Form.Label>
                      <Form.Select
                        name="leaveType"
                        value={leave.leaveType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select leave type</option>
                        {leaveTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.replaceAll("_", " ")}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Duration (Read-only) */}
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Duration (days)</Form.Label>
                      <Form.Control
                        type="number"
                        value={leave.duration}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Dates */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="startDate"
                        value={leave.startDate}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="endDate"
                        value={leave.endDate || ""}
                        onChange={handleChange}
                        required
                        min={leave.startDate}   // disable past dates
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Reason */}
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Reason</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={leave.description}
                        onChange={handleChange}
                        required
                        placeholder="Write a reason for leave"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Prescription */}
                {showPrescription && (
                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Prescription (optional)</Form.Label>
                        <Form.Control
                          type="file"
                          name="prescription"
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {/* Buttons */}
                <div className="d-flex gap-2 mt-3">
                  <AppButton text="Submit Leave" variant="primary" type="submit" />
                  <AppButton
                    text="Cancel"
                    variant="secondary"
                    onClick={() => navigate("/leave-history")}
                  />
                </div>

              </Form>
            </CardContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ApplyLeave;
