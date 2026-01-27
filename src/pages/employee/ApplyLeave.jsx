import React, { useState, useEffect } from "react";
import { Form, Row, Col, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // Ensure you have sweetalert2 installed

import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar"; // Using Unified Navbar
import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading"; // Added PageHeading
import AppButton from "../../components/AppButton"; // Assuming this is your custom button

import { getCurrentUser } from "../../api/workSessionApi"; 
import { applyLeave, getLeaveTypes, uploadPrescription } from "../../api/leaveApi";
import jwtHelper from "../../utils/jwtHelper";

const ApplyLeave = ({ onLogout }) => {
  // Token & User
  const token = localStorage.getItem("token");
  const role = jwtHelper.getRoleFromToken(token);

  // Form State
  const [leave, setLeave] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    duration: 0,
    description: "",
    prescription: null,
  });

  // UI States
  const [employee, setEmployee] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPrescription, setShowPrescription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // For button loading

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- INIT ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userRes = await getCurrentUser();
        setEmployee({ fullName: userRes.data.fullName, id: userRes.data.employeeId });

        const typesRes = await getLeaveTypes();
        setLeaveTypes(typesRes.data);
      } catch (err) {
        console.error("Failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- CALCULATE DURATION ---
  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const diffTime = new Date(end) - new Date(start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let updated = { ...leave };

    if (name === "leaveType") {
      updated.leaveType = value;
      setShowPrescription(value === "SICK");
    }

    if (name === "startDate") {
      updated.startDate = value;
      if (leave.endDate && new Date(leave.endDate) < new Date(value)) {
        updated.endDate = ""; // Reset end date if invalid
      }
    }

    if (name === "endDate") {
      updated.endDate = value;
    }

    if (name === "prescription") {
      updated.prescription = files[0];
    } else if (name !== "leaveType" && name !== "startDate" && name !== "endDate") {
      updated[name] = value;
    }

    // Auto-calculate duration
    if (updated.startDate && updated.endDate) {
      updated.duration = calculateDuration(updated.startDate, updated.endDate);
    } else {
      updated.duration = 0;
    }

    setLeave(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!leave.leaveType || !leave.startDate || !leave.endDate) {
      Swal.fire("Incomplete Form", "Please fill all required fields.", "warning");
      return;
    }

    if (leave.duration <= 0) {
      Swal.fire("Invalid Dates", "End Date cannot be before Start Date.", "error");
      return;
    }

    setSubmitting(true);

    try {
      let prescriptionUrl = null;

      // Upload Prescription if needed
      if (leave.leaveType === "SICK" && leave.prescription) {
        const f = new FormData();
        f.append("file", leave.prescription);
        const uploadRes = await uploadPrescription(f);
        prescriptionUrl = uploadRes.data; 
      }

      const leavePayload = {
        employeeId: employee.id,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        duration: leave.duration,
        description: leave.description,
        prescriptionImg: prescriptionUrl, 
      };

      await applyLeave(leavePayload);

      // Success Alert
      await Swal.fire({
        title: "Success!",
        text: "Your leave application has been submitted successfully.",
        icon: "success",
        confirmButtonColor: "#f58a29",
      });

      navigate("/employee/leave-history");

    } catch (error) {
      console.error(error);
      Swal.fire("Error", error.response?.data || "Failed to apply leave.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="warning" />
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar} />
      <div className="flex-grow-1">
        <TopNavbar
          toggleSidebar={toggleSidebar}
          username={employee?.fullName}
          role={role}
          onLogout={onLogout}
        />

        <div className="p-4 container-fluid">
          <PageHeading title="Apply for Leave" />

          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10">
              <CardContainer title="New Leave Request">
                <Form onSubmit={handleSubmit}>

                  {/* Leave Type */}
                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Leave Type <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          name="leaveType"
                          value={leave.leaveType}
                          onChange={handleChange}
                          required
                          className="py-2"
                        >
                          <option value="">-- Select Leave Type --</option>
                          {leaveTypes.map((type) => (
                            <option key={type} value={type}>
                              {type.replaceAll("_", " ")}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Dates */}
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Start Date <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="date"
                          name="startDate"
                          value={leave.startDate}
                          onChange={handleChange}
                          required
                          min={new Date().toISOString().split("T")[0]} // Prevent past dates
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">End Date <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="date"
                          name="endDate"
                          value={leave.endDate || ""}
                          onChange={handleChange}
                          required
                          min={leave.startDate} 
                          disabled={!leave.startDate}
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Duration Display */}
                  {leave.duration > 0 && (
                    <Row className="mb-3">
                      <Col>
                         <div className="alert alert-info py-2 px-3 small">
                            <i className="bi bi-calendar-range me-2"></i>
                            Total Duration: <strong>{leave.duration} Day{leave.duration > 1 ? "s" : ""}</strong>
                         </div>
                      </Col>
                    </Row>
                  )}

                  {/* Reason */}
                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Reason / Description <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          name="description"
                          value={leave.description}
                          onChange={handleChange}
                          required
                          placeholder="Please describe why you need this leave..."
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Prescription Upload */}
                  {showPrescription && (
                    <Row className="mb-4">
                      <Col md={12}>
                        <div className="p-3 border rounded bg-light">
                          <Form.Group>
                            <Form.Label className="fw-semibold text-danger">
                            </Form.Label>
                            <Form.Control
                              type="file"
                              name="prescription"
                              onChange={handleChange}
                              accept="image/*,application/pdf"
                            />
                            <Form.Text className="text-muted">
                               Allowed formats: JPG, PNG, PDF (Max 2MB)
                            </Form.Text>
                          </Form.Group>
                        </div>
                      </Col>
                    </Row>
                  )}

                  {/* Buttons */}
                  <div className="d-flex justify-content-end gap-3 mt-4 border-top pt-3">
                    <AppButton
                      text="Cancel"
                      variant="light"
                      className="border"
                      onClick={() => navigate("/employee/leave-history")}
                      disabled={submitting}
                    />
                    <AppButton 
                      text={submitting ? "Submitting..." : "Submit Application"} 
                      variant="primary" 
                      type="submit" 
                      disabled={submitting}
                      className="px-4"
                    />
                  </div>

                </Form>
              </CardContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;