// src/pages/admin/AllEmployees.jsx
import React, { useEffect, useState } from "react";
import { Table, Spinner, Button, Badge, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import { PencilSquare, Trash, Eye } from "react-bootstrap-icons";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import ViewEmployeeModal from "../../components/ViewEmployeeModal";

// ✅ Import service functions only
import { getAllEmployees, getEmployeeById, deleteEmployee, getRoles, toggleActiveEmployee } from "../../api/employeeApi";

const AllEmployees = ({ onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [admin, setAdmin] = useState({name: "Admin", role: "Admin"});
  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(()=>{
    const fetchRolesAndAdmin = async()=>{
      try{
        //get roles
        const res = await getRoles();
        setRoles(res.data);

        // get all employees (admin info)
        const empRes = await getAllEmployees();
        const allEmployees = empRes.data;

        const adminEmployee = allEmployees.find(
        (emp)=>emp.role?.toLowerCase() ==="admin"
        );

        if(adminEmployee) {
          setAdmin({
            name:adminEmployee.fullName,
            role: adminEmployee.role,
          });
        }
      } catch(err){
        console.error(err);
      }
    };
    fetchRolesAndAdmin();
  },[]);

  // Fetch all employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getAllEmployees(); // ✅ Using service function
        setEmployees(res.data);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Toggle active/inactive
  const handleToggleActive = async (emp) => {
    try {
      await toggleActiveEmployee(emp.id);
      setEmployees(employees.map(e => 
        e.id === emp.id ? { ...e, active: !e.active } : e
      ));
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(error.response?.data || "Failed to update status");
    }
  };


  // Edit employee
  const handleEdit = (id) => navigate(`/admin/employees/edit/${id}`);

  // Delete employee
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      await deleteEmployee(id); // ✅ Using service function
      setEmployees(employees.filter((emp) => emp.id !== id));
    } catch (error) {
      console.error("Failed to delete employee:", error);
      alert(error.response?.data || "Failed to delete employee");
    }
  };

  // View employee in modal
  const handleView = async (id) => {
    try {
      const res = await getEmployeeById(id); // ✅ Using service function
      setSelectedEmployee(res.data);
      setShowModal(true);
    } catch (error) {
      console.error("Failed to fetch employee:", error);
    }
  };

  // Filter employees for search
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
        <TopNavbar toggleSidebar={toggleSidebar}
        username={admin.name}
        role={admin.role} />
        <div className="p-4 container">
          {/* Heading + Add Employee */}
          
          <PageHeading
            title="All Employees"
            buttonText="Add Employee"
            onButtonClick={() => navigate("/admin/employees/add")}
          />

          {/* Search Bar */}
          <Row className="mb-3 justify-content-center">
            <Col md={4}>
              <Form.Group>
                <div className="input-group border border-warning border-1 rounded-2">
                  <span className="input-group-text bg-white border-0" id="search-addon">
                    <i className="bi bi-search"></i>
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

          {/* Employees Table */}
          <CardContainer>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
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
                    <th>Active</th>
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
                        {emp.role?.toLowerCase() === "admin" ? (
                          <span className="badge bg-success text-center">Active</span>
                        ) : (
                        <div className="d-flex justify-content-center gap-1">
                        <div
                            onClick={() => handleToggleActive(emp)}
                            style={{
                              width: "40px",
                              height: "20px",
                              borderRadius: "10px",
                              backgroundColor: emp.active ? "#28a745" : "#dc3545",
                              position: "relative",
                              cursor: "pointer",
                              transition: "background-color 0.3s",
                            }}
                          >
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                background: "#fff",
                                position: "absolute",
                                top: "2px",
                                left: emp.active ? "22px" : "2px",
                                transition: "left 0.3s",
                              }}
                            />
                          </div>
                        </div>
                          
                        )}
                      </td>

                      <td className="d-flex justify-content-center gap-1">
                        <Button variant="outline-primary" size="sm" onClick={() => handleView(emp.id)}>
                          <Eye />
                        </Button>
                        <Button variant="outline-warning" size="sm" onClick={() => handleEdit(emp.id)}>
                          <PencilSquare />
                        </Button>
                          {/* <Button 
                            variant={emp.active ? "outline-danger" : "outline-success"} 
                            size="sm" 
                            onClick={() => handleToggleActive(emp)}
                          >
                            {emp.active ? "Deactivate" : "Activate"}
                          </Button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContainer>

          {/* View Employee Modal */}
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
