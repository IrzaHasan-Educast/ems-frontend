import React, { useState, useEffect } from "react";
import { Form, Row, Col } from "react-bootstrap";
import Sidebar from "../../../components/Sidebar";
import TopNavbar from "../../../components/Navbar";
import CardContainer from "../../../components/CardContainer";
import AppButton from "../../../components/AppButton";
import PageHeading from "../../../components/PageHeading"; // Added for consistency
import { addShift } from "../../../api/shiftApi";
import { useNavigate } from "react-router-dom";
import { getManagers } from "../../../api/employeeApi";

const AddShift = ({ onLogout }) => {
  const [shift, setShift] = useState({
    shiftName: "",
    startsAt: "",
    endsAt: "",
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [managers, setManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setShift((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch managers from backend
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await getManagers(); // GET /employees/role/MANAGER
        setManagers(res.data);
      } catch (err) {
        console.error("Failed to fetch managers", err);
        alert("Failed to load managers");
      }
    };
    fetchManagers();
  }, []);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...shift, managerId: selectedManagerId };

    try {
      await addShift(payload);
      navigate("/admin/shifts"); // redirect after success
    } catch (err) {
      console.error("Failed to add shift:", err);
      alert(err.response?.data || "Error adding shift");
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", overflow: "hidden" }}>
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar} />
      
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <TopNavbar
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role")}
        />

        <div className="p-3 container-fluid overflow-auto">
          <div className="d-flex justify-content-center">
            {/* Responsive Container: Full width on mobile, centered on desktop */}
            <Col xs={12} md={8} lg={6}>
              <CardContainer title="Shift Details">
                <Form onSubmit={handleSubmit}>
                  <Row className="mb-3">
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-bold">Shift Name</Form.Label>
                        <Form.Control
                          name="shiftName"
                          value={shift.shiftName}
                          onChange={handleChange}
                          placeholder="e.g. Morning Shift"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6} xs={12} className="mb-3 mb-md-0">
                      <Form.Group>
                        <Form.Label className="fw-bold">Starts At</Form.Label>
                        <Form.Control
                          type="time"
                          name="startsAt"
                          value={shift.startsAt}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} xs={12}>
                      <Form.Group>
                        <Form.Label className="fw-bold">Ends At</Form.Label>
                        <Form.Control
                          type="time"
                          name="endsAt"
                          value={shift.endsAt}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-4">
                    <Col>
                      <Form.Group>
                        <Form.Label className="fw-bold">Assign Manager</Form.Label>
                        <Form.Select
                          value={selectedManagerId}
                          onChange={(e) => setSelectedManagerId(e.target.value)}
                          required
                        >
                          <option value="">-- Select Manager --</option>
                          {managers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.fullName}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2 justify-content-end">
                    <AppButton
                      text="Cancel"
                      variant="secondary"
                      onClick={() => navigate("/admin/shifts")}
                    />
                    <AppButton text="Save Shift" type="submit" />
                  </div>
                </Form>
              </CardContainer>
            </Col>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddShift;