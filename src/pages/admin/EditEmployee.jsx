import React, { useState, useEffect } from "react";
import { Form, Row, Col, Spinner, InputGroup, Button } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import CardContainer from "../../components/CardContainer";
import AppButton from "../../components/AppButton";
import { getCurrentUser } from "../../api/userApi";
import {
  getAllShifts
} from "../../api/shiftApi";

import {
  getEmployeeShiftByEmployeeId,
  assignShift,
  updateEmployeeShift
} from "../../api/employeeShiftApi";

import { 
  getEmployeeById,
  getRoles,
  updateEmployee,
  getUserByEmployeeId,
  updateUser
} from "../../api/employeeApi";

import {
  validateFullName,
  validatePhone,
  validateUsername,
  validatePassword,
} from "../../utils/validators";
import { Eye, EyeSlash } from "react-bootstrap-icons";

const EditEmployee = ({ onLogout }) => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [user, setUser] = useState({ id: null, username: "", password: "" });
  const [roles, setRoles] = useState([]);
  const [admin, setAdmin] = useState({name:"Admin", role: "Admin"});
  const [errors, setErrors] = useState({});
  const [shifts, setShifts] = useState([]);
  const [shiftId, setShiftId] = useState("");
  const [existingShift, setExistingShift] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

useEffect(() => {
  // Fetch employee + user data
  const fetchData = async () => {
    try {
      const empRes = await getEmployeeById(id);
      setEmployee(empRes.data);

      const userRes = await getUserByEmployeeId(id);
      setUser({ id: userRes.data.id, username: userRes.data.username, password: "" });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const res = await getRoles();
      setRoles(res.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  fetchData();
  fetchRoles();
}, [id]);

  useEffect(() => {
    const fetchRolesAndAdmin = async () => {
      try {
        // Roles
        const rolesRes = await getRoles();
        setRoles(rolesRes.data);

        // Admin info from /users/me
        const userRes = await getCurrentUser();
        setAdmin({
          name: userRes.data.fullName,
          role: userRes.data.role,
        });
      } catch (err) {
        console.error("Failed to fetch roles or admin info:", err);
      }
    };

    fetchRolesAndAdmin();
  }, []);

  useEffect(() => {
    if (!employee || employee.role !== "EMPLOYEE") return;

    const fetchShiftData = async () => {
      try {
        const shiftRes = await getAllShifts();
        setShifts(shiftRes.data);

        const empShiftRes = await getEmployeeShiftByEmployeeId(employee.id);
        if (empShiftRes.data) {
          setExistingShift(empShiftRes.data);
          setShiftId(empShiftRes.data.shiftId);
        }
      } catch (err) {
        console.error("Error fetching shift data", err);
      }
    };

    fetchShiftData();
  }, [employee]);


  const handleEmployeeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let tempErrors = {};

    if (!validateFullName(employee.fullName)) tempErrors.fullName = "Full name may only contain letters & spaces.";
    if (!validatePhone(employee.phone)) tempErrors.phone = "Phone must be a valid Pakistani number (03XX...).";
    if (!validateUsername(user.username)) tempErrors.username = "Username cannot have spaces. Only letters & numbers allowed.";
    if (user.password && !validatePassword(user.password)) tempErrors.password = "Password must be at least 6 characters.";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  try {
    // First, update employee
    const updatedEmployee = await updateEmployee(id, employee);
    // Only assign/update shift if employee is EMPLOYEE
    if (employee.role === "EMPLOYEE") {
      if (!shiftId) {
        alert("Please select a shift before assigning.");
      } else {
        // Debug log to see what existingShift contains
        console.log("existingShift:", existingShift);
        
        // Check if existing shift exists - use existingShift itself as indicator
        if (existingShift) {
          // UPDATE: Pass the existing employee-shift record ID
          const updatePayload = {
            id: existingShift.id,           // ✅ Pass the employee-shift record ID for update
            employeeId: employee.id,
            shiftId: Number(shiftId)
          };
          console.log("Updating shift with payload:", updatePayload);
          await updateEmployeeShift(updatePayload);
        } else {
          // INSERT: New shift assignment (no id needed)
          const insertPayload = {
            employeeId: employee.id,
            shiftId: Number(shiftId)
          };
          console.log("Assigning new shift with payload:", insertPayload);
          await assignShift(insertPayload);
        }
      }
    }
    // Update user info
    if (user.username || user.password) {
      await updateUser(user.id, {
        username: user.username,
        password: user.password || undefined
      });
    }
    navigate("/admin/employees");
  } catch (err) {
    console.error("Error updating employee", err);
    alert("Failed to update employee");
  }
};



  if (!employee) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
      <Spinner animation="border" variant="warning" />
    </div>
  );

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} username={admin.name} role={admin.role} />
        <div className="p-4 d-flex justify-content-center">
          <div className="w-75">
            <CardContainer title="Edit Employee">
              <Form onSubmit={handleSubmit}>
                {/* Full Name + Email */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        name="fullName"
                        value={employee.fullName}
                        onChange={handleEmployeeChange}
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
                        onChange={handleEmployeeChange}
                        placeholder="Enter email"
                        required
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
                        value={employee.phone || ""}
                        onChange={handleEmployeeChange}
                        isInvalid={!!errors.phone}
                        placeholder="03XXXXXXXXX"
                      />
                      <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Gender</Form.Label>
                      <Form.Select
                        name="gender"
                        value={employee.gender}
                        onChange={handleEmployeeChange}
                        required
                      >
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
                        value={employee.department || ""}
                        onChange={handleEmployeeChange}
                        placeholder="Enter department"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Designation</Form.Label>
                      <Form.Control
                        name="designation"
                        value={employee.designation || ""}
                        onChange={handleEmployeeChange}
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
                        value={employee.role || ""}
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
                        value={employee.joiningDate || ""}
                        onChange={handleEmployeeChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {employee.role === "EMPLOYEE" && (
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Assign Shift</Form.Label>
                     <Form.Select
  value={shiftId || ""}
  onChange={(e) => {
    const val = e.target.value;
    setShiftId(val || ""); // keep as string for now
  }}
>
  <option value="">Select Shift</option>
  {shifts.map((shift) => (
    <option key={shift.id} value={shift.id}>
      {shift.shiftName} ({shift.startsAt} - {shift.endsAt})
    </option>
  ))}
</Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              )}


                {/* Username + Password with eye icon */}
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        name="username"
                        value={user.username || ""}
                        onChange={handleUserChange}
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
                          value={user.password || ""}
                          onChange={handleUserChange}
                          isInvalid={!!errors.password}
                          placeholder="Leave blank to keep current password"
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeSlash /> : <Eye />}
                        </Button>
                        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Active checkbox */}
                <Row className="mb-3">
                  <Col md={6} className="d-flex align-items-center">
                    <Form.Check
                      type="checkbox"
                      name="active"
                      checked={employee.active}
                      onChange={handleEmployeeChange}
                      label="Active"
                      disabled={employee.role?.toLowerCase() === "admin"} // ✅ Admin cannot deactivate
                    />
                  </Col>
                </Row>

                <div className="d-flex gap-2">
                  <div className="d-flex gap-2">
  {/* Disable submit until employee + shift data is ready */}
  <AppButton
    text="Update Employee"
    variant="primary"
    type="submit"
    disabled={!(employee && (employee.role !== "EMPLOYEE" || shiftId))} 
  />
  <AppButton
    text="Cancel"
    variant="secondary"
    onClick={() => navigate("/admin/employees")}
  />
</div>

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