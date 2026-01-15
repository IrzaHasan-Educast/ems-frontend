import React, { useEffect, useState } from "react";
import { Table, Spinner, Button, Form, Row, Col, Modal, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import { PencilSquare, Eye, FileEarmarkText, Gear } from "react-bootstrap-icons";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import ViewEmployeeModal from "../../components/ViewEmployeeModal";
import { getCurrentUser } from "../../api/userApi";
import { getAllEmployees, getEmployeeById, getRoles, toggleActiveEmployee } from "../../api/employeeApi";
import * as XLSX from "xlsx";

const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "fullName", label: "Full Name" },
  { key: "username", label: "Username" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "gender", label: "Gender" },
  { key: "department", label: "Department" },
  { key: "designation", label: "Designation" },
  { key: "role", label: "Role" },
  { key: "assignedShift", label: "Shift" },
  { key: "joiningDate", label: "Joining Date" },
  { key: "active", label: "Status" },
  { key: "actions", label: "Actions" },
];

const AllEmployees = ({ onLogout }) => {
  // Default visible columns
  const defaultVisible = ["sno", "fullName", "department", "assignedShift", "role", "designation", "active", "actions"];

  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter Data Lists
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]); // ✅ New State for Shifts
  const [admin, setAdmin] = useState({ name: "", role: "" });

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Column Management
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(defaultVisible);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState(""); // ✅ New Filter State
  const [statusFilter, setStatusFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const initData = async () => {
      try {
        const userRes = await getCurrentUser();
        setAdmin({ name: userRes.data.fullName, role: userRes.data.role });

        const rolesRes = await getRoles();
        setRoles(rolesRes.data);

        const empRes = await getAllEmployees();
        setEmployees(empRes.data);
        setFiltered(empRes.data);

        // Extract Unique Departments
        const uniqueDepts = [...new Set(empRes.data.map(e => e.department).filter(Boolean))];
        setDepartments(uniqueDepts.sort());

        // ✅ Extract Unique Shifts
        const uniqueShifts = [...new Set(empRes.data.map(e => e.assignedShift).filter(Boolean))];
        setShifts(uniqueShifts.sort());

      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // --- 2. FILTERING ---
  useEffect(() => {
    let result = employees;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(emp => 
        [emp.fullName, emp.email, emp.username, emp.phone].some(val => val?.toLowerCase().includes(term))
      );
    }

    if (roleFilter) result = result.filter(emp => emp.role === roleFilter);
    if (deptFilter) result = result.filter(emp => emp.department === deptFilter);
    
    // ✅ Shift Filter Logic
    if (shiftFilter) result = result.filter(emp => emp.assignedShift === shiftFilter);

    if (statusFilter !== "") {
      const isActive = statusFilter === "active";
      result = result.filter(emp => emp.active === isActive);
    }

    // Sort
    result.sort((a, b) => {
      if (a.role?.toLowerCase() === "admin" && b.role?.toLowerCase() !== "admin") return -1;
      if (a.role?.toLowerCase() !== "admin" && b.role?.toLowerCase() === "admin") return 1;
      return a.fullName.localeCompare(b.fullName);
    });

    setFiltered(result);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, deptFilter, shiftFilter, statusFilter, employees]);

  // --- 3. ACTIONS & EXPORT ---
  const handleToggleActive = async (emp) => {
    const updatedList = employees.map(e => e.id === emp.id ? { ...e, active: !e.active } : e);
    setEmployees(updatedList);
    try { await toggleActiveEmployee(emp.id); } catch (error) { setEmployees(employees); }
  };

  const handleView = async (id) => {
    try {
      const res = await getEmployeeById(id);
      setSelectedEmployee(res.data);
      setShowModal(true);
    } catch (error) { console.error(error); }
  };

  const handleEdit = (id) => navigate(`/admin/employees/edit/${id}`);

  const handleExport = () => {
    const fileName = prompt("Enter file name:", "Employees_List");
    if (!fileName) return;
    const exportCols = selectedColumns.filter(c => c !== "actions");
    const headers = exportCols.map(colKey => allColumns.find(c => c.key === colKey).label);
    const data = filtered.map((emp, idx) => 
      exportCols.map(col => {
        if (col === "sno") return idx + 1;
        if (col === "active") return emp.active ? "Active" : "Inactive";
        return emp[col] || "--";
      })
    );
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const handleReset = () => {
    setSearchTerm("");
    setRoleFilter("");
    setDeptFilter("");
    setShiftFilter("");
    setStatusFilter("");
    setRowsPerPage(15);
    setCurrentPage(1);
    setSelectedColumns(defaultVisible);
  };

  // --- 4. RENDER HELPERS ---
  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(k => k !== key));
    } else {
      setSelectedColumns(allColumns.filter(c => selectedColumns.includes(c.key) || c.key === key).map(c => c.key));
    }
  };

  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = rowsPerPage === "All" ? filtered : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const cellStyle = { 
    padding: "4px 8px", 
    fontSize: "0.85rem", 
    verticalAlign: "middle",
    whiteSpace: "nowrap" // Prevents wrapping
  };

  const renderCell = (col, emp, index) => {
    switch (col) {
      case "sno": return rowsPerPage === "All" ? index + 1 : (currentPage - 1) * rowsPerPage + index + 1;
      case "fullName": return <span className="fw-semibold text-dark">{emp.fullName}</span>;
      case "role": return <Badge bg="secondary" className="fw-normal">{emp.role}</Badge>;
      case "active": 
        return emp.role?.toLowerCase() === "admin" ? <Badge bg="success">Active</Badge> : (
          <div className="d-flex justify-content-center">
            <div onClick={() => handleToggleActive(emp)} style={{ width: "32px", height: "16px", borderRadius: "15px", backgroundColor: emp.active ? "#28a745" : "#dc3545", position: "relative", cursor: "pointer", transition: "0.3s" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: emp.active ? "18px" : "2px", transition: "0.3s" }} />
            </div>
          </div>
        );
      case "actions":
        const isHREditingAdmin = admin.role?.toLowerCase() === "hr" && emp.role?.toLowerCase() === "admin";
        return (
          <div className="d-flex justify-content-center gap-1">
            <Button variant="outline-primary" size="sm" style={{padding: "2px 5px"}} onClick={() => handleView(emp.id)}><Eye /></Button>
            <Button variant="outline-warning" size="sm" style={{padding: "2px 5px"}} disabled={isHREditingAdmin} onClick={() => handleEdit(emp.id)}><PencilSquare /></Button>
          </div>
        );
      default: return emp[col] || "--";
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      {/* Main Content Area */}
      <div className="flex-grow-1" style={{ minWidth: 0 }}> {/* minWidth: 0 prevents flex child from overflowing */}
        <TopNavbar 
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role")}
        />        
        <div className="p-3 container-fluid">
          <PageHeading title="All Employees" buttonText="Add Employee" onButtonClick={() => navigate("/admin/employees/add")} />

          {/* FILTERS CARD */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              {/* Filters are responsive: 12 on mobile, 6 on tablet, 2 or 3 on desktop */}
              <Col lg={2} md={4} sm={12}>
                <Form.Control size="sm" type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">All Roles</option>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </Form.Select>
              </Col>
              {/* ✅ Shift Filter */}
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
                  <option value="">All Shifts</option>
                  {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Col>
              
              {/* Buttons Row */}
              <Col lg={2} md={4} sm={12} className="d-flex gap-2 justify-content-lg-end">
                 <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}} style={{width: "70px"}}>
                  {[15, 25, 50, "All"].map(n => <option key={n} value={n}>{n}</option>)}
                </Form.Select>
                <Button variant="outline-secondary" size="sm" onClick={handleReset} title="Reset">↻</Button>
                <Button variant="outline-primary" size="sm" onClick={() => setShowColumnsModal(true)} title="Columns"><Gear /></Button>
                <Button variant="success" size="sm" onClick={handleExport} title="Export"><FileEarmarkText /></Button>
              </Col>
            </Row>
          </CardContainer>

          {/* TABLE CONTAINER - Fixed for Horizontal Scroll */}
          <CardContainer className="mt-3" style={{ padding: "0px" }}> {/* Remove padding from card to maximize space */}
             {loading ? <div className="text-center p-5"><Spinner animation="border" variant="warning" /></div> : (
              <>
                {/* Wrapper for responsive table */}
                <div style={{ overflowX: "auto", maxWidth: "100%", borderRadius: "8px" }}>
                  <Table bordered hover size="sm" className="mb-0 w-100">
                    <thead style={{ backgroundColor: "#FFA500", color: "#fff", textAlign: "center" }}>
                      <tr>
                        {selectedColumns.map(col => (
                           <th key={col} style={{padding: "8px", fontSize: "0.85rem", whiteSpace: "nowrap"}}>
                             {allColumns.find(c => c.key === col).label}
                           </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((emp, idx) => (
                        <tr key={emp.id} style={{ textAlign: "center" }}>
                           {selectedColumns.map(col => <td key={col} style={cellStyle}>{renderCell(col, emp, idx)}</td>)}
                        </tr>
                      ))}
                      {paginatedData.length === 0 && <tr><td colSpan={selectedColumns.length} className="text-center p-3 text-muted">No employees found.</td></tr>}
                    </tbody>
                  </Table>
                </div>

                {rowsPerPage !== "All" && paginatedData.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-2">
                    <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrevious}>Previous</Button>
                    <span className="small text-muted">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
             )}
          </CardContainer>

          {/* COLUMN MODAL */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)} centered scrollable size="sm">
            <Modal.Header closeButton className="py-2"><Modal.Title className="fs-6">Show/Hide Columns</Modal.Title></Modal.Header>
            <Modal.Body>
              {allColumns.map(col => (
                <Form.Check key={col.key} type="switch" id={`col-${col.key}`} label={col.label} checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} className="mb-2" />
              ))}
            </Modal.Body>
          </Modal>

          {selectedEmployee && <ViewEmployeeModal show={showModal} handleClose={() => setShowModal(false)} employee={selectedEmployee} />}
        </div>
      </div>
    </div>
  );
};

export default AllEmployees;