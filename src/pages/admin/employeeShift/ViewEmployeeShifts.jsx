import React, { useEffect, useState, useCallback } from "react";
import { Table, Spinner, Button, Form, Row, Col, Modal, Badge, Card } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { FileEarmarkText, Gear, ArrowCounterclockwise, Eye, Clock, Person, Calendar3 } from "react-bootstrap-icons";

// Components
import Sidebar from "../../../components/Sidebar";
import TopNavbar from "../../../components/Navbar";
import CardContainer from "../../../components/CardContainer";
import PageHeading from "../../../components/PageHeading";
import ViewEmployeeModal from "../../../components/ViewEmployeeModal"; // ✅ Import Employee Modal

// API
import {
  getAllEmployeeShifts,
  getEmployeeShiftByShiftId,
} from "../../../api/employeeShiftApi";
import { getShiftById } from "../../../api/shiftApi"; // ✅ Import Shift API
import { getEmployeeById } from "../../../api/employeeApi"; // ✅ Import Employee API

// --- HELPER FUNCTION FOR AM/PM TIME ---
const formatTime = (timeString) => {
  if (!timeString) return "--";
  if (timeString.includes("AM") || timeString.includes("PM")) return timeString;

  const [hours, minutes] = timeString.split(":");
  const date = new Date();
  date.setHours(parseInt(hours));
  date.setMinutes(parseInt(minutes));
  
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Employee table columns (simplified - no shift info repeated)
const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "empName", label: "Employee Name" },
  { key: "actions", label: "Actions" },
];

const ViewEmployeeShifts = ({ onLogout }) => {
  const defaultVisible = ["sno", "empName", "actions"];

  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data States
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Shift Details State
  const [shiftDetails, setShiftDetails] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(false);

  // ✅ Employee Modal States
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  // UI States
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(defaultVisible);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Get shift ID from navigation state
  const filterShiftId = location.state?.filterShiftId;
  const filterShiftName = location.state?.filterShiftName;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- 1. FETCH SHIFT DETAILS ---
  const fetchShiftDetails = useCallback(async () => {
    if (!filterShiftId) return;
    
    setShiftLoading(true);
    try {
      const res = await getShiftById(filterShiftId);
      setShiftDetails(res.data);
    } catch (error) {
      console.error("Error fetching shift details:", error);
    } finally {
      setShiftLoading(false);
    }
  }, [filterShiftId]);

  // --- 2. FETCH EMPLOYEES DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (filterShiftId) {
        res = await getEmployeeShiftByShiftId(filterShiftId);
      } else {
        res = await getAllEmployeeShifts();
      }

      const fetchedData = res.data || [];
      setData(fetchedData);
      setFiltered(fetchedData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [filterShiftId]);

  useEffect(() => {
    fetchShiftDetails();
    fetchData();
  }, [fetchShiftDetails, fetchData]);

  // --- 3. FILTERING ---
  useEffect(() => {
    let result = data;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.empName?.toLowerCase() || "").includes(term)
      );
    }

    setFiltered(result);
    setCurrentPage(1);
  }, [searchTerm, data]);

  // --- 4. VIEW EMPLOYEE DETAILS ---
  const handleViewEmployee = async (empId) => {
    setEmployeeLoading(true);
    try {
      const res = await getEmployeeById(empId);
      setSelectedEmployee(res.data);
      setShowEmployeeModal(true);
    } catch (error) {
      console.error("Error fetching employee:", error);
      alert("Could not fetch employee details");
    } finally {
      setEmployeeLoading(false);
    }
  };

  // --- 5. VIEW MANAGER DETAILS ---
  const handleViewManager = async () => {
    if (!shiftDetails?.managerId) return;
    
    setEmployeeLoading(true);
    try {
      const res = await getEmployeeById(shiftDetails.managerId);
      setSelectedEmployee(res.data);
      setShowEmployeeModal(true);
    } catch (error) {
      console.error("Error fetching manager:", error);
      alert("Could not fetch manager details");
    } finally {
      setEmployeeLoading(false);
    }
  };

  // --- 6. ACTIONS ---
  const handleReset = () => {
    setSearchTerm("");
    setRowsPerPage(15);
    setCurrentPage(1);
    setSelectedColumns(defaultVisible);
  };

  const handleExport = () => {
    const fileName = prompt("Enter file name:", `${filterShiftName || "Shift"}_Employees`);
    if (!fileName) return;

    const exportCols = selectedColumns.filter(c => c !== "actions");
    const headers = exportCols.map(colKey => allColumns.find(c => c.key === colKey).label);
    
    // Add shift info at top
    const shiftInfo = shiftDetails ? [
      [`Shift: ${shiftDetails.shiftName}`],
      [`Time: ${formatTime(shiftDetails.startsAt)} - ${formatTime(shiftDetails.endsAt)}`],
      [`Manager: ${shiftDetails.managerName}`],
      [], // Empty row
      headers // Column headers
    ] : [headers];

    const exportData = filtered.map((item, idx) => 
      exportCols.map(col => {
        if (col === "sno") return idx + 1;
        return item[col] || "--";
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([...shiftInfo, ...exportData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(k => k !== key));
    } else {
      setSelectedColumns(allColumns.filter(c => selectedColumns.includes(c.key) || c.key === key).map(c => c.key));
    }
  };

  // Pagination Logic
  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = rowsPerPage === "All" ? filtered : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Styles
  const cellStyle = { 
    padding: "6px 8px", 
    fontSize: "0.85rem", 
    verticalAlign: "middle",
    whiteSpace: "nowrap" 
  };

  const renderCell = (col, item, index) => {
    switch (col) {
      case "sno": 
        return rowsPerPage === "All" ? index + 1 : (currentPage - 1) * rowsPerPage + index + 1;
      case "empName": 
        return <span className="fw-semibold text-dark">{item.empName}</span>;
      case "actions": 
        return (
          <div className="d-flex justify-content-center gap-1">
            <Button 
              variant="outline-primary" 
              size="sm" 
              style={{padding: "2px 6px"}}
              onClick={() => handleViewEmployee(item.empId)}
              title="View Employee Details"
              disabled={employeeLoading}
            >
              <Eye />
            </Button>
          </div>
        );
      default: 
        return item[col] || "--";
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar}/>
      
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <TopNavbar
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role")}
        />

        <div className="p-3 container-fluid">
          <PageHeading 
             title={filterShiftName ? `Shift: ${filterShiftName}` : "Employee Shift Assignments"} 
          />

          {/* ✅ SHIFT DETAILS CARD */}
          {filterShiftId && (
            <CardContainer className="mb-3">
              {shiftLoading ? (
                <div className="text-center p-3">
                  <Spinner animation="border" size="sm" variant="warning" />
                </div>
              ) : shiftDetails ? (
                <Row className="align-items-center">
                  {/* Shift Name */}
                  <Col lg={3} md={6} sm={12} className="mb-2 mb-lg-0">
                    <div className="d-flex align-items-center">
                      <Calendar3 className="text-warning me-2" size={20} />
                      <div>
                        <small className="text-muted d-block">Shift Name</small>
                        <span className="fw-bold text-dark">{shiftDetails.shiftName}</span>
                      </div>
                    </div>
                  </Col>

                  {/* Timing */}
                  <Col lg={4} md={6} sm={12} className="mb-2 mb-lg-0">
                    <div className="d-flex align-items-center">
                      <Clock className="text-info me-2" size={20} />
                      <div>
                        <small className="text-muted d-block">Timing</small>
                        <Badge bg="success" className="me-1">{formatTime(shiftDetails.startsAt)}</Badge>
                        <span className="text-muted">to</span>
                        <Badge bg="danger" className="ms-1">{formatTime(shiftDetails.endsAt)}</Badge>
                      </div>
                    </div>
                  </Col>

                  {/* Manager with View Button */}
                  <Col lg={3} md={6} sm={12} className="mb-2 mb-lg-0">
                    <div className="d-flex align-items-center">
                      <Person className="text-primary me-2" size={20} />
                      <div className="d-flex align-items-center">
                        <div>
                          <small className="text-muted d-block">Managed By</small>
                          <span className="fw-semibold text-dark">{shiftDetails.managerName || "--"}</span>
                        </div>
                        {/* ✅ Manager View Button */}
                        {shiftDetails.managerId && (
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="ms-2"
                            style={{padding: "2px 6px"}}
                            onClick={handleViewManager}
                            title="View Manager Details"
                            disabled={employeeLoading}
                          >
                            <Eye />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Col>

                  {/* Total Employees Count */}
                  <Col lg={2} md={6} sm={12}>
                    <div className="text-center">
                      <small className="text-muted d-block">Employees</small>
                      <Badge bg="warning" className="fs-6">{filtered.length}</Badge>
                    </div>
                  </Col>
                </Row>
              ) : (
                <div className="text-center text-muted p-2">
                  Shift details not available
                </div>
              )}
            </CardContainer>
          )}

          {/* --- FILTERS CARD --- */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              {/* Search */}
              <Col lg={4} md={6} sm={12}>
                <Form.Control 
                    size="sm" 
                    type="text" 
                    placeholder="Search Employee Name..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </Col>

              {/* Spacer */}
              <Col lg={4} md={0} sm={0}></Col>

              {/* Actions & Pagination */}
              <Col lg={4} md={6} sm={12} className="d-flex gap-2 justify-content-lg-end justify-content-md-start flex-wrap">
                 <Form.Select 
                   size="sm" 
                   value={rowsPerPage} 
                   onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}} 
                   style={{width: "70px"}}
                 >
                  {[15, 25, 50, "All"].map(n => <option key={n} value={n}>{n}</option>)}
                </Form.Select>
                
                <Button variant="outline-secondary" size="sm" onClick={handleReset} title="Reset Filters">
                    <ArrowCounterclockwise />
                </Button>
                
                <Button variant="outline-primary" size="sm" onClick={() => setShowColumnsModal(true)} title="Columns">
                    <Gear />
                </Button>
                
                <Button variant="success" size="sm" onClick={handleExport} title="Export to Excel">
                    <FileEarmarkText />
                </Button>
              </Col>
            </Row>
          </CardContainer>

          {/* --- EMPLOYEES TABLE --- */}
          <CardContainer className="mt-3" style={{ padding: "0px" }}>
            {loading ? (
              <div className="text-center p-5"><Spinner animation="border" variant="warning" /></div> 
            ) : (
              <>
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
                      {paginatedData.map((item, idx) => (
                        <tr key={item.id || idx} style={{ textAlign: "center" }}>
                           {selectedColumns.map(col => (
                               <td key={col} style={cellStyle}>{renderCell(col, item, idx)}</td>
                           ))}
                        </tr>
                      ))}
                      {paginatedData.length === 0 && (
                          <tr>
                              <td colSpan={selectedColumns.length} className="text-center p-4 text-muted">
                                  No employees assigned to this shift.
                              </td>
                          </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination Controls */}
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

          {/* --- COLUMNS MODAL --- */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)} centered scrollable size="sm">
            <Modal.Header closeButton className="py-2">
              <Modal.Title className="fs-6">Show/Hide Columns</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {allColumns.map(col => (
                <Form.Check 
                    key={col.key} 
                    type="switch" 
                    id={`col-${col.key}`} 
                    label={col.label} 
                    checked={selectedColumns.includes(col.key)} 
                    onChange={() => toggleColumn(col.key)} 
                    className="mb-2" 
                />
              ))}
            </Modal.Body>
          </Modal>

          {/* ✅ EMPLOYEE DETAILS MODAL */}
          {selectedEmployee && (
            <ViewEmployeeModal 
              show={showEmployeeModal} 
              handleClose={() => {
                setShowEmployeeModal(false);
                setSelectedEmployee(null);
              }} 
              employee={selectedEmployee} 
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default ViewEmployeeShifts;