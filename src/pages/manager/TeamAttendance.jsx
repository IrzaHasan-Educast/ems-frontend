import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getManagerAttendanceHistory } from "../../api/attendanceApi"; 
import { getMyShift } from "../../api/shiftApi"; // Ensure this API exists
import { FileEarmarkText, Gear } from "react-bootstrap-icons";
import * as XLSX from "xlsx";
import { jwtHelper } from "../../utils/jwtHelper";

const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "employeeName", label: "Employee" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "present", label: "Status" },
  { key: "shift", label: "Shift" },
  { key: "assignedShift", label: "Assigned Shift" },
];

const TeamAttendance = ({ onLogout }) => {
  const token = localStorage.getItem("token");
  
  // States
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentBusinessDate, setCurrentBusinessDate] = useState(null); // Calculated Date

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  
  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Columns
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(allColumns.map(c => c.key));

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- LOGIC: CALCULATE BUSINESS DATE (Night Shift Handling) ---
  const calculateBusinessDate = (shiftData) => {
    const now = new Date();
    
    // Agar shift data nahi hai, to normal calendar date use karo
    if (!shiftData || !shiftData.startsAt || !shiftData.endsAt) {
      return now.toISOString().split('T')[0];
    }

    const [startH] = shiftData.startsAt.split(':').map(Number);
    const [endH] = shiftData.endsAt.split(':').map(Number);
    const currentH = now.getHours();

    // Night Shift Detection (e.g., Start 21:00, End 06:00)
    if (startH > endH) {
      // SCENARIO 1: Subah ho gayi hai (e.g., 04:00 AM)
      // Shift kal shuru hui thi. Humen "Yesterday" ki date chahiye.
      // Logic: Agar abhi ka waqt dopahar 12 baje se pehle ka hai, to ye kal wali shift ka hissa hai.
      if (currentH < 12) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      }
      // SCENARIO 2: Raat ho rahi hai par shift start se pehle (Early Login)
      // e.g., Shift 21:00 hai, banda 20:00 (8 PM) par dekh raha hai.
      // Ye "Aaj" ki hi date hai. (Default behavior)
    }

    // Normal Day Shift ya Evening Shift (Start < End)
    return now.toISOString().split('T')[0];
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Shift Details to determine "Today"
        let businessDate = new Date().toISOString().split('T')[0];
        try {
          const shiftRes = await getMyShift(); // Call /api/v1/shifts/my
          businessDate = calculateBusinessDate(shiftRes.data);
        } catch (error) {
          console.warn("Could not fetch shift details, defaulting to calendar date.");
        }
        setCurrentBusinessDate(businessDate);

        // 2. Fetch Attendance
        const res = await getManagerAttendanceHistory();
        
        const formatted = res.data.map((a, index) => ({
          id: index + 1,
          employeeName: a.employeeName || "Unknown",
          date: a.attendanceDate, 
          time: a.attendanceTime, 
          createdAt: a.createdAt,
          present: a.present ? "Present" : "Absent",
          shift: a.shift,
          rawDate: a.attendanceDate, // YYYY-MM-DD from Backend
          assignedShift: a.assignedShift,
        }));

        // Sort: Latest first
        formatted.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

        setRecords(formatted);
        setFiltered(formatted);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // --- HELPERS (Formatting) ---
  const formatDateDDMMYYYY = (isoDate) => {
    if (!isoDate) return "--";
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-GB").replace(/\//g, "-");
  };

  const formatTime = (timeStr, createdAt) => {
    let d;
    if (timeStr) {
      d = new Date(`1970-01-01T${timeStr}`);
    } else if (createdAt) {
      d = new Date(createdAt);
    } else {
      return "--";
    }
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const beautifyShift = (shift) => {
    if (!shift) return "--";
    return shift.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  };

  // --- FILTERING ---
  useEffect(() => {
    const term = searchTerm.toLowerCase();

    const f = records.filter((r) => {
      const matchesSearch = [r.employeeName, r.date, r.present].join(" ").toLowerCase().includes(term);
      const matchesEmployee = selectedEmployee ? r.employeeName === selectedEmployee : true;
      const matchesMonth = selectedMonth ? new Date(r.rawDate).getMonth() + 1 === parseInt(selectedMonth) : true;
      return matchesSearch && matchesEmployee && matchesMonth;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [searchTerm, selectedEmployee, selectedMonth, records]);

  // --- HANDLERS ---
  const handleReset = () => {
    setSearchTerm("");
    setSelectedEmployee("");
    setSelectedMonth("");
    setRowsPerPage(10);
    setCurrentPage(1);
    setSelectedColumns(allColumns.map(c => c.key));
  };

  const handleExport = () => {
    const fileName = prompt("Enter file name:", "Team_Attendance");
    if (!fileName) return;

    const headers = selectedColumns.map(colKey => {
      const col = allColumns.find(c => c.key === colKey);
      return col ? col.label : colKey;
    });

    const data = filtered.map((r, idx) =>
      selectedColumns.map(col => {
        switch (col) {
          case "sno": return idx + 1;
          case "employeeName": return r.employeeName;
          case "date": return formatDateDDMMYYYY(r.date);
          case "time": return formatTime(r.time, r.createdAt);
          case "present": return r.present;
          case "shift": return beautifyShift(r.shift);
          case "assignedShift": return beautifyShift(r.assignedShift);
          default: return "";
        }
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(k => k !== key));
    } else {
      setSelectedColumns(allColumns.filter(c => selectedColumns.includes(c.key) || c.key === key).map(c => c.key));
    }
  };

  // --- FILTER RECORDS FOR "TODAY" VIEW ---
  // Compare record.rawDate with calculated currentBusinessDate
  const todayRecords = filtered.filter(r => r.rawDate === currentBusinessDate);

  // Pagination Logic
  const paginatedRecords = rowsPerPage === "All" ? filtered : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const uniqueEmployees = [...new Set(records.map((r) => r.employeeName))];

  // Render Cell Helper
  const cellStyle = { padding: "6px 8px", verticalAlign: "middle", fontSize: "0.9rem", whiteSpace: "nowrap" };
  const renderCell = (col, r, index) => {
    switch (col) {
      case "sno": return rowsPerPage === "All" ? index + 1 : (currentPage - 1) * rowsPerPage + index + 1;
      case "employeeName": return <span className="fw-semibold text-dark">{r.employeeName}</span>;
      case "date": return formatDateDDMMYYYY(r.date);
      case "time": return formatTime(r.time, r.createdAt);
      case "present": return <Badge bg={r.present === "Present" ? "success" : "danger"} style={{fontSize: "0.75rem"}}>{r.present}</Badge>;
      case "shift": return beautifyShift(r.shift);
      case "assignedShift": return beautifyShift(r.assignedShift);
      default: return "--";
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar
                  toggleSidebar={toggleSidebar}
                  username={localStorage.getItem("name")}
                  role={localStorage.getItem("role") || "Manager"}
                />
        <div className="p-3 container-fluid">
          <PageHeading title="Team Attendance" />

          {/* FILTERS */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col lg={3} md={6}>
                <Form.Control size="sm" type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </Col>
              <Col lg={3} md={6}>
                <Form.Select size="sm" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                  <option value="">All Employees</option>
                  {uniqueEmployees.map((emp, i) => <option key={i} value={emp}>{emp}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"]
                  .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
                  {[10, 25, 50, "All"].map((n) => <option key={n} value={n}>{n} per page</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} className="d-flex justify-content-end gap-2">
                <Button variant="secondary" size="sm" onClick={handleReset}>Reset</Button>
                <Button variant="outline-primary" size="sm" onClick={() => setShowColumnsModal(true)}><Gear /></Button>
                <Button variant="success" size="sm" onClick={handleExport}><FileEarmarkText /></Button>
              </Col>
            </Row>
          </CardContainer>

          {/* TODAY'S ATTENDANCE SECTION */}
          {todayRecords.length > 0 && (
            <CardContainer className="mt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold m-0" style={{color: "#055993"}}>
                  <i className="bi bi-calendar-check me-2"></i>Today's Attendance 
                  <small className="text-muted ms-2" style={{fontSize: "0.75rem"}}>
                    ({formatDateDDMMYYYY(currentBusinessDate)})
                  </small>
                </h6>
              </div>
              
              {loading ? (
                <div className="text-center"><Spinner animation="border" size="sm" /></div>
              ) : (
                <div className="table-responsive">
                  <Table bordered hover size="sm" className="mb-0">
                    <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                      <tr>
                        {selectedColumns.map(col => (
                          <th key={col} style={{padding: "8px", whiteSpace: "nowrap"}}>
                            {allColumns.find(c => c.key === col).label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {todayRecords.map((r, idx) => (
                        <tr key={idx} style={{ textAlign: "center", backgroundColor: "#e6f7ff" }}>
                          {selectedColumns.map(col => <td key={col} style={cellStyle}>{renderCell(col, r, idx)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardContainer>
          )}

          {/* ATTENDANCE HISTORY SECTION */}
          <CardContainer className="mt-3">
            <h6 className="fw-bold mb-3" style={{color: "#055993"}}>
              <i className="bi bi-clock-history me-2"></i>Attendance History
            </h6>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "30vh" }}>
                <Spinner animation="border" variant="warning" />
              </div>
            ) : filtered.length > 0 ? (
              <>
                <div className="table-responsive">
                  <Table bordered hover size="sm" className="mb-0">
                    <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                      <tr>
                        {selectedColumns.map(col => (
                          <th key={col} style={{padding: "8px", whiteSpace: "nowrap"}}>
                            {allColumns.find(c => c.key === col).label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.map((r, idx) => (
                        <tr key={idx} style={{ textAlign: "center" }}>
                          {selectedColumns.map(col => <td key={col} style={cellStyle}>{renderCell(col, r, idx)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {rowsPerPage !== "All" && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrevious}>Previous</Button>
                    <span className="small fw-semibold text-muted">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-4 text-muted">No attendance records found</div>
            )}
          </CardContainer>

          {/* COLUMNS MODAL */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)} centered>
            <Modal.Header closeButton><Modal.Title>Select Columns</Modal.Title></Modal.Header>
            <Modal.Body>
              {allColumns.map((col) => (
                <Form.Check key={col.key} type="switch" id={`col-${col.key}`} label={col.label} checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} className="mb-2" />
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="warning" className="text-white" size="sm" onClick={() => setShowColumnsModal(false)}>Done</Button>
            </Modal.Footer>
          </Modal>

        </div>
      </div>
    </div>
  );
};

export default TeamAttendance;