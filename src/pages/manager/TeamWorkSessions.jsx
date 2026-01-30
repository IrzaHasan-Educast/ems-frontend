import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge } from "react-bootstrap";
import Sidebar from "../../components/Sidebar"; 
import TopNavbar from "../../components/Navbar"; 
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getManagerWorkSessionHistory } from "../../api/workSessionApi"; 
import { FileEarmarkText, Gear, ArrowCounterclockwise } from "react-bootstrap-icons";
import * as XLSX from "xlsx";
import jwtHelper from "../../utils/jwtHelper";

const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "employeeName", label: "Employee" },
  { key: "date", label: "Date" },
  { key: "clockIn", label: "Clock In" },
  { key: "clockOut", label: "Clock Out" },
  { key: "totalHours", label: "Total Hours" },
  { key: "workingHours", label: "Working Hours" },
  { key: "breakHours", label: "Break Hours" },
  { key: "status", label: "Status" },
];

const TeamWorkSessions = ({ onLogout }) => {
  const [sessions, setSessions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Column Management State
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(allColumns.map(c => c.key));

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- TIME & DATE HELPERS ---
  const formatDateDDMMYYYY = (isoDate) => {
    if (!isoDate) return "--";
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-GB").replace(/\//g, "-");
  };

  const formatTime = (d) => {
    if (!d) return "--";
    return new Date(d).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
    });
  };

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
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const res = await getManagerWorkSessionHistory();
        
        const formatted = res.data.map((s) => {
          let displayStatus = s.status;
          let totalHours = "";
          let workingHours = "";
          let breakHours = formatDurationFromISO(s.idleTime);

          if (displayStatus === "Working" || displayStatus === "On Break") {
            const dyn = calculateDynamicHours(s);
            totalHours = dyn.totalHours;
            workingHours = dyn.workingHours;
            if (displayStatus === "On Break") {
              breakHours = dyn.breakHours;
            }
          } else {
            totalHours = formatDurationFromISO(s.totalSessionHours);
            workingHours = formatDurationFromISO(s.totalWorkingHours);
          }

          return {
            ...s,
            date: formatDateDDMMYYYY(s.clockInTime),
            clockIn: formatTime(s.clockInTime),
            clockOut: formatTime(s.clockOutTime),
            totalHours,
            workingHours,
            breakHours,
            displayStatus,
          };
        });

        formatted.sort((a, b) => new Date(b.clockInTime) - new Date(a.clockInTime));
        setSessions(formatted);
        setFiltered(formatted);
      } catch (err) {
        console.error("Error fetching team sessions:", err);
      }
      setLoading(false);
    };

    fetchSessions();
  }, []);

  // --- FILTERING ---
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const monthFilter = selectedMonth;
    const empFilter = selectedEmployee;
    const status = statusFilter;

    let f = sessions.filter((s) => {
      const matchesSearch = [s.employeeName, s.status, s.date, s.clockIn, s.clockOut].join(" ").toLowerCase().includes(term);
      const matchesEmployee = empFilter ? s.employeeName === empFilter : true;
      const matchesMonth = monthFilter ? new Date(s.clockInTime).getMonth() + 1 === parseInt(monthFilter) : true;
      const matchesStatus = status ? s.displayStatus === status : true;
      return matchesSearch && matchesEmployee && matchesMonth && matchesStatus;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [searchTerm, selectedEmployee, selectedMonth, statusFilter, sessions]);

  // Handlers
  const handleReset = () => {
    setSearchTerm("");
    setSelectedEmployee("");
    setSelectedMonth("");
    setStatusFilter("");
    setRowsPerPage(10);
    setCurrentPage(1);
    setSelectedColumns(allColumns.map(c => c.key));
  };

  const handleExport = () => {
    const fileName = prompt("Enter file name:", "Team_WorkSessions");
    if (!fileName) return;

    const headers = selectedColumns.map(colKey => {
      const col = allColumns.find(c => c.key === colKey);
      return col ? col.label : colKey;
    });

    const data = filtered.map((s, idx) =>
      selectedColumns.map(col => {
        switch (col) {
          case "sno": return idx + 1;
          case "employeeName": return s.employeeName;
          case "date": return s.date;
          case "clockIn": return s.clockIn;
          case "clockOut": return s.clockOut;
          case "totalHours": return s.totalHours;
          case "workingHours": return s.workingHours;
          case "breakHours": return s.breakHours;
          case "status": return s.displayStatus;
          default: return "";
        }
      })
    );

    const worksheetData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Team Sessions");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(k => k !== key));
    } else {
      setSelectedColumns(allColumns.filter(c => selectedColumns.includes(c.key) || c.key === key).map(c => c.key));
    }
  };

  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const displayed = rowsPerPage === "All" ? filtered : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const uniqueEmployees = [...new Set(sessions.map((s) => s.employeeName))];

  const renderCell = (col, s, index) => {
    switch (col) {
      case "sno": return rowsPerPage === "All" ? index + 1 : (currentPage - 1) * Number(rowsPerPage) + index + 1;
      case "employeeName": return <span className="fw-semibold text-dark">{s.employeeName}</span>;
      case "date": return s.date;
      case "clockIn": return s.clockIn;
      case "clockOut": return s.clockOut;
      case "totalHours": return s.totalHours;
      case "workingHours": return s.workingHours;
      case "breakHours": return s.breakHours;
      case "status":
        return (
          <Badge bg={
              s.displayStatus === "Completed" ? "success"
              : s.displayStatus === "Working" ? "primary"
              : s.displayStatus === "On Break" ? "warning"
              : s.displayStatus === "Invalid Clocked Out" ? "danger"
              : "secondary"
            } style={{ fontSize: "0.75rem", padding: "4px 6px" }}>
            {s.displayStatus}
          </Badge>
        );
      default: return "--";
    }
  };

  const cellStyle = { padding: "6px 8px", verticalAlign: "middle", fontSize: "0.9rem", whiteSpace: "nowrap" };

  return (
    // ✅ FIX 1: Outer Container Height 100vh and overflow hidden
    <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
      
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar} />

      {/* ✅ FIX 2: Main Content Container (Flex Column) */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        
        <TopNavbar
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role") || "Manager"}
          onLogout={onLogout}
        />
        
        {/* ✅ FIX 3: Content Area Scrolls here (overflow-auto) */}
        <div className="p-3 container-fluid" style={{ overflowY: "auto", flex: 1 }}>
          <PageHeading title="Team Work Sessions" />

          {/* Filters Row */}
          <CardContainer>
            <Row className="align-items-center g-2">
              <Col lg={2} md={4} sm={6} xs={12}>
                <Form.Control size="sm" type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </Col>
              <Col lg={2} md={4} sm={6} xs={12}>
                <Form.Select size="sm" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                  <option value="">All Employees</option>
                  {uniqueEmployees.map((emp, idx) => <option key={idx} value={emp}>{emp}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6} xs={6}>
                <Form.Select size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map((name,i) => <option key={i} value={i+1}>{name}</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6} xs={6}>
                <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Working">Working</option>
                  <option value="On Break">On Break</option>
                  <option value="Completed">Completed</option>
                  <option value="Auto Clocked Out">Auto Clocked Out</option>
                </Form.Select>
              </Col>
              <Col lg={2} md={4} sm={6} xs={6}>
                <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
                  {[10, 25, 50, "All"].map((num) => <option key={num} value={num}>{num} per page</option>)}
                </Form.Select>
              </Col>
              <Col lg={2} md={12} xs={12} className="d-flex gap-2 justify-content-lg-end justify-content-start">
                <Button variant="outline-secondary" size="sm" onClick={handleReset} title="Reset"><ArrowCounterclockwise /></Button>
                <Button variant="outline-primary" size="sm" onClick={() => setShowColumnsModal(true)} title="Columns"><Gear /></Button>
                <Button variant="success" size="sm" onClick={handleExport} title="Export"><FileEarmarkText /></Button>
              </Col>
            </Row>
          </CardContainer>

          {/* Table Container */}
          <CardContainer className="mt-3 p-0 overflow-hidden">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "40vh" }}>
                <Spinner animation="border" variant="warning" />
              </div>
            ) : filtered.length > 0 ? (
              <>
                <div style={{ overflowX: "auto" }}>
                  <Table bordered hover size="sm" className="mb-0 w-100 text-nowrap align-middle">
                    <thead className="text-center" style={{ backgroundColor: "#FFA500", color: "white" }}>
                      <tr>
                        {selectedColumns.map(colKey => (
                          <th key={colKey} style={{ padding: "8px", fontSize: "0.85rem" }}>
                            {allColumns.find(c => c.key === colKey)?.label || colKey}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((s, idx) => (
                        <tr key={idx} style={{ textAlign: "center" }}>
                          {selectedColumns.map(col => <td key={col} style={cellStyle}>{renderCell(col, s, idx)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {rowsPerPage !== "All" && (
                  <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                    <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrev}>Previous</Button>
                    <span className="small fw-semibold text-muted">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-5 text-muted">No Work Sessions Found</div>
            )}
          </CardContainer>

          {/* Column Toggle Modal */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)} centered scrollable size="sm">
            <Modal.Header closeButton>
              <Modal.Title>Table Columns</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                {allColumns.map(col => (
                  <Form.Check key={col.key} type="switch" id={`col-switch-${col.key}`} label={col.label} checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} className="mb-2" />
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

export default TeamWorkSessions;