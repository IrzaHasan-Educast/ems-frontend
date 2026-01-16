import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar"; // Consistent Navbar
import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading";
import { Trash, FileEarmarkText, Eye } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { Table, Form, Button, InputGroup, FormControl, Badge, Modal, Spinner, Row, Col } from "react-bootstrap";
import { getCurrentUser } from "../../api/workSessionApi";
import { getLeavesByEmployee, deleteLeaveById } from "../../api/leaveApi";
import dayjs from "dayjs";
import jwtHelper from "../../utils/jwtHelper";

const LeaveHistory = ({ onLogout }) => {
  // 1. JWT & User Info
  const token = localStorage.getItem("token");
  const role = jwtHelper.getRoleFromToken(token);
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalDescription, setModalDescription] = useState("");

  // Data States
  const [employee, setEmployee] = useState({ fullName: "", id: null });
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- HELPERS ---
  const formatDate = (dateStr) => (dateStr ? dayjs(dateStr).format("DD-MM-YYYY") : "--");
  const formatDateTime = (dateStr) => (dateStr ? dayjs(dateStr).format("DD-MM-YYYY hh:mm A") : "--");
  const getMonthName = (dateStr) => (dateStr ? dayjs(dateStr).format("MMMM") : "");

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
          rawAppliedOn: lv.appliedOn, // Sorting ke liye
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
      setLoading(false); // Stop loading here
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const res = await getCurrentUser();
        setEmployee({ fullName: res.data.fullName, id: res.data.employeeId });
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
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar} />

      <div className="flex-grow-1">
        <TopNavbar 
            toggleSidebar={toggleSidebar} 
            username={employee.fullName} 
            role={role} 
            onLogout={onLogout}
        />

        <div className="p-3 container-fluid">
          <PageHeading
            title="My Leave History"
            buttonText="Apply Leave"
            onButtonClick={() => navigate("/employee/leave/apply")}
          />

          {/* FILTERS CARD */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col lg={3} md={6}>
                <InputGroup size="sm">
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <FormControl
                    placeholder="Search type, date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </Col>

              <Col lg={2} md={6}>
                <Form.Select size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {uniqueMonths.map((m) => <option key={m}>{m}</option>)}
                </Form.Select>
              </Col>

              <Col lg={2} md={6}>
                <Form.Select size="sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </Form.Select>
              </Col>

               <Col lg={2} md={6}>
                <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
                   {[10, 25, 50, "All"].map(n => <option key={n} value={n}>{n} per page</option>)}
                </Form.Select>
              </Col>

              <Col lg={3} md={12} className="d-flex justify-content-end">
                <Button variant="secondary" size="sm" onClick={handleReset}>Reset Filters</Button>
              </Col>
            </Row>
          </CardContainer>

          {/* TABLE SECTION */}
          <CardContainer className="mt-3">
            {loading ? (
               <div className="text-center p-5">
                 <Spinner animation="border" variant="warning" />
                 <p className="mt-2 text-muted">Loading your leave records...</p>
               </div>
            ) : filteredLeaves.length === 0 ? (
               <div className="text-center p-5">
                  <div className="text-muted mb-3" style={{fontSize: "2rem"}}><i className="bi bi-inbox"></i></div>
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
                <div className="table-responsive">
                  <Table bordered hover size="sm" className="mb-0">
                    <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                      <tr>
                        <th style={{padding: "8px"}}>#</th>
                        <th style={{padding: "8px"}}>Type</th>
                        <th style={{padding: "8px"}}>Description</th>
                        <th style={{padding: "8px"}}>Applied On</th>
                        <th style={{padding: "8px"}}>Duration</th>
                        <th style={{padding: "8px"}}>Period</th>
                        <th style={{padding: "8px"}}>Status</th>
                        <th style={{padding: "8px"}}>Proof</th>
                        <th style={{padding: "8px"}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((lv, idx) => (
                        <tr key={lv.id} style={{ textAlign: "center", verticalAlign: "middle" }}>
                          <td>{rowsPerPage === "All" ? idx + 1 : (currentPage - 1) * rowsPerPage + idx + 1}</td>
                          <td className="fw-semibold">{lv.type}</td>
                          <td className="text-start" style={{maxWidth: "200px"}}>
                            {lv.description.length > 25 ? (
                                <span>
                                  {lv.description.substring(0, 25)}... 
                                  <i className="bi bi-info-circle text-primary ms-1" style={{cursor: "pointer"}} onClick={() => openDescriptionModal(lv.description)}></i>
                                </span>
                            ) : lv.description}
                          </td>
                          <td className="small">{lv.appliedOn}</td>
                          <td>{lv.duration} Day(s)</td>
                          <td className="small">
                            {lv.startDate} <i className="bi bi-arrow-right-short text-muted"></i> {lv.endDate}
                          </td>
                          <td>{getStatusBadge(lv.status)}</td>
                          <td>
                            {lv.prescriptionImg ? (
                              <a href={lv.prescriptionImg} target="_blank" rel="noreferrer" className="btn btn-outline-info btn-sm py-0 px-2">
                                <i className="bi bi-file-earmark-image"></i>
                              </a>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {lv.status.toUpperCase() === "PENDING" ? (
                              <Button variant="outline-danger" size="sm" style={{padding: "2px 6px"}} onClick={() => handleDelete(lv.id)} title="Delete Request">
                                <Trash />
                              </Button>
                            ) : (
                              <span className="text-muted" style={{fontSize: "0.8rem"}}>Locked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* PAGINATION */}
                {rowsPerPage !== "All" && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrevious}>Previous</Button>
                    <span className="small text-muted">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
            )}
          </CardContainer>

          {/* DESCRIPTION MODAL */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton className="py-2">
              <Modal.Title className="fs-6 fw-bold">Leave Reason</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-3">
              <p className="mb-0 text-break">{modalDescription}</p>
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