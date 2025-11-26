import React, { useState, useEffect } from "react";
import { Form, Row, Col, InputGroup, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import CardContainer from "../../components/CardContainer";
import AppButton from "../../components/AppButton";

import { getRoles, addEmployee, getAllEmployees } from "../../api/employeeApi";
import {
  validateFullName,
  validatePhone,
  validateUsername,
  validatePassword,
} from "../../utils/validators";

import { Eye, EyeSlash } from "react-bootstrap-icons"; // icon

const AddEmployee = ({ onLogout }) => {
  const [employee, setEmployee] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    department: "",
    designation: "",
    role: "EMPLOYEE", // <- add this
    joiningDate: "",
    active: true,
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPassword, setShowPassword] = useState(false); // toggle state
  const [admin, setAdmin] = useState({ name: "Admin", role: "Admin" });

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    getRoles()
      .then((res) => setRoles(res.data))
      .catch((err) => console.error("Failed to fetch roles:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!validateFullName(employee.fullName))
      tempErrors.fullName = "Full name may only contain letters & spaces.";
    if (!validatePhone(employee.phone))
      tempErrors.phone = "Phone must be a valid Pakistani number (03XX...).";
    if (!validateUsername(employee.username))
      tempErrors.username = "Username cannot have spaces. Only letters & numbers allowed.";
    if (!validatePassword(employee.password))
      tempErrors.password = "Password must be at least 6 characters.";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await addEmployee(employee);
      navigate("/admin/employees");
    } catch (error) {
      console.error(error);
      alert(error.response?.data || "Failed to create employee");
    }
  };
useEffect(() => {
  const fetchRolesAndAdmin = async () => {
    try {
      // get roles
      const res = await getRoles();
      setRoles(res.data);

      // get all employees (admin info)
      const empRes = await getAllEmployees();
      const allEmployees = empRes.data;

      const adminEmployee = allEmployees.find(
        (emp) => emp.role?.toLowerCase() === "admin"
      );

      if (adminEmployee) {
        setAdmin({
          name: adminEmployee.fullName,
          role: adminEmployee.role,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  fetchRolesAndAdmin();
}, []);

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
      <TopNavbar 
        toggleSidebar={toggleSidebar}
        username={admin.name}
        role={admin.role}
      />
        <div className="p-4 d-flex justify-content-center">
          <div className="w-75">
            <CardContainer title="Add Employee">
              <Form onSubmit={handleSubmit}>
                {/* Full Name + Email */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        name="fullName"
                        value={employee.fullName}
                        onChange={handleChange}
                        isInvalid={!!errors.fullName}
                        placeholder="Enter full name"
                      />
                      <Form.Control.Feedback type="invalid">{errors.fullName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={employee.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter email"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Phone + Gender */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        name="phone"
                        value={employee.phone}
                        onChange={handleChange}
                        isInvalid={!!errors.phone}
                        placeholder="03XXXXXXXXX"
                      />
                      <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Gender</Form.Label>
                      <Form.Select name="gender" value={employee.gender} onChange={handleChange} required>
                        <option value="" disabled>Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Department + Designation */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Department</Form.Label>
                      <Form.Control
                        name="department"
                        value={employee.department}
                        onChange={handleChange}
                        placeholder="Enter department"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Designation</Form.Label>
                      <Form.Control
                        name="designation"
                        value={employee.designation}
                        onChange={handleChange}
                        placeholder="Enter designation (e.g., Developer, Manager)"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Role + Joining Date */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Role</Form.Label>
                      <Form.Control
                        name="role"
                        value="EMPLOYEE"
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Joining Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="joiningDate"
                        value={employee.joiningDate}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Username + Password with eye toggle */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        name="username"
                        value={employee.username}
                        onChange={handleChange}
                        isInvalid={!!errors.username}
                        placeholder="Enter username (no spaces)"
                      />
                      <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Password</Form.Label>
                      <InputGroup>
                        <Form.Control
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={employee.password}
                          onChange={handleChange}
                          isInvalid={!!errors.password}
                          placeholder="Enter password (min 6 chars)"
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <EyeSlash /> : <Eye />}
                        </Button>
                        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Active checkbox */}
                <Form.Check
                  type="checkbox"
                  label="Active"
                  name="active"
                  checked={employee.active}
                  onChange={handleChange}
                />

                {/* Buttons */}
                <div className="d-flex gap-2 mt-3">
                  <AppButton text="Save Employee" variant="primary" type="submit" />
                  <AppButton text="Cancel" variant="secondary" onClick={() => navigate("/admin/employees")} />
                </div>
              </Form>
            </CardContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
