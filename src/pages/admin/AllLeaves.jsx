import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge, InputGroup } from "react-bootstrap";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getAllLeaves, approveLeave, rejectLeave, setPendingLeave } from "../../api/leaveApi";
import { getCurrentUser } from "../../api/userApi";
import { Gear, FileEarmarkText, CheckCircle, XCircle, Clock, Eye, Image as ImageIcon } from "react-bootstrap-icons";
import * as XLSX from "xlsx";
import { formatDate } from "../../utils/dateHelper";

// ✅ Column Definitions
const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "employeeName", label: "Employee Name" },
  { key: "leaveType", label: "Leave Type" },
  { key: "description", label: "Reason" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "duration", label: "Days" },
  { key: "prescriptionImg", label: "Proof / Link" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

const AllLeaves = () => {
  // States
  const [leaves, setLeaves] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  
  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Column Management
  const [selectedColumns, setSelectedColumns] = useState(allColumns.map(c => c.key));
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  
  // View Modals
  const [showDescModal, setShowDescModal] = useState(false);
  const [modalDescription, setModalDescription] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // User & UI
  const [admin, setAdmin] = useState({ name: "", role: "" });

  // --- INITIAL FETCH ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await getCurrentUser();
        setAdmin({ name: userRes.data.fullName, role: userRes.data.role });

        const leavesRes = await getAllLeaves();
        const formatted = leavesRes.data
          .map(l => ({
            ...l,
            startDate: formatDate(l.startDate),
            endDate: formatDate(l.endDate),
            status: l.status.charAt(0).toUpperCase() + l.status.slice(1).toLowerCase(),
            leaveType: l.leaveType.charAt(0).toUpperCase() + l.leaveType.slice(1).toLowerCase().replace("_", " "),
          }))
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate)); // Latest first

        setLeaves(formatted);
        setFiltered(formatted);
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    const term = searchTerm.toLowerCase();

    let f = leaves.filter(l => {
      const matchSearch = [l.employeeName, l.leaveType, l.description, l.status]
        .join(" ")
        .toLowerCase()
        .includes(term);

      const matchStatus = statusFilter ? l.status === statusFilter : true;
      const matchMonth = monthFilter ? new Date(l.startDate).getMonth() + 1 === +monthFilter : true;
      const matchEmployee = employeeFilter ? l.employeeName === employeeFilter : true;
      const matchType = typeFilter ? l.leaveType === typeFilter : true;

      return matchSearch && matchStatus && matchMonth && matchEmployee && matchType;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, monthFilter, employeeFilter, typeFilter, leaves]);

  // --- HELPERS ---
  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("");
    setMonthFilter("");
    setEmployeeFilter("");
    setTypeFilter("");
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
    const fileName = prompt("Enter file name:", "All_Leaves");
    if (!fileName) return;

    const headers = selectedColumns
      .filter(col => col !== "actions")
      .map(k => allColumns.find(c => c.key === k).label);

    const data = filtered.map((row, index) => 
      selectedColumns
        .filter(col => col !== "actions")
        .map(col => {
           if(col === "sno") return index + 1;
           if(col === "prescriptionImg") return row.prescriptionImg || "N/A";
           return row[col] || "--";
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

  const handleAction = async (id, newStatus) => {
    try {
        if (newStatus === "Approved") await approveLeave(id);
        if (newStatus === "Rejected") await rejectLeave(id);
        if (newStatus === "Pending") await setPendingLeave(id);

        // Optimistic Update
        const updatedList = leaves.map(l => l.id === id ? { ...l, status: newStatus } : l);
        setLeaves(updatedList);
        // Filter logic will automatically handle `filtered` state due to useEffect dependency
    } catch (err) {
        console.error(err);
        alert("Failed to update status");
    }
  };

  // --- PAGINATION ---
  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const displayed = rowsPerPage === "All" ? filtered : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // --- UNIQUE DROPDOWN OPTIONS ---
  const employeeNames = [...new Set(leaves.map(l => l.employeeName))].sort();
  const leaveTypes = [...new Set(leaves.map(l => l.leaveType))].sort();

  // --- RENDER CELL ---
  const renderCell = (col, l, idx) => {
    switch (col) {
      case "sno": return rowsPerPage === "All" ? idx + 1 : (currentPage - 1) * rowsPerPage + idx + 1;
      case "employeeName": return <span className="fw-bold">{l.employeeName}</span>;
      case "leaveType": return <Badge bg="info" text="dark" className="fw-normal">{l.leaveType}</Badge>;
      case "description":
        return <Button variant="link" className="p-0 text-decoration-none small" onClick={() => { setModalDescription(l.description); setShowDescModal(true); }}>View</Button>;
      case "prescriptionImg":
        return l.prescriptionImg ? (
          <Button variant="outline-primary" size="sm" style={{padding: "1px 5px"}} onClick={() => handleViewImage(l.prescriptionImg)} title="View Proof">
            <ImageIcon />
          </Button>
        ) : <span className="text-muted small">--</span>;
      case "status":
         return <Badge bg={l.status === "Approved" ? "success" : l.status === "Rejected" ? "danger" : "warning"} text={l.status === "Pending" ? "dark" : "white"}>{l.status}</Badge>;
      case "actions":
        return (
          <div className="d-flex gap-2 justify-content-center">
            {l.status !== "Approved" && <CheckCircle size={18} color="green" style={{cursor: "pointer"}} title="Approve" onClick={() => handleAction(l.id, "Approved")} />}
            {l.status !== "Rejected" && <XCircle size={18} color="red" style={{cursor: "pointer"}} title="Reject" onClick={() => handleAction(l.id, "Rejected")} />}
            {l.status !== "Pending" && <Clock size={18} color="orange" style={{cursor: "pointer"}} title="Mark Pending" onClick={() => handleAction(l.id, "Pending")} />}
          </div>
        );
      default: return l[col] || "--";
    }
  };

  return (
    <>
        <div className="p-3 container-fluid">
          <PageHeading title="All Leave Requests" />

          {/* FILTERS */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col lg={3} md={6}>
                 <InputGroup size="sm">
                   <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                   <Form.Control placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </InputGroup>
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
                  <option value="">All Employees</option>
                  {employeeNames.map((n, i) => <option key={i} value={n}>{n}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  {leaveTypes.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                  <option value="">All Months</option>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                </Form.Select>
              </Col>
              <Col lg={1} md={4} sm={6}>
                 <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
                   {[10, 25, 50, "All"].map(n => <option key={n} value={n}>{n}</option>)}
                 </Form.Select>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2 mt-2">
                <Button variant="secondary" size="sm" onClick={handleReset}>↻</Button>
                <Button variant="outline-primary" size="sm" onClick={() => setShowColumnsModal(true)} title="Columns"><Gear /></Button>
                <Button variant="success" size="sm" onClick={handleExport}><FileEarmarkText /> Export</Button>
            </div>
          </CardContainer>

          {/* TABLE */}
          <CardContainer className="mt-3" style={{ padding: "0" }}>
            {loading ? (
              <div className="text-center p-5"><Spinner animation="border" variant="warning" /></div>
            ) : filtered.length === 0 ? (
               <div className="text-center p-5 text-muted">No records found.</div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <Table bordered hover size="sm" className="mb-0 w-100">
                    <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                      <tr>
                        {selectedColumns.map(cKey => (
                          <th key={cKey} style={{padding: "8px", whiteSpace: "nowrap"}}>
                             {allColumns.find(c => c.key === cKey)?.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((l, idx) => (
                        <tr key={l.id} style={{textAlign: "center", verticalAlign: "middle"}}>
                          {selectedColumns.map(col => (
                            <td key={col} style={{padding: "6px"}}>{renderCell(col, l, idx)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* PAGINATION */}
                {rowsPerPage !== "All" && (
                  <div className="d-flex justify-content-between align-items-center p-3">
                    <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrev}>Previous</Button>
                    <span className="small text-muted">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
            )}
          </CardContainer>

          {/* MODALS */}
          {/* Columns */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)} centered size="sm" scrollable>
            <Modal.Header closeButton className="py-2"><Modal.Title className="fs-6">Show/Hide Columns</Modal.Title></Modal.Header>
            <Modal.Body>
              {allColumns.map(c => (
                <Form.Check key={c.key} type="switch" label={c.label} checked={selectedColumns.includes(c.key)} onChange={() => toggleColumn(c.key)} className="mb-2" />
              ))}
            </Modal.Body>
          </Modal>

          {/* Description */}
          <Modal show={showDescModal} onHide={()=>setShowDescModal(false)} centered>
            <Modal.Header closeButton className="py-2"><Modal.Title className="fs-6">Reason</Modal.Title></Modal.Header>
            <Modal.Body className="p-4"><p className="mb-0 text-break">{modalDescription || "No description."}</p></Modal.Body>
          </Modal>

          {/* Image */}
          <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
             <Modal.Header closeButton className="py-2"><Modal.Title className="fs-6">Proof</Modal.Title></Modal.Header>
             <Modal.Body className="text-center bg-light p-4">
                {selectedImage && <img src={selectedImage} alt="Prescription" className="img-fluid rounded shadow-sm" style={{maxHeight: "75vh"}} />}
             </Modal.Body>
          </Modal>

        </div>
      </>
  );
};

export default AllLeaves;