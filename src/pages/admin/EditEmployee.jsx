// src/pages/admin/EditEmployee.jsx
import React, { useState, useEffect } from "react";
import { Form, Row, Col, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import CardContainer from "../../components/CardContainer";
import AppButton from "../../components/AppButton";

const EditEmployee = ({ onLogout }) => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [user, setUser] = useState({ id: null, username: "", password: "" });
  const [roles, setRoles] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    fetchEmployee();
    fetchRoles();
  }, []);

  const fetchEmployee = async () => {
    try {
      // Get employee data
      const res = await axios.get(`/api/v1/employees/${id}`);
      setEmployee(res.data);

      // Get linked user data
      const userRes = await axios.get(`/api/v1/users/employee/${id}`);
      setUser({ id: userRes.data.id, username: userRes.data.username, password: "" });
    } catch (error) {
      console.error("Error fetching employee/user:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get("/api/v1/roles");
      setRoles(res.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleEmployeeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmployee({
      ...employee,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUser({
      ...user,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update employee
      await axios.put(`/api/v1/employees/${id}`, employee);

      // Update user if username/password provided
      if (user.username || user.password) {
        await axios.put(`/api/v1/users/${user.id}`, {
          username: user.username,
          password: user.password || undefined, // send undefined if blank
        });
      }

      navigate("/admin/employees");
    } catch (error) {
      console.error("Error updating employee/user:", error);
      alert(error.response?.data || "Failed to update employee/user");
    }
  };

  if (!employee)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" variant="warning" />
      </div>
    );

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} />
        <div className="p-4 d-flex justify-content-center">
          <div className="w-75">
            <CardContainer title="Edit Employee">
              <Form onSubmit={handleSubmit}>
                {/* Employee Info */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={employee.fullName}
                        onChange={handleEmployeeChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={employee.email}
                        onChange={handleEmployeeChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={employee.phone || ""}
                        onChange={handleEmployeeChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Gender</Form.Label>
                      <Form.Select
                        name="gender"
                        value={employee.gender}
                        onChange={handleEmployeeChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Department</Form.Label>
                      <Form.Control
                        type="text"
                        name="department"
                        value={employee.department || ""}
                        onChange={handleEmployeeChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Designation</Form.Label>
                      <Form.Control
                        type="text"
                        name="designation"
                        value={employee.designation || ""}
                        onChange={handleEmployeeChange}
                        placeholder="e.g. Developer, Director"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Role</Form.Label>
                      <Form.Select
                        name="role"
                        value={employee.role}
                        onChange={handleEmployeeChange}
                        required
                      >
                        <option value="">Select Role</option>
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Joining Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="joiningDate"
                        value={employee.joiningDate || ""}
                        onChange={handleEmployeeChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* User Info */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={user.username || ""}
                        onChange={handleUserChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={user.password || ""}
                        onChange={handleUserChange}
                        placeholder="Leave blank to keep current password"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6} className="d-flex align-items-center">
                    <Form.Check
                      type="checkbox"
                      name="active"
                      checked={employee.active}
                      onChange={handleEmployeeChange}
                      label="Active"
                    />
                  </Col>
                </Row>

                <div className="d-flex gap-2">
                  <AppButton text="Update Employee" variant="primary" type="submit" />
                  <AppButton
                    text="Cancel"
                    variant="secondary"
                    onClick={() => navigate("/admin/employees")}
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

export default EditEmployee;
