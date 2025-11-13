// src/pages/admin/AllEmployees.jsx
import React, { useEffect, useState } from "react";
import { Table, Spinner, Button, Badge, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import { PencilSquare, Trash, Eye } from "react-bootstrap-icons";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import ViewEmployeeModal from "../../components/ViewEmployeeModal";

const AllEmployees = ({ onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("/api/v1/employees");
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => navigate(`/admin/employees/edit/${id}`);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await axios.delete(`/api/v1/employees/${id}`);
        setEmployees(employees.filter((emp) => emp.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Modal-based view
  const handleView = async (id) => {
    try {
      const res = await axios.get(`/api/v1/employees/${id}`);
      setSelectedEmployee(res.data);
      setShowModal(true);
    } catch (error) {
      console.error("Failed to fetch employee", error);
    }
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter((emp) =>
    [emp.fullName, emp.email, emp.role, emp.designation]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} />
        <div className="p-4 container">
          {/* Heading and Add Employee Button */}
          <PageHeading
            title="All Employees"
            buttonText="Add Employee"
            onButtonClick={() => navigate("/admin/employees/add")}
          />

        {/* Search Bar */}
        <Row className="mb-3 d-flex justify-content-center">
        <Col md={4}>
            <Form.Group>
            <div className="input-group border border-warning border-1 rounded-2 ">
                <span className="input-group-text bg-white border-0" id="search-addon">
                <i className="bi bi-search"></i> {/* Bootstrap Icons search */}
                </span>
                <Form.Control
                type="text"
                placeholder="Search by name, email, role, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border-0" 
                />
            </div>
            </Form.Group>
        </Col>
        </Row>


          {/* Card for Table */}
          <CardContainer>
            {loading ? (
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "50vh" }}
              >
                <Spinner animation="border" variant="warning" />
              </div>
            ) : (
              <Table bordered hover responsive>
                <thead style={{ backgroundColor: "#FFA500", color: "#fff", textAlign: "center" }}>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Designation</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp, index) => (
                    <tr key={emp.id} style={{ textAlign: "center" }}>
                      <td>{index + 1}</td>
                      <td className="text-start pl-5">{emp.fullName}</td>
                      <td className="text-start pl-5">{emp.email}</td>
                      <td>{emp.role || "-"}</td>
                      <td>{emp.designation || "-"}</td>
                      <td>
                        <Badge bg={emp.active ? "success" : "danger"}>
                          {emp.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="d-flex justify-content-center gap-1">
                        <Button variant="outline-primary" size="sm" onClick={() => handleView(emp.id)}>
                          <Eye />
                        </Button>
                        <Button variant="outline-warning" size="sm" onClick={() => handleEdit(emp.id)}>
                          <PencilSquare />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(emp.id)}>
                          <Trash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContainer>

          {/* View Modal */}
          {selectedEmployee && (
            <ViewEmployeeModal
              show={showModal}
              handleClose={() => setShowModal(false)}
              employee={selectedEmployee}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AllEmployees;
