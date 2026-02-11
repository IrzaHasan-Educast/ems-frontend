import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge, InputGroup } from "react-bootstrap";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
// ✅ API Imports updated to include actions
import { getEmployeeLeavesByManager, approveLeave, rejectLeave, setPendingLeave } from "../../api/leaveApi"; 
import { FileEarmarkText, Eye, Image as ImageIcon, Gear, CheckCircle, XCircle, Clock } from "react-bootstrap-icons";
import jwtHelper from "../../utils/jwtHelper";
import * as XLSX from "xlsx";

// ✅ 1. Added "Actions" to Column Definitions
const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "employeeName", label: "Employee Name" },
  { key: "leaveType", label: "Leave Type" },
  { key: "appliedOn", label: "Applied On" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "duration", label: "Days" },
  { key: "description", label: "Reason" },
  { key: "prescriptionImg", label: "Proof / Link" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" }, // New Column
];

const ManagerLeaveRequests = () => {
  // 1. User & Token
  const token = localStorage.getItem("token");
  const role = jwtHelper.getRoleFromToken(token);

  // 2. States
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  
  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Column Management
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(allColumns.map(c => c.key)); 

  // View Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDescModal, setShowDescModal] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");


  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true
    });
  };

  const getStatusBadge = (status) => {
    // Handling case sensitivity just in case
    const s = status ? status.toUpperCase() : "";
    switch (s) {
      case "APPROVED": return <Badge bg="success">Approved</Badge>;
      case "REJECTED": return <Badge bg="danger">Rejected</Badge>;
      case "PENDING": return <Badge bg="warning" text="dark">Pending</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      try {
        const res = await getEmployeeLeavesByManager();
        const data = res.data || [];
        // Sort by Applied Date (Latest first)
        data.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
        setLeaves(data);
        setFilteredLeaves(data);
      } catch (error) {
        console.error("Failed to fetch leaves:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaves();
  }, []);

  // --- FILTERING LOGIC ---
  useEffect(() => {
    let result = [...leaves];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(l => 
        l.employeeName?.toLowerCase().includes(q) || 
        l.leaveType?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter(l => l.status === statusFilter);
    }
    if (monthFilter) {
      result = result.filter(l => {
        const d = new Date(l.startDate);
        return (d.getMonth() + 1) === parseInt(monthFilter);
      });
    }

    setFilteredLeaves(result);
    // Reset page if filtered results are fewer than current page view
    if (currentPage > Math.ceil(result.length / rowsPerPage)) setCurrentPage(1);
    
  }, [searchTerm, statusFilter, monthFilter, leaves, rowsPerPage]);

  // --- ACTION HANDLERS (New Logic) ---
  const handleAction = async (id, newStatus) => {
    // Confirm action
    if(!window.confirm(`Are you sure you want to mark this as ${newStatus}?`)) return;

    try {
        if (newStatus === "APPROVED") await approveLeave(id);
        if (newStatus === "REJECTED") await rejectLeave(id);
        if (newStatus === "PENDING") await setPendingLeave(id);

        // Optimistic Update: Update the local state immediately
        const updatedList = leaves.map(l => l.id === id ? { ...l, status: newStatus } : l);
        setLeaves(updatedList);
        
    } catch (err) {
        console.error(err);
        alert("Failed to update status. Please try again.");
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("");
    setMonthFilter("");
    setRowsPerPage(10);
    setCurrentPage(1);
    setSelectedColumns(allColumns.map(c => c.key));
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
    const fileName = prompt("Enter file name:", "Team_Leaves");
    if (!fileName) return;

    const headers = selectedColumns
      .filter(col => col !== "actions") // Don't export actions column
      .map(k => allColumns.find(c => c.key === k).label);

    const data = filteredLeaves.map((l, idx) => 
      selectedColumns
        .filter(col => col !== "actions")
        .map(col => {
          switch(col) {
            case "sno": return idx + 1;
            case "employeeName": return l.employeeName;
            case "leaveType": return l.leaveType;
            case "appliedOn": return formatDateTime(l.appliedOn);
            case "startDate": return formatDate(l.startDate);
            case "endDate": return formatDate(l.endDate);
            case "duration": return l.duration;
            case "description": return l.description;
            case "status": return l.status;
            case "prescriptionImg": return l.prescriptionImg || "N/A"; 
            default: return "";
          }
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leaves");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const handleViewImage = (url) => {
    setSelectedImage(url);
    setShowImageModal(true);
  };

  const handleViewDesc = (desc) => {
    setSelectedDesc(desc);
    setShowDescModal(true);
  };

  // --- RENDER HELPERS ---
  const renderCell = (col, leave, idx) => {
    switch(col) {
      case "sno": return rowsPerPage === "All" ? idx + 1 : (currentPage - 1) * rowsPerPage + idx + 1;
      case "employeeName": return <span className="fw-bold text-start">{leave.employeeName}</span>;
      case "leaveType": return <Badge bg="info" text="dark" className="fw-normal">{leave.leaveType}</Badge>;
      case "appliedOn": return <span className="small">{formatDateTime(leave.appliedOn)}</span>;
      case "startDate": return <span className="small">{formatDate(leave.startDate)}</span>;
      case "endDate": return <span className="small">{formatDate(leave.endDate)}</span>;
      case "duration": return <span>{leave.duration} Days</span>;
      case "description": 
         return <Button variant="link" className="p-0 text-decoration-none small" onClick={() => handleViewDesc(leave.description)}>View</Button>;
      case "prescriptionImg":
        return leave.prescriptionImg ? (
          <Button variant="outline-primary" size="sm" style={{padding: "1px 5px"}} onClick={() => handleViewImage(leave.prescriptionImg)} title="View Proof">
            <ImageIcon />
          </Button>
        ) : <span className="text-muted small">--</span>;
      case "status": return getStatusBadge(leave.status);
      
      // ✅ Added Actions Buttons
      case "actions":
        return (
          <div className="d-flex gap-2 justify-content-center">
            {leave.status !== "APPROVED" && (
                <CheckCircle size={18} color="green" style={{cursor: "pointer"}} title="Approve" onClick={() => handleAction(leave.id, "APPROVED")} />
            )}
            {leave.status !== "REJECTED" && (
                <XCircle size={18} color="red" style={{cursor: "pointer"}} title="Reject" onClick={() => handleAction(leave.id, "REJECTED")} />
            )}
            {leave.status !== "PENDING" && (
                <Clock size={18} color="orange" style={{cursor: "pointer"}} title="Mark Pending" onClick={() => handleAction(leave.id, "PENDING")} />
            )}
          </div>
        );

      default: return "--";
    }
  };

  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filteredLeaves.length / rowsPerPage);
  const paginatedData = rowsPerPage === "All" ? filteredLeaves : filteredLeaves.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);


  return (
    <>
        <div className="p-3 container-fluid">
          <PageHeading title="Team Leave Requests" />

          {/* FILTERS */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col lg={3} md={6}>
                <InputGroup size="sm">
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <Form.Control 
                    placeholder="Search employee or type..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </InputGroup>
              </Col>

              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </Form.Select>
              </Col>

              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                  <option value="">All Months</option>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"]
                  .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </Form.Select>
              </Col>

              <Col lg={2} md={4} sm={6}>
                 <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
                  {[10, 25, 50, "All"].map(n => <option key={n} value={n}>{n} per page</option>)}
                </Form.Select>
              </Col>

              <Col lg={3} md={12} className="d-flex justify-content-end gap-2">
                <Button variant="secondary" size="sm" onClick={handleReset} title="Reset Filters">↻</Button>
                <Button variant="outline-primary" size="sm" onClick={() => setShowColumnsModal(true)} title="Column Settings"><Gear /></Button>
                <Button variant="success" size="sm" onClick={handleExport}><FileEarmarkText /> Export</Button>
              </Col>
            </Row>
          </CardContainer>

          {/* TABLE */}
          <CardContainer className="mt-3" style={{ padding: "0" }}>
            {loading ? (
              <div className="text-center p-5"><Spinner animation="border" variant="warning" /></div>
            ) : filteredLeaves.length === 0 ? (
              <div className="text-center p-5 text-muted">No leave requests found.</div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <Table bordered hover size="sm" className="mb-0 w-100">
                    <thead style={{ backgroundColor: "#FFA500", color: "#fff", textAlign: "center" }}>
                      <tr>
                         {selectedColumns.map(colKey => (
                            <th key={colKey} className="p-2" style={{whiteSpace: "nowrap"}}>
                               {allColumns.find(c => c.key === colKey)?.label}
                            </th>
                         ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((leave, idx) => (
                        <tr key={leave.id} style={{ textAlign: "center", verticalAlign: "middle" }}>
                           {selectedColumns.map(col => (
                              <td key={col} style={{padding: "6px"}}>{renderCell(col, leave, idx)}</td>
                           ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination Controls */}
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

          {/* MODALS */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)} centered size="sm" scrollable>
            <Modal.Header closeButton className="py-2"><Modal.Title className="fs-6">Show/Hide Columns</Modal.Title></Modal.Header>
            <Modal.Body>
              {allColumns.map(col => (
                <Form.Check 
                  key={col.key} type="switch" id={`col-${col.key}`} label={col.label} 
                  checked={selectedColumns.includes(col.key)} 
                  onChange={() => toggleColumn(col.key)} className="mb-2" 
                />
              ))}
            </Modal.Body>
          </Modal>

          <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
            <Modal.Header closeButton className="py-2"><Modal.Title className="fs-6">Medical Proof</Modal.Title></Modal.Header>
            <Modal.Body className="text-center p-4 bg-light">
               {selectedImage && (
                 <img src={selectedImage} alt="Prescription" className="img-fluid rounded shadow-sm" style={{maxHeight: "70vh"}} />
               )}
            </Modal.Body>
          </Modal>

          <Modal show={showDescModal} onHide={() => setShowDescModal(false)} centered>
            <Modal.Header closeButton className="py-2"><Modal.Title className="fs-6">Leave Reason</Modal.Title></Modal.Header>
            <Modal.Body className="p-4">
               <p className="mb-0 text-break">{selectedDesc || "No description provided."}</p>
            </Modal.Body>
          </Modal>

        </div>
      </>
  );
};

export default ManagerLeaveRequests;