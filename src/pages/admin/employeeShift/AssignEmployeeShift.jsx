import React, { useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import TopNavbar from "../../../components/Navbar";
import CardContainer from "../../../components/CardContainer";
import AppButton from "../../../components/AppButton";
import { getAllEmployees } from "../../../api/employeeApi";
import { getAllShifts } from "../../../api/shiftApi";
import { assignShift } from "../../../api/employeeShiftApi";

const AssignEmployeeShift = ({ onLogout }) => {
  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);


  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [form, setForm] = useState({
    employeeId: "",
    shiftId: "",
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const empRes = await getAllEmployees();
      const shiftRes = await getAllShifts();
      setEmployees(empRes.data);
      setShifts(shiftRes.data);
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await assignShift(form);
      navigate("/admin/employee-shifts");
    } catch (err) {
      alert(err.response?.data || "Assignment failed");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar} />
      <div className="flex-grow-1">
        <TopNavbar
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role")}
          onLogout={onLogout}
        />

        <div className="p-4 d-flex justify-content-center">
          <div className="w-50">
            <CardContainer title="Assign Shift to Employee">
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col>
                    <Form.Label>Employee</Form.Label>
                    <Form.Select
                      name="employeeId"
                      value={form.employeeId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col>
                    <Form.Label>Shift</Form.Label>
                    <Form.Select
                      name="shiftId"
                      value={form.shiftId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Shift</option>
                      {shifts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.shiftName} ({s.startsAt} - {s.endsAt})
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>

                <div className="d-flex gap-2">
                  <AppButton text="Assign Shift" type="submit" />
                  <AppButton
                    text="Cancel"
                    variant="secondary"
                    onClick={() => navigate("/admin/employee-shifts")}
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

export default AssignEmployeeShift;
