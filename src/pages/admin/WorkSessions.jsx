// src/pages/admin/WorkSessions.jsx
import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getAllWorkSessionsAdmin } from "../../api/workSessionApi";
import { FileEarmarkText, Gear } from "react-bootstrap-icons";
import { getCurrentUser } from "../../api/userApi";
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

const WorkSessions = ({ onLogout }) => {
  const token = localStorage.getItem("token");
  const initialRole = jwtHelper.getRoleFromToken(token);
  const [sessions, setSessions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // ✅ Status filter
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(allColumns.map(c => c.key));
  const [admin, setAdmin] = useState({name: "", role: initialRole});
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const formatTime = (d) => {
    if (!d) return "--";
    return new Date(d).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDuration = (hoursDecimal) => {
    if (!hoursDecimal || isNaN(hoursDecimal)) return "0h 0m";
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  useEffect(() => {
    const fetchRolesAndAdmin = async () => {
      try {
        // Admin info from /users/me
        const userRes = await getCurrentUser();
        setAdmin({
          name: userRes.data.fullName,
          role: userRes.data.role,
        });
      } catch (err) {
        console.error("Failed to fetch roles or admin info:", err);
      }
    };

    fetchRolesAndAdmin();
  }, []);


  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await getAllWorkSessionsAdmin();
        const formatted = res.data.map((s) => {
          const clockIn = new Date(s.clockInTime);
          const clockOut = s.clockOutTime ? new Date(s.clockOutTime) : null;

          const totalBreakMillis =
            s.breaks?.reduce((sum, br) => {
              const start = new Date(br.startTime);
              const end = br.endTime ? new Date(br.endTime) : new Date();
              return sum + (end - start);
            }, 0) || 0;

          const totalMillis = (clockOut || new Date()) - clockIn;
          const netMillis = totalMillis - totalBreakMillis;

          let displayStatus = s.status;
          if (s.onBreak) displayStatus = "On Break";
          else if (!s.clockOutTime && s.status !== "Invalid Clocked Out") displayStatus = "Working";

          return {
            ...s,
            date: clockIn.toLocaleDateString(),
            clockIn: formatTime(s.clockInTime),
            clockOut: formatTime(s.clockOutTime),
            totalHours: formatDuration(totalMillis / 1000 / 3600),
            workingHours: formatDuration(netMillis / 1000 / 3600),
            breakHours: formatDuration(totalBreakMillis / 1000 / 3600),
            displayStatus, // ✅ precomputed status
          };
        });
        setSessions(formatted);
        setFiltered(formatted);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  // Filtering
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const monthFilter = selectedMonth;
    const empFilter = selectedEmployee;
    const status = statusFilter;

    let f = sessions.filter((s) => {
      const matchesSearch =
        [s.employeeName, s.status, s.date, s.clockIn, s.clockOut].join(" ").toLowerCase().includes(term);
      const matchesEmployee = empFilter ? s.employeeName === empFilter : true;
      const matchesMonth = monthFilter ? new Date(s.clockInTime).getMonth() + 1 === parseInt(monthFilter) : true;
      const matchesStatus = status ? s.displayStatus === status : true; // ✅ Status filter

      return matchesSearch && matchesEmployee && matchesMonth && matchesStatus;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [searchTerm, selectedEmployee, selectedMonth, statusFilter, sessions]);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedEmployee("");
    setSelectedMonth("");
    setStatusFilter(""); // ✅ Reset status filter
    setRowsPerPage(10);
    setCurrentPage(1);
    setSelectedColumns(allColumns.map(c => c.key));
  };

  // Export
  const handleExport = () => {
    const fileName = prompt("Enter file name:", "WorkSessions");
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
    XLSX.utils.book_append_sheet(wb, ws, "Work Sessions");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const displayed =
    rowsPerPage === "All"
      ? filtered
      : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const uniqueEmployees = [...new Set(sessions.map((s) => s.employeeName))];

  // Column modal toggle
  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(k => k !== key));
    } else {
      setSelectedColumns([...selectedColumns, key]);
    }
  };

  const renderCell = (col, s, index) => {
    switch (col) {
      case "sno": {
        const base = rowsPerPage === "All" ? 0 : (currentPage - 1) * Number(rowsPerPage);
        return base + index + 1;
      }
      case "employeeName": return s.employeeName;
      case "date": return s.date;
      case "clockIn": return s.clockIn;
      case "clockOut": return s.clockOut;
      case "totalHours": return s.totalHours;
      case "workingHours": return s.workingHours;
      case "breakHours": return s.breakHours;
      case "status":
        return (
          <Badge
            bg={
              s.displayStatus === "Completed" ? "success"
              : s.displayStatus === "Working" ? "primary"
              : s.displayStatus === "On Break" ? "warning"
              : s.displayStatus === "Invalid Clocked Out" ? "danger"
              : "secondary"
            }
          >
            {s.displayStatus}
          </Badge>
        );
      default: return "--";
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} 
          username={admin.name}
          role={admin.role}
        />
        <div className="p-4 container">
          <PageHeading title="All Work Sessions" />

          {/* Filters Row */}
          <CardContainer>
            <Row className="align-items-center g-2">
              <Col md={2}>
                <Form.Control
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <Form.Select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                  <option value="">All Employees</option>
                  {uniqueEmployees.map((emp, idx) => (
                    <option key={idx} value={emp}>{emp}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"]
                    .map((name,i) => <option key={i} value={i+1}>{name}</option>)}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Working">Working</option>
                  <option value="On Break">On Break</option>
                  <option value="Completed">Completed</option>
                  <option value="Invalid Clocked Out">Invalid Clocked Out</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select value={rowsPerPage} onChange={(e) => setRowsPerPage(e.target.value)}>
                  {[10, 25, 50, "All"].map((num) => <option key={num} value={num}>{num} per page</option>)}
                </Form.Select>
              </Col>
              <Col md={2} className="d-flex gap-2 justify-content-end">
                <Button variant="secondary" onClick={handleReset}>Reset</Button>
                <Button variant="outline-primary" onClick={() => setShowColumnsModal(true)}><Gear /></Button>
                <Button variant="success" onClick={handleExport}><FileEarmarkText /></Button>
              </Col>
            </Row>
          </CardContainer>

          {/* Table */}
          <CardContainer className="mt-3">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
                <Spinner animation="border" variant="warning" />
              </div>
            ) : (
              <>
                <Table bordered hover responsive className="mt-2">
                  <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                    <tr>
                      {selectedColumns.map(colKey => {
                        const col = allColumns.find(c => c.key === colKey);
                        return <th key={colKey}>{col ? col.label : colKey}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((s, idx) => (
                      <tr key={s.id} style={{ textAlign: "center" }}>
                        {selectedColumns.map(col => (
                          <td key={col}>
                            {renderCell(col, s, idx)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Pagination */}
                {rowsPerPage !== "All" && (
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <Button variant="outline-primary" disabled={currentPage === 1} onClick={handlePrev}>Previous</Button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
            )}
          </CardContainer>

          {/* Column Selection Modal */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Select Columns to Display</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {allColumns.map(col => (
                <Form.Check
                  key={col.key}
                  type="checkbox"
                  label={col.label}
                  checked={selectedColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                />
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowColumnsModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default WorkSessions;

