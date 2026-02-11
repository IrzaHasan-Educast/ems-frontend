import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, InputGroup, Badge, Modal } from "react-bootstrap";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getEmployeeDetailsByManager } from "../../api/employeeApi"; 
import { FileEarmarkText, Eye, Gear } from "react-bootstrap-icons";
import jwtHelper from "../../utils/jwtHelper";
import * as XLSX from "xlsx";
import ViewEmployeeModal from "../../components/ViewEmployeeModal"; // ✅ Imported Component

// ✅ Column Definitions
const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "department", label: "Department" },
  { key: "designation", label: "Designation" },
  { key: "gender", label: "Gender" },
  { key: "joiningDate", label: "Joining Date" },
  { key: "active", label: "Status" },
  { key: "actions", label: "Actions" },
];

const ManagerTeam = () => {

  // 2. States
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Column Management
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(
    ["sno", "fullName", "email", "designation", "department", "active", "actions"]
  );

  // View Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);


  // --- HELPER: Date Formatter ---
  const formatDate = (dateString) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleDateString("en-GB"); // DD/MM/YYYY
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        const res = await getEmployeeDetailsByManager();
        const data = res.data || [];
        
        // Sort Alphabetically
        data.sort((a, b) => a.fullName.localeCompare(b.fullName));

        setEmployees(data);
        setFiltered(data);
      } catch (error) {
        console.error("Failed to fetch team:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  // --- FILTERING LOGIC ---
  useEffect(() => {
    let result = [...employees];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(e => 
        e.fullName.toLowerCase().includes(q) || 
        e.email.toLowerCase().includes(q) ||
        e.phone.includes(q)
      );
    }

    if (deptFilter) {
      result = result.filter(e => e.department === deptFilter);
    }

    if (statusFilter !== "") {
      const isActive = statusFilter === "active";
      result = result.filter(e => e.active === isActive);
    }

    setFiltered(result);
    setCurrentPage(1);
  }, [searchTerm, deptFilter, statusFilter, employees]);

  // --- HANDLERS ---
  const handleReset = () => {
    setSearchTerm("");
    setDeptFilter("");
    setStatusFilter("");
    setRowsPerPage(10);
    setCurrentPage(1);
  };

  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(k => k !== key));
    } else {
      const newSelection = allColumns
        .filter(c => selectedColumns.includes(c.key) || c.key === key)
        .map(c => c.key);
      setSelectedColumns(newSelection);
    }
  };

  const handleExport = () => {
    const fileName = prompt("Enter file name:", "My_Team_Details");
    if (!fileName) return;

    const headers = selectedColumns
        .filter(c => c !== "actions")
        .map(k => allColumns.find(c => c.key === k).label);

    const data = filtered.map((e, idx) => 
       selectedColumns
        .filter(c => c !== "actions")
        .map(col => {
           if(col === "sno") return idx + 1;
           if(col === "joiningDate") return formatDate(e.joiningDate);
           if(col === "active") return e.active ? "Active" : "Inactive";
           return e[col] || "--";
        })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Team");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const handleView = (emp) => {
    // Format date specifically for the Modal View to look consistent
    const empForModal = {
        ...emp,
        joiningDate: formatDate(emp.joiningDate)
    };
    setSelectedEmp(empForModal);
    setShowModal(true);
  };

  // --- PAGINATION ---
  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = rowsPerPage === "All" ? filtered : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Unique Departments
  const uniqueDepts = [...new Set(employees.map(e => e.department))].sort();

  // --- RENDER CELL ---
  const renderCell = (col, emp, idx) => {
    switch (col) {
      case "sno": return rowsPerPage === "All" ? idx + 1 : (currentPage - 1) * rowsPerPage + idx + 1;
      case "fullName": 
        return (
          <div className="d-flex align-items-center">
            {/* <div className="rounded-circle bg-light text-primary d-flex align-items-center justify-content-center me-2 fw-bold shadow-sm" style={{width:"30px", height:"30px", fontSize:"0.8rem"}}>
                {emp.fullName.charAt(0).toUpperCase()}
            </div> */}
            <span className="fw-semibold">{emp.fullName}</span>
          </div>
        );
      case "email": return emp.email;
      case "department": return <Badge bg="light" text="dark" className="border">{emp.department}</Badge>;
      case "designation": return emp.designation;
      case "joiningDate": return formatDate(emp.joiningDate);
      case "active": 
        return emp.active 
          ? <Badge bg="success" className="rounded-pill">Active</Badge> 
          : <Badge bg="danger" className="rounded-pill">Inactive</Badge>;
      case "actions":
        return (
          <Button variant="outline-primary" size="sm" style={{padding: "2px 6px"}} onClick={() => handleView(emp)} title="View Details">
            <Eye />
          </Button>
        );
      default: return emp[col] || "--";
    }
  };

  return (
    <>
        <div className="p-3 container-fluid">
          <PageHeading title="My Team Details" />

          {/* FILTERS */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col lg={3} md={6}>
                <InputGroup size="sm">
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <Form.Control 
                    placeholder="Search name, email..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </InputGroup>
              </Col>

              <Col lg={2} md={6}>
                <Form.Select size="sm" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                  <option value="">All Departments</option>
                  {uniqueDepts.map((d, i) => <option key={i} value={d}>{d}</option>)}
                </Form.Select>
              </Col>

              <Col lg={2} md={6}>
                <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Col>

              <Col lg={2} md={6}>
                 <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
                  {[10, 25, 50, "All"].map(n => <option key={n} value={n}>{n} per page</option>)}
                </Form.Select>
              </Col>

              <Col lg={3} md={12} className="d-flex justify-content-end gap-2">
                <Button variant="secondary" size="sm" onClick={handleReset} title="Reset">↻</Button>
                <Button variant="outline-primary" size="sm" onClick={() => setShowColumnsModal(true)} title="Columns"><Gear /></Button>
                <Button variant="success" size="sm" onClick={handleExport}><FileEarmarkText /> Export</Button>
              </Col>
            </Row>
          </CardContainer>

          {/* TABLE */}
          <CardContainer className="mt-3" style={{ padding: "0" }}>
            {loading ? (
              <div className="text-center p-5"><Spinner animation="border" variant="warning" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center p-5 text-muted">No employees found in your team.</div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <Table bordered hover size="sm" className="mb-0 w-100">
                    <thead style={{ backgroundColor: "#FFA500", color: "#fff", textAlign: "center" }}>
                      <tr>
                        {selectedColumns.map(colKey => (
                            <th key={colKey} className="p-2" style={{whiteSpace: "nowrap"}}>
                                {allColumns.find(c => c.key === colKey).label}
                            </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((emp, idx) => (
                        <tr key={emp.id} style={{ textAlign: "center", verticalAlign: "middle" }}>
                           {selectedColumns.map(col => (
                              <td key={col} style={{padding: "6px", fontSize: "0.9rem"}}>{renderCell(col, emp, idx)}</td>
                           ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {rowsPerPage !== "All" && paginatedData.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-3">
                    <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrevious}>Previous</Button>
                    <span className="small text-muted">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
            )}
          </CardContainer>

          {/* COLUMN MODAL */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)} centered size="sm" scrollable>
            <Modal.Header closeButton className="py-2"><Modal.Title className="fs-6">Show/Hide Columns</Modal.Title></Modal.Header>
            <Modal.Body>
              {allColumns.map(col => (
                <Form.Check key={col.key} type="switch" label={col.label} checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} className="mb-2" />
              ))}
            </Modal.Body>
          </Modal>

          {/* ✅ USING YOUR COMPONENT: VIEW EMPLOYEE MODAL */}
          {selectedEmp && (
            <ViewEmployeeModal 
                show={showModal} 
                handleClose={() => setShowModal(false)} 
                employee={selectedEmp} 
            />
          )}

        </div>
      </>
  );
};

export default ManagerTeam;