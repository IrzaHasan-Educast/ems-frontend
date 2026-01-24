import React, { useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import TopNavbar from "../../../components/Navbar";
import CardContainer from "../../../components/CardContainer";
import AppButton from "../../../components/AppButton";
import { getShiftById, updateShift } from "../../../api/shiftApi";
import { getManagers } from "../../../api/employeeApi";

const EditShift = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [shift, setShift] = useState({
    shiftName: "",
    startsAt: "",
    endsAt: "",
    managerId: "", // ✅ manager selected
  });

  const [managers, setManagers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch shift details
useEffect(() => {
  const fetchShift = async () => {
    const res = await getShiftById(id);
    setShift({
      shiftName: res.data.shiftName,
      startsAt: res.data.startsAt,
      endsAt: res.data.endsAt,
      managerId: res.data.managerId || "", // ✅ assign pehle se
    });
  };
  fetchShift();
}, [id]);


  // Fetch managers for dropdown
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await getManagers(); // GET /employees/role/MANAGER
        setManagers(res.data);
      } catch (err) {
        console.error("Failed to fetch managers", err);
      }
    };
    fetchManagers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShift((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateShift(id, shift);
      navigate("/admin/shifts");
    } catch (err) {
      console.error("Update failed:", err);
      alert(err.response?.data || "Update failed");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar}/>
      <div className="flex-grow-1">
        <TopNavbar
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role")}
        />

        <div className="p-4 d-flex justify-content-center">
          <div className="w-50">
            <CardContainer title="Edit Shift">
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Shift Name</Form.Label>
                    <Form.Control
                      name="shiftName"
                      value={shift.shiftName}
                      onChange={handleChange}
                      required
                    />
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Label>Starts At</Form.Label>
                    <Form.Control
                      type="time"
                      name="startsAt"
                      value={shift.startsAt}
                      onChange={handleChange}
                      required
                    />
                  </Col>

                  <Col md={6}>
                    <Form.Label>Ends At</Form.Label>
                    <Form.Control
                      type="time"
                      name="endsAt"
                      value={shift.endsAt}
                      onChange={handleChange}
                      required
                    />
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col>
                    <Form.Group>
                      <Form.Label>Assign Manager</Form.Label>
                      <Form.Select
                        name="managerId"
                        value={shift.managerId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Manager</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.fullName}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex gap-2">
                  <AppButton text="Update Shift" type="submit" />
                  <AppButton
                    text="Cancel"
                    variant="secondary"
                    onClick={() => navigate("/admin/shifts")}
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

export default EditShift;
