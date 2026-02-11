import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge, InputGroup } from "react-bootstrap";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getAllWorkSessions } from "../../api/workSessionApi";
import { FileEarmarkText, Gear } from "react-bootstrap-icons";
import { getCurrentUser } from "../../api/userApi";
import * as XLSX from "xlsx";
import jwtHelper from "../../utils/jwtHelper";
import { formatTimeAMPM, parseApiDate } from "../../utils/time"; 

const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "employeeName", label: "Employee" },
  { key: "assignedShift", label: "Shift" },
  { key: "date", label: "Date" },
  { key: "day", label: "Day" },
  { key: "clockIn", label: "Clock In" },
  { key: "clockOut", label: "Clock Out" },
  { key: "totalHours", label: "Total Hours" },
  { key: "workingHours", label: "Working Hours" },
  { key: "breakHours", label: "Break Hours" },
  { key: "status", label: "Status" },
];

const defaultVisibleColumns = ["sno", "employeeName", "assignedShift", "date", "clockIn", "clockOut", "totalHours", "workingHours", "status"];

// Helper function to clean up shift names
const normalizeShift = (shiftName) => {
  if (!shiftName) return "";
  return shiftName.replace(/\s*\(.*?\)\s*/g, "").trim(); 
};

const WorkSessions = () => {
  const token = localStorage.getItem("token");
  const initialRole = jwtHelper.getRoleFromToken(token);
  
  const [sessions, setSessions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState({ name: "", role: initialRole });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState(""); 
  
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(defaultVisibleColumns);


  const formatShortDate = (val) => {
     const d = parseApiDate(val);
     if(!d) return "--";
     const day = d.getDate().toString().padStart(2, '0');
     const month = d.toLocaleString('en-US', { month: 'short' });
     const year = d.getFullYear().toString().slice(-2); 
     return `${day}-${month}-${year}`; 
  };

  // --- HELPERS: Duration ---
  const formatDurationFromISO = (iso) => {
    if (!iso) return "0h 0m";
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0h 0m";
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const formatDuration = (hoursDecimal) => {
    if (!hoursDecimal || isNaN(hoursDecimal)) return "0h 0m";
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const calculateDynamicHours = (session) => {
    const now = new Date();
    const clockIn = new Date(session.clockInTime);
    let totalMs = now - clockIn; 
    let totalHoursDecimal = totalMs / (1000 * 60 * 60);

    const breakISO = session.idleTime;
    let breakHoursDecimal = 0;

    if (breakISO) {
      const match = breakISO.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        const h = parseInt(match[1] || 0);
        const m = parseInt(match[2] || 0);
        const s = parseInt(match[3] || 0);
        breakHoursDecimal = h + m/60 + s/3600;
      }
    }

    let workingHours = totalHoursDecimal - breakHoursDecimal;

    return {
      totalHours: formatDuration(totalHoursDecimal),
      workingHours: formatDuration(Math.max(workingHours, 0)),
      breakHours: formatDurationFromISO(breakISO),
    };
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await getCurrentUser();
        setAdmin({ name: userRes.data.fullName, role: userRes.data.role });

        const res = await getAllWorkSessions();
        const formatted = res.data.map((s) => {
          let displayStatus = s.status;
          let totalHours = "";
          let workingHours = "";
          let breakHours = formatDurationFromISO(s.idleTime);

          if (displayStatus === "Working" || displayStatus === "On Break") {
            const dyn = calculateDynamicHours(s);
            totalHours = dyn.totalHours;
            workingHours = dyn.workingHours;
            if (displayStatus === "On Break") breakHours = dyn.breakHours;
          } else {
            totalHours = formatDurationFromISO(s.totalSessionHours);
            workingHours = formatDurationFromISO(s.totalWorkingHours);
          }

          const dateObj = new Date(s.clockInTime);

          return {
            ...s,
            rawDate: dateObj,
            date: formatShortDate(s.clockInTime), 
            day: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
            clockIn: formatTimeAMPM(s.clockInTime),
            clockOut: formatTimeAMPM(s.clockOutTime),
            totalHours,
            workingHours,
            breakHours,
            displayStatus,
            assignedShift: s.assignedShift || "Default", 
          };
        });

        formatted.sort((a, b) => b.rawDate - a.rawDate);

        setSessions(formatted);
        setFiltered(formatted);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- FILTERING (Updated for Universal Search) ---
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    
    let f = sessions.filter((s) => {
      // ✅ COMBINE ALL FIELDS FOR SEARCH
      // Checks: Employee Name, Shift, Date, Day, ClockIn, ClockOut, Hours, Status
      const searchableText = [
        s.employeeName, 
        s.assignedShift, 
        s.date, 
        s.day, 
        s.clockIn, 
        s.clockOut, 
        s.totalHours, 
        s.workingHours, 
        s.displayStatus
      ].join(" ").toLowerCase();

      const matchesSearch = searchableText.includes(term);

      const matchesEmployee = selectedEmployee ? s.employeeName === selectedEmployee : true;
      const matchesMonth = selectedMonth ? (s.rawDate.getMonth() + 1) === parseInt(selectedMonth) : true;
      const matchesStatus = statusFilter ? s.displayStatus === statusFilter : true;
      const matchesShift = shiftFilter ? normalizeShift(s.assignedShift) === shiftFilter : true;

      return matchesSearch && matchesEmployee && matchesMonth && matchesStatus && matchesShift;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [searchTerm, selectedEmployee, selectedMonth, statusFilter, shiftFilter, sessions]);

  // --- HANDLERS ---
  const handleReset = () => {
    setSearchTerm("");
    setSelectedEmployee("");
    setSelectedMonth("");
    setStatusFilter("");
    setShiftFilter("");
    setRowsPerPage(10);
    setCurrentPage(1);
    setSelectedColumns(defaultVisibleColumns);
  };

  const handleExport = () => {
    const fileName = prompt("Enter file name:", "WorkSessions");
    if (!fileName) return;

    const headers = selectedColumns.map(k => allColumns.find(c => c.key === k).label);
    const data = filtered.map((s, idx) => 
      selectedColumns.map(col => {
        switch(col) {
          case "sno": return idx + 1;
          case "status": return s.displayStatus;
          default: return s[col] || "--";
        }
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sessions");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
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

  // --- PAGINATION ---
  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const displayed = rowsPerPage === "All" ? filtered : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Unique Lists
  const uniqueEmployees = [...new Set(sessions.map(s => s.employeeName))].sort();
  const uniqueShifts = [...new Set(sessions.map(s => normalizeShift(s.assignedShift)).filter(Boolean))].sort();

  // --- RENDER CELL ---
  const renderCell = (col, s, idx) => {
    switch (col) {
      case "sno": return rowsPerPage === "All" ? idx + 1 : (currentPage - 1) * rowsPerPage + idx + 1;
      case "employeeName": return <span className="fw-bold">{s.employeeName}</span>;
      case "assignedShift": return <span bg="info" text="dark" className="fw-normal">{s.assignedShift}</span>;
      case "status":
        const statusMap = {
          "Completed": "success",
          "Working": "primary",
          "On Break": "warning",
          "Invalid Clocked Out": "danger",
          "Auto Clocked Out": "info",
          "Early Clocked Out": "secondary"
        };
        return <Badge bg={statusMap[s.displayStatus] || "secondary"}>{s.displayStatus}</Badge>;
      default: return s[col];
    }
  };

  return (
    <>
        <div className="p-3 container-fluid">
          <PageHeading title="All Work Sessions" />

          {/* FILTERS */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col lg={3} md={6}>
                <InputGroup size="sm">
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <Form.Control placeholder="Search everything..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </InputGroup>
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                  <option value="">All Employees</option>
                  {uniqueEmployees.map((emp, i) => <option key={i} value={emp}>{emp}</option>)}
                </Form.Select>
              </Col>
              
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={shiftFilter} onChange={e => setShiftFilter(e.target.value)}>
                  <option value="">All Shifts</option>
                  {uniqueShifts.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </Form.Select>
              </Col>

              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Working">Working</option>
                  <option value="On Break">On Break</option>
                  <option value="Completed">Completed</option>
                  <option value="Auto Clocked Out">Auto Clocked Out</option>
                  <option value="Invalid Clocked Out">Invalid Clocked Out</option>
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
                <Button variant="outline-primary" size="sm" onClick={() => setShowColumnsModal(true)}><Gear /></Button>
                <Button variant="success" size="sm" onClick={handleExport}><FileEarmarkText /></Button>
            </div>
          </CardContainer>

          {/* TABLE */}
          <CardContainer className="mt-3" style={{ padding: "0" }}>
            {loading ? (
              <div className="text-center p-5"><Spinner animation="border" variant="warning" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center p-5 text-muted">No sessions found.</div>
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
                      {displayed.map((s, idx) => (
                        <tr key={s.id} style={{ textAlign: "center", verticalAlign: "middle" }}>
                          {selectedColumns.map(col => (
                            <td key={col} style={{padding: "6px", fontSize: "0.9rem"}}>{renderCell(col, s, idx)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* PAGINATION */}
                {rowsPerPage !== "All" && displayed.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-3">
                    <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrev}>Previous</Button>
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

        </div>
      </>
  );
};

export default WorkSessions;