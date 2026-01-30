// src/pages/admin/Attendance.jsx
import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getAllAttendance } from "../../api/attendanceApi";
import { FileEarmarkText, Gear, ArrowCounterclockwise } from "react-bootstrap-icons";
import { getRoles } from "../../api/employeeApi";
import { getCurrentUser } from "../../api/userApi";
import * as XLSX from "xlsx";
import jwtHelper from "../../utils/jwtHelper";

const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "employeeName", label: "Employee" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "present", label: "Present" },
  { key: "assignedShift", label: "Shift" },
];

const Attendance = ({ onLogout }) => {
  const token = localStorage.getItem("token");
  const initialRole = jwtHelper.getRoleFromToken(token);
  
  // States
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [admin, setAdmin] = useState({ name: "", role: initialRole });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // UI
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(allColumns.map(c => c.key));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Calculated Dates for Header
  const [todayWindowStr, setTodayWindowStr] = useState("");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- HELPERS ---
  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "--";
    const d = new Date(`1970-01-01T${timeStr}`);
    return d.toLocaleTimeString("en-US", { hour12: true });
  };

  const beautifyShift = (shift) => {
    if (!shift) return "--";
    return shift.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  };

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const init = async () => {
      try {
        const [rolesRes, userRes, attRes] = await Promise.all([
          getRoles(),
          getCurrentUser(),
          getAllAttendance()
        ]);

        setRoles(rolesRes.data);
        setAdmin({ name: userRes.data.fullName, role: userRes.data.role });

        const formatted = attRes.data.map((a, index) => ({
          id: index + 1,
          employeeName: a.employeeName,
          date: a.attendanceDate, // YYYY-MM-DD
          time: a.attendanceTime, // HH:mm:ss
          present: a.present ? "Present" : "Absent",
          assignedShift: a.assignedShift,
          rawDate: a.attendanceDate,
          rawTime: a.attendanceTime 
        }));

        // Sort by Date + Time Descending
        formatted.sort((a, b) => {
          const dtA = new Date(`${a.rawDate}T${a.rawTime || "00:00:00"}`);
          const dtB = new Date(`${b.rawDate}T${b.rawTime || "00:00:00"}`);
          return dtB - dtA;
        });

        setRecords(formatted);
        setFiltered(formatted);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // --- FILTERING ---
  useEffect(() => {
    const term = searchTerm.toLowerCase();

    const f = records.filter((r) => {
      const matchesSearch = [r.employeeName, r.date, r.time, r.present, r.assignedShift].join(" ").toLowerCase().includes(term);
      const matchesEmployee = selectedEmployee ? r.employeeName === selectedEmployee : true;
      const matchesMonth = selectedMonth ? new Date(r.rawDate).getMonth() + 1 === parseInt(selectedMonth) : true;
      return matchesSearch && matchesEmployee && matchesMonth;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [searchTerm, selectedEmployee, selectedMonth, records]);

  // --- LOGIC: CUSTOM "TODAY" (8 AM - Next Day 6 AM) ---
  const filterTodayRecords = (allRecords) => {
    const now = new Date();
    
    // Start/End Windows
    let startWindow = new Date();
    let endWindow = new Date();

    // Logic: 
    // Agar abhi subha ke 6 baje se pehle ka waqt hai (e.g., 3 AM), 
    // to ye "Kal" wali shift ka hissa hai (Previous Day).
    // Agar 6 baje ke baad hai, to ye "Aaj" wali shift hai.
    
    if (now.getHours() < 6) {
      // Current time is e.g., 03:00 AM (Jan 15).
      // Window Start: Jan 14, 08:00 AM
      // Window End: Jan 15, 06:00 AM
      startWindow.setDate(now.getDate() - 1);
      endWindow = new Date(now);
    } else {
      // Current time is e.g., 09:00 AM (Jan 15).
      // Window Start: Jan 15, 08:00 AM
      // Window End: Jan 16, 06:00 AM
      startWindow = new Date(now);
      endWindow.setDate(now.getDate() + 1);
    }

    // Set Exact Times
    startWindow.setHours(8, 0, 0, 0); // 08:00 AM
    endWindow.setHours(6, 0, 0, 0);   // 06:00 AM (Next Day)

    // Update UI String
    const dateOpts = { month: 'short', day: 'numeric' };
    const label = `${startWindow.toLocaleDateString('en-US', dateOpts)} 8AM - ${endWindow.toLocaleDateString('en-US', dateOpts)} 6AM`;
    if (todayWindowStr !== label) setTodayWindowStr(label);

    return allRecords.filter(r => {
      // Skip incomplete records
      if (!r.rawDate) return false;
      
      // Combine Date & Time for comparison
      // If time is missing (Absent), assume 00:00:00 or skip? 
      // Usually Absent records are marked on the day. Let's use the date + 12:00 PM to place it safely if time missing.
      const timePart = r.rawTime || "12:00:00"; 
      const recordDateTime = new Date(`${r.rawDate}T${timePart}`);
      
      return recordDateTime >= startWindow && recordDateTime <= endWindow;
    });
  };

  const todayRecords = filterTodayRecords(filtered);
  const historyRecords = filtered.filter(r => !todayRecords.includes(r)); // Remaining records

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
    const fileName = prompt("Enter file name:", "Attendance");
    if (!fileName) return;

    const headers = selectedColumns.map(colKey => allColumns.find(c => c.key === colKey)?.label || colKey);
    const data = filtered.map(r => selectedColumns.map(col => {
      if(col === "sno") return r.id;
      if(col === "date") return formatDate(r.date);
      if(col === "time") return formatTime(r.time);
      if(col === "assignedShift") return beautifyShift(r.assignedShift);
      return r[col];
    }));

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) setSelectedColumns(selectedColumns.filter(k => k !== key));
    else setSelectedColumns([...selectedColumns, key]);
  };

  // Pagination for History Table
  const paginatedHistory = rowsPerPage === "All" ? historyRecords : historyRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(historyRecords.length / rowsPerPage);
  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const uniqueEmployees = [...new Set(records.map((r) => r.employeeName))];
  const cellStyle = { padding: "6px 8px", verticalAlign: "middle", fontSize: "0.9rem", whiteSpace: "nowrap" };

  const renderCell = (col, r, index) => {
    switch (col) {
      case "sno": return rowsPerPage === "All" ? index + 1 : (currentPage - 1) * rowsPerPage + index + 1;
      case "employeeName": return <span className="fw-semibold text-dark">{r.employeeName}</span>;
      case "date": return formatDate(r.date);
      case "time": return formatTime(r.time);
      case "present": return <Badge bg={r.present === "Present" ? "success" : "danger"} style={{fontSize: "0.75rem"}}>{r.present}</Badge>;
      case "assignedShift": return beautifyShift(r.assignedShift);
      default: return "--";
    }
  };

  return (
    // Responsive Layout: Full Height & Hidden Overflow for Main
    <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar}/>
      
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <TopNavbar 
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role")}
          onLogout={onLogout}
        />
        
        {/* Scrollable Content Area */}
        <div className="p-3 container-fluid" style={{ overflowY: "auto", flex: 1 }}>
          <PageHeading title="Attendance Records" />

          {/* FILTERS */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col lg={3} md={6} xs={12}>
                <Form.Control size="sm" type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </Col>
              <Col lg={3} md={6} xs={12}>
                <Form.Select size="sm" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                  <option value="">All Employees</option>
                  {uniqueEmployees.map((emp, i) => <option key={i} value={emp}>{emp}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} xs={6}>
                <Form.Select size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} xs={6}>
                <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
                  {[10, 25, 50, "All"].map((n) => <option key={n} value={n}>{n} per page</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} xs={12} className="d-flex justify-content-lg-end justify-content-start gap-2">
                <Button variant="outline-secondary" size="sm" onClick={handleReset}><ArrowCounterclockwise/></Button>
                <Button variant="outline-primary" size="sm" onClick={() => setShowColumnsModal(true)}><Gear /></Button>
                <Button variant="success" size="sm" onClick={handleExport}><FileEarmarkText /></Button>
              </Col>
            </Row>
          </CardContainer>

          {/* TODAY'S ATTENDANCE (8AM - Next 6AM) */}
          <CardContainer className="mt-3 p-0 overflow-hidden">
             <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h6 className="fw-bold m-0 text-primary">
                  <i className="bi bi-calendar-check me-2"></i>Today's Shift
                </h6>
                <Badge bg="info" className="text-dark border">
                   {todayWindowStr || "Calculating..."}
                </Badge>
             </div>

            {loading ? (
              <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>
            ) : todayRecords.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <Table bordered hover size="sm" className="mb-0 w-100 text-nowrap align-middle">
                  <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                    <tr>
                      {selectedColumns.map(col => <th key={col} style={{padding:"8px"}}>{allColumns.find(c => c.key === col)?.label}</th>)}
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
            ) : (
                <div className="p-4 text-center text-muted small">No records found for the current cycle.</div>
            )}
          </CardContainer>

          {/* PAST ATTENDANCE */}
          <CardContainer className="mt-3 p-0 overflow-hidden">
             <div className="p-3 bg-light border-bottom">
                <h6 className="fw-bold m-0 text-primary"><i className="bi bi-clock-history me-2"></i>History</h6>
             </div>
            
            {loading ? (
              <div className="text-center p-4"><Spinner animation="border" variant="warning"/></div>
            ) : paginatedHistory.length > 0 ? (
              <>
                <div style={{ overflowX: "auto" }}>
                  <Table bordered hover size="sm" className="mb-0 w-100 text-nowrap align-middle">
                    <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                      <tr>{selectedColumns.map(col => <th key={col} style={{padding:"8px"}}>{allColumns.find(c => c.key === col)?.label}</th>)}</tr>
                    </thead>
                    <tbody>
                      {paginatedHistory.map((r, idx) => (
                        <tr key={idx} style={{ textAlign: "center" }}>
                          {selectedColumns.map(col => <td key={col} style={cellStyle}>{renderCell(col, r, idx)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {rowsPerPage !== "All" && (
                  <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                    <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrevious}>Previous</Button>
                    <span className="small text-muted">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
            ) : (
                <div className="p-4 text-center text-muted">No history records found.</div>
            )}
          </CardContainer>

          {/* COLUMNS MODAL */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)} centered size="sm">
            <Modal.Header closeButton><Modal.Title>Select Columns</Modal.Title></Modal.Header>
            <Modal.Body>
              {allColumns.map((col) => (
                <Form.Check key={col.key} type="switch" id={`col-${col.key}`} label={col.label} checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} className="mb-2" />
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" size="sm" onClick={() => setShowColumnsModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>

        </div>
      </div>
    </div>
  );
};

export default Attendance;