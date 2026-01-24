import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading";
import { Trash, FileEarmarkText, Image as ImageIcon, Search, ArrowClockwise, InfoCircle } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { Table, Form, Button, InputGroup, FormControl, Badge, Modal, Spinner, Row, Col } from "react-bootstrap";
import { getCurrentUser } from "../../api/workSessionApi";
import { getLeavesByEmployee, deleteLeaveById } from "../../api/leaveApi";
import jwtHelper from "../../utils/jwtHelper";

const LeaveHistory = ({ onLogout }) => {
  // 1. JWT & User Info
  const token = localStorage.getItem("token"); // Kept for consistency if needed
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalDescription, setModalDescription] = useState("");

  // Data States
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

   // --- HELPERS ---
  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`; // 19-Jan-26
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { 
        day: "numeric", month: "short", year: "numeric", 
        hour: "numeric", minute: "2-digit", hour12: true 
    });
  };

  const getMonthName = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { month: "long" });
  };

  // --- DATA FETCHING ---
  const fetchLeaves = useCallback(async (employeeId) => {
    try {
      const res = await getLeavesByEmployee(employeeId);
      if (res.data && Array.isArray(res.data)) {
        const formatted = res.data.map((lv) => ({
          id: lv.id,
          type: lv.leaveType,
          status: lv.status, // PENDING, APPROVED, REJECTED
          startDate: formatDate(lv.startDate),
          endDate: formatDate(lv.endDate),
          duration: lv.duration,
          description: lv.description || "--",
          appliedOn: formatDateTime(lv.appliedOn),
          rawAppliedOn: lv.appliedOn, // For sorting
          prescriptionImg: lv.prescriptionImg,
          monthName: getMonthName(lv.startDate),
        }));
        
        // Sort: Latest Applied First
        formatted.sort((a, b) => new Date(b.rawAppliedOn) - new Date(a.rawAppliedOn));
        
        setLeaves(formatted);
        setFilteredLeaves(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch leaves", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const res = await getCurrentUser();
        // setEmployee({ fullName: res.data.fullName, id: res.data.employeeId }); // Not strictly needed unless displaying name
        await fetchLeaves(res.data.employeeId);
      } catch (err) {
        console.error("Failed fetching user", err);
        setLoading(false);
      }
    };
    initData();
  }, [fetchLeaves]);

  // --- FILTERING ---
  useEffect(() => {
    let result = [...leaves];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((lv) =>
        [lv.type, lv.description, lv.startDate].some(val => val.toLowerCase().includes(q))
      );
    }

    if (selectedStatus) {
      result = result.filter((lv) => lv.status.toUpperCase() === selectedStatus.toUpperCase());
    }

    if (selectedMonth) {
      result = result.filter((lv) => lv.monthName === selectedMonth);
    }

    setFilteredLeaves(result);
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedMonth, leaves]);

  // --- HANDLERS ---
  const handleReset = () => {
    setSelectedMonth("");
    setSelectedStatus("");
    setSearchQuery("");
    setRowsPerPage(10);
    setCurrentPage(1);
    setFilteredLeaves(leaves);
  };

  const handleViewImage = (url) => {
    setSelectedImage(url);
    setShowImageModal(true);
  };

  const handleDelete = async (leaveId) => {
    if (window.confirm("Are you sure you want to delete this pending leave request?")) {
      try {
        await deleteLeaveById(leaveId);
        // Optimistic UI Update
        const updatedList = leaves.filter((lv) => lv.id !== leaveId);
        setLeaves(updatedList);
        setFilteredLeaves(filteredLeaves.filter((lv) => lv.id !== leaveId));
      } catch (err) {
        console.error("Failed to delete leave", err);
        alert("Failed to delete leave. Please try again.");
      }
    }
  };

  const openDescriptionModal = (desc) => {
    setModalDescription(desc);
    setShowModal(true);
  };

  // --- PAGINATION ---
  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filteredLeaves.length / rowsPerPage);
  const paginatedData = rowsPerPage === "All" ? filteredLeaves : filteredLeaves.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status.toUpperCase()) {
      case "APPROVED": return <Badge bg="success">Approved</Badge>;
      case "REJECTED": return <Badge bg="danger">Rejected</Badge>;
      case "PENDING": return <Badge bg="warning" text="dark">Pending</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const uniqueMonths = [...new Set(leaves.map((lv) => lv.monthName))];

  return (
    <div className="d-flex" style={{ minHeight: "100vh", overflow: "hidden" }}>
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar} />

      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <TopNavbar 
            toggleSidebar={toggleSidebar}
            username={localStorage.getItem("name")}
            role={localStorage.getItem("role")}
        />

        <div className="p-3 container-fluid flex-grow-1 overflow-auto">
          <PageHeading
            title="My Leave History"
            buttonText="Apply Leave"
            onButtonClick={() => navigate("/employee/leave/apply")}
          />

          {/* FILTERS CARD */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col lg={3} md={6} xs={12}>
                <InputGroup size="sm">
                  <InputGroup.Text className="bg-white border-end-0 text-muted"><Search /></InputGroup.Text>
                  <FormControl
                    placeholder="Search type, date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-start-0 ps-0"
                  />
                </InputGroup>
              </Col>

              <Col lg={2} md={6} xs={6}>
                <Form.Select size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {uniqueMonths.map((m) => <option key={m}>{m}</option>)}
                </Form.Select>
              </Col>

              <Col lg={2} md={6} xs={6}>
                <Form.Select size="sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </Form.Select>
              </Col>

               <Col lg={2} md={6} xs={6}>
                <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
                   {[10, 25, 50, "All"].map(n => <option key={n} value={n}>{n} rows</option>)}
                </Form.Select>
              </Col>

              <Col lg={3} md={6} xs={6} className="d-flex justify-content-end">
                <Button variant="outline-secondary" size="sm" onClick={handleReset} title="Reset Filters">
                    <ArrowClockwise className="me-1"/> Reset
                </Button>
              </Col>
            </Row>
          </CardContainer>

          {/* TABLE SECTION */}
          <CardContainer className="mt-3 p-0 overflow-hidden">
            {loading ? (
               <div className="text-center p-5">
                 <Spinner animation="border" variant="warning" />
                 <p className="mt-2 text-muted small">Loading your records...</p>
               </div>
            ) : filteredLeaves.length === 0 ? (
               <div className="text-center p-5">
                  <div className="text-muted mb-3 fs-1"><i className="bi bi-inbox"></i></div>
                  <h6 className="text-muted">No Leave Records Found</h6>
                  {searchQuery || selectedStatus ? (
                    <Button variant="link" onClick={handleReset}>Clear Filters</Button>
                  ) : (
                    <Button variant="primary" size="sm" className="mt-2" onClick={() => navigate("/employee/leave/apply")}>
                       Apply for Leave
                    </Button>
                  )}
               </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <Table hover size="sm" className="mb-0 w-100 text-nowrap align-middle">
                    <thead style={{ backgroundColor: "#f8f9fa", color: "#6c757d" }}>
                      <tr>
                        <th className="px-3 py-2 fw-bold" style={{fontSize: "0.85rem"}}>#</th>
                        <th className="px-3 py-2 fw-bold" style={{fontSize: "0.85rem"}}>Type</th>
                        <th className="px-3 py-2 fw-bold" style={{fontSize: "0.85rem"}}>Description</th>
                        <th className="px-3 py-2 fw-bold" style={{fontSize: "0.85rem"}}>Applied On</th>
                        <th className="px-3 py-2 fw-bold text-center" style={{fontSize: "0.85rem"}}>Duration</th>
                        <th className="px-3 py-2 fw-bold" style={{fontSize: "0.85rem"}}>Period</th>
                        <th className="px-3 py-2 fw-bold text-center" style={{fontSize: "0.85rem"}}>Status</th>
                        <th className="px-3 py-2 fw-bold text-center" style={{fontSize: "0.85rem"}}>Proof</th>
                        <th className="px-3 py-2 fw-bold text-center" style={{fontSize: "0.85rem"}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((lv, idx) => (
                        <tr key={lv.id}>
                          <td className="px-3 text-muted" style={{fontSize: "0.85rem"}}>
                              {rowsPerPage === "All" ? idx + 1 : (currentPage - 1) * rowsPerPage + idx + 1}
                          </td>
                          <td className="px-3 fw-semibold text-dark">{lv.type}</td>
                          <td className="px-3 text-start" style={{maxWidth: "200px", whiteSpace: "normal"}}>
                            <div className="d-flex align-items-center">
                                <span className="text-truncate d-inline-block" style={{maxWidth: "150px"}}>
                                    {lv.description}
                                </span>
                                {lv.description.length > 20 && (
                                     <InfoCircle className="text-primary ms-2 flex-shrink-0" style={{cursor: "pointer", fontSize: "0.9rem"}} onClick={() => openDescriptionModal(lv.description)} />
                                )}
                            </div>
                          </td>
                          <td className="px-3 text-muted small">{lv.appliedOn}</td>
                          <td className="px-3 text-center">{lv.duration} Day(s)</td>
                          <td className="px-3 small">
                            {lv.startDate} <i className="bi bi-arrow-right-short text-muted"></i> {lv.endDate}
                          </td>
                          <td className="px-3 text-center">{getStatusBadge(lv.status)}</td>
                          <td className="px-3 text-center">
                            {lv.prescriptionImg ? (
                            <Button 
                                variant="light" size="sm" 
                                className="border text-primary"
                                style={{padding: "2px 6px"}} 
                                onClick={() => handleViewImage(lv.prescriptionImg)}
                                title="View Prescription"
                            >
                                <ImageIcon />
                            </Button>
                            ) : (
                            <span className="text-muted small">--</span>
                            )}
                          </td>
                          <td className="px-3 text-center">
                            {lv.status.toUpperCase() === "PENDING" ? (
                              <Button variant="outline-danger" size="sm" style={{padding: "2px 6px"}} onClick={() => handleDelete(lv.id)} title="Delete Request">
                                <Trash />
                              </Button>
                            ) : (
                              <span className="text-muted small"><i className="bi bi-lock-fill"></i></span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* PAGINATION */}
                {rowsPerPage !== "All" && paginatedData.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                    <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrevious}>Previous</Button>
                    <span className="small text-muted">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
            )}
          </CardContainer>

          {/* PRESCRIPTION MODAL */}
          <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
            <Modal.Header closeButton className="py-2 bg-light"><Modal.Title className="fs-6">Medical Proof</Modal.Title></Modal.Header>
            <Modal.Body className="text-center p-4 bg-dark">
               {selectedImage && (
                 <img src={selectedImage} alt="Prescription" className="img-fluid rounded shadow" style={{maxHeight: "80vh"}} />
               )}
            </Modal.Body>
          </Modal>


          {/* DESCRIPTION MODAL */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton className="py-2">
              <Modal.Title className="fs-6 fw-bold">Leave Reason</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 bg-light">
              <p className="mb-0 text-break text-dark">{modalDescription}</p>
            </Modal.Body>
            <Modal.Footer className="py-1 border-0">
              <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>

        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;