import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getManagerAttendanceHistory } from "../../api/attendanceApi"; 
import { getMyShift } from "../../api/shiftApi"; 
import { FileEarmarkText, Gear, ArrowCounterclockwise } from "react-bootstrap-icons";
import * as XLSX from "xlsx";
import jwtHelper from "../../utils/jwtHelper";

const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "employeeName", label: "Employee" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "present", label: "Status" },
  { key: "assignedShift", label: "Shift" },
];

const TeamAttendance = ({ onLogout }) => {
  // States
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Calculated Window State
  const [shiftWindow, setShiftWindow] = useState({ start: null, end: null, label: "Loading..." });

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

  // --- 1. DATA FETCHING & LOGIC ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // A. Fetch Attendance & Shift in Parallel
        const [attRes, shiftRes] = await Promise.all([
          getManagerAttendanceHistory(),
          getMyShift().catch(err => ({ data: null })) // Handle if shift api fails
        ]);

        // --- B. Process Shift Logic (Start -1hr to End +1hr) ---
        const now = new Date();
        let wStart = new Date();
        let wEnd = new Date();
        let label = "Standard Day";

        const shift = shiftRes.data;

        if (shift && shift.startsAt && shift.endsAt) {
          const [sH, sM] = shift.startsAt.split(':').map(Number);
          const [eH, eM] = shift.endsAt.split(':').map(Number);
          const PADDING_HOURS = 1;

          // Check for Night Shift (Start > End, e.g., 22:00 to 06:00)
          if (sH > eH) {
            // Logic: If current time is before the "Late End" (e.g. 7 AM), 
            // then we are in the shift that started Yesterday.
            // Otherwise, we are in the shift that starts Today.
            if (now.getHours() < (eH + PADDING_HOURS)) {
               wStart.setDate(now.getDate() - 1); // Yesterday
               wEnd = new Date(now); // Today
            } else {
               wStart = new Date(now); // Today
               wEnd.setDate(now.getDate() + 1); // Tomorrow
            }
          } else {
            // Day Shift (e.g., 10:00 to 18:00) -> Both are Today
            wStart = new Date(now);
            wEnd = new Date(now);
          }

          // Apply Time with Padding
          wStart.setHours(sH - PADDING_HOURS, sM, 0, 0);
          wEnd.setHours(eH + PADDING_HOURS, eM, 59, 999);

          // Format Label for UI
          const opts = { month: 'short', day: 'numeric', hour: 'numeric', minute:'2-digit', hour12: true };
          label = `${wStart.toLocaleString('en-US', opts)} - ${wEnd.toLocaleString('en-US', opts)}`;
        } else {
          // Fallback if no shift assigned: 00:00 to 23:59 Today
          wStart.setHours(0, 0, 0, 0);
          wEnd.setHours(23, 59, 59, 999);
          label = `Today (${new Date().toLocaleDateString()})`;
        }

        setShiftWindow({ start: wStart, end: wEnd, label });

        // --- C. Process Attendance Records ---
        const formatted = attRes.data.map((a, index) => ({
          id: index + 1,
          employeeName: a.employeeName || "Unknown",
          date: a.attendanceDate, 
          time: a.attendanceTime, 
          createdAt: a.createdAt,
          present: a.present ? "Present" : "Absent",
          assignedShift: a.assignedShift,
          // Create a full Date object for sorting & filtering
          fullDateTime: new Date(`${a.attendanceDate}T${a.attendanceTime || "00:00:00"}`)
        }));

        // Sort: Latest first
        formatted.sort((a, b) => b.fullDateTime - a.fullDateTime);

        setRecords(formatted);
        setFiltered(formatted);
        
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // --- HELPERS ---
  const formatDateDDMMYYYY = (isoDate) => {
    if (!isoDate) return "--";
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-GB").replace(/\//g, "-");
  };

  const formatTime = (timeStr, createdAt) => {
    let d;
    if (timeStr) d = new Date(`1970-01-01T${timeStr}`);
    else if (createdAt) d = new Date(createdAt);
    else return "--";
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
      const matchesMonth = selectedMonth ? r.fullDateTime.getMonth() + 1 === parseInt(selectedMonth) : true;
      return matchesSearch && matchesEmployee && matchesMonth;
    });
    setFiltered(f);
    setCurrentPage(1);
  }, [searchTerm, selectedEmployee, selectedMonth, records]);

  // --- SEPARATE TODAY vs HISTORY ---
  // Filter based on the calculated Shift Window
  const todayRecords = filtered.filter(r => 
    shiftWindow.start && shiftWindow.end && 
    r.fullDateTime >= shiftWindow.start && 
    r.fullDateTime <= shiftWindow.end
  );

  const historyRecords = filtered.filter(r => !todayRecords.includes(r));

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

  // Pagination
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
      case "date": return formatDateDDMMYYYY(r.date);
      case "time": return formatTime(r.time, r.createdAt);
      case "present": return <Badge bg={r.present === "Present" ? "success" : "danger"} style={{fontSize: "0.75rem"}}>{r.present}</Badge>;
      case "assignedShift": return beautifyShift(r.assignedShift);
      default: return "--";
    }
  };

  return (
    <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar}/>
      
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <TopNavbar
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role") || "Manager"}
        />
        <div className="p-3 container-fluid" style={{ overflowY: "auto", flex: 1 }}>
          <PageHeading title="Team Attendance" />

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
              <Col lg={2} md={4} sm={6} xs={6}>
                <Form.Select size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"]
                  .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6} xs={6}>
                <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
                  {[10, 25, 50, "All"].map((n) => <option key={n} value={n}>{n} per page</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} xs={12} className="d-flex justify-content-lg-end justify-content-start gap-2">
                <Button variant="outline-secondary" size="sm" onClick={handleReset} title="Reset"><ArrowCounterclockwise /></Button>
                <Button variant="outline-primary" size="sm" onClick={() => setShowColumnsModal(true)} title="Columns"><Gear /></Button>
                <Button variant="success" size="sm" onClick={handleExport} title="Export"><FileEarmarkText /></Button>
              </Col>
            </Row>
          </CardContainer>

          {/* TODAY'S ATTENDANCE */}
          <CardContainer className="mt-3 p-0 overflow-hidden">
            <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h6 className="fw-bold m-0 text-primary">
                <i className="bi bi-calendar-check me-2"></i>Today's Attendance 
              </h6>
              <Badge bg="info" className="text-dark border shadow-sm">
                <i className="bi bi-clock me-1"></i> {shiftWindow.label}
              </Badge>
            </div>
            
            {loading ? (
              <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>
            ) : todayRecords.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <Table bordered hover size="sm" className="mb-0 w-100 text-nowrap align-middle">
                  <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                    <tr>
                      {selectedColumns.map(col => (
                        <th key={col} style={{padding: "8px", fontSize: "0.85rem"}}>
                          {allColumns.find(c => c.key === col)?.label || col}
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
            ) : (
                <div className="p-4 text-center text-muted small">
                    <i className="bi bi-info-circle me-2"></i> No records found for the current shift cycle.
                </div>
            )}
          </CardContainer>

          {/* ATTENDANCE HISTORY */}
          <CardContainer className="mt-3 p-0 overflow-hidden">
            <div className="p-3 bg-light border-bottom">
                <h6 className="fw-bold m-0 text-primary">
                  <i className="bi bi-clock-history me-2"></i>History
                </h6>
            </div>

            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "30vh" }}>
                <Spinner animation="border" variant="warning" />
              </div>
            ) : paginatedHistory.length > 0 ? (
              <>
                <div style={{ overflowX: "auto" }}>
                  <Table bordered hover size="sm" className="mb-0 w-100 text-nowrap align-middle">
                    <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                      <tr>
                        {selectedColumns.map(col => (
                          <th key={col} style={{padding: "8px", fontSize: "0.85rem"}}>
                            {allColumns.find(c => c.key === col)?.label || col}
                          </th>
                        ))}
                      </tr>
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
                    <span className="small fw-semibold text-muted">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-4 text-muted">No attendance history found</div>
            )}
          </CardContainer>

          {/* COLUMNS MODAL */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)} centered scrollable size="sm">
            <Modal.Header closeButton><Modal.Title>Select Columns</Modal.Title></Modal.Header>
            <Modal.Body>
              <Form>
                {allColumns.map((col) => (
                  <Form.Check key={col.key} type="switch" id={`col-${col.key}`} label={col.label} checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} className="mb-2" />
                ))}
              </Form>
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

export default TeamAttendance;