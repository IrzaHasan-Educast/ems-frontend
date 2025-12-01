// src/pages/admin/Attendance.jsx
import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getAllAttendance } from "../../api/attendanceApi";
import { FileEarmarkText, Gear } from "react-bootstrap-icons";
import { getRoles, getAllEmployees } from "../../api/employeeApi";

import * as XLSX from "xlsx";

const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "employeeName", label: "Employee" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "present", label: "Present" },
  { key: "shift", label: "Shift" },
];

const Attendance = ({ onLogout }) => {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [admin, setAdmin] = useState({ name: "admin", role: "Admin" });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(allColumns.map(c => c.key));

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const todayStr = new Date().toISOString().split("T")[0];

  const formatDateForCompare = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  };

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
  return shift
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

  // Fetch roles & admin
  useEffect(() => {
    const fetchRolesAndAdmin = async () => {
      try {
        const res = await getRoles();
        setRoles(res.data);

        const empRes = await getAllEmployees();
        const allEmployees = empRes.data;

        const adminEmployee = allEmployees.find(
          (emp) => emp.role?.toLowerCase() === "admin"
        );

        if (adminEmployee) {
          setAdmin({ name: adminEmployee.fullName, role: adminEmployee.role });
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchRolesAndAdmin();
  }, []);

  // Fetch attendance
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await getAllAttendance();

        const formatted = res.data.map((a, index) => ({
          id: index + 1,
          employeeName: a.employeeName,
          date: a.attendanceDate,
          time: a.attendanceTime,
          present: a.present ? "Present" : "Absent",
          shift: a.shift,
          rawDate: a.attendanceDate,
        }));

        setRecords(formatted);
        setFiltered(formatted);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchAttendance();
  }, []);

  // Filtering
  useEffect(() => {
    const term = searchTerm.toLowerCase();

    const f = records.filter((r) => {
      const matchesSearch =
        [r.employeeName, r.date, r.time, r.present, r.shift]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesEmployee = selectedEmployee ? r.employeeName === selectedEmployee : true;
      const matchesMonth = selectedMonth
        ? new Date(r.rawDate).getMonth() + 1 === parseInt(selectedMonth)
        : true;

      return matchesSearch && matchesEmployee && matchesMonth;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [searchTerm, selectedEmployee, selectedMonth, records]);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedEmployee("");
    setSelectedMonth("");
    setRowsPerPage(10);
    setSelectedColumns(allColumns.map(c => c.key));
  };

  const handleExport = () => {
    const fileName = prompt("Enter file name:", "Attendance");
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
          case "date": return formatDate(r.date);
          case "time": return formatTime(r.time);
          case "present": return r.present;
          case "shift": return beautifyShift(r.shift);
          default: return "";
        }
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const uniqueEmployees = [...new Set(records.map((r) => r.employeeName))];

  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(k => k !== key));
    } else {
      setSelectedColumns([...selectedColumns, key]);
    }
  };

  const renderCell = (col, r, index) => {
    switch (col) {
      case "sno":
        return index + 1;
      case "employeeName":
        return r.employeeName;
      case "date":
        return formatDate(r.date);
      case "time":
        return formatTime(r.time);
      case "present":
        return (
          <Badge bg={r.present === "Present" ? "success" : "danger"}>
            {r.present}
          </Badge>
        );
      case "shift":
      return beautifyShift(r.shift);
      default:
        return "--";
    }
  };

  // Split today's attendance and past attendance
  const todayRecords = filtered.filter(r => formatDateForCompare(r.rawDate) === todayStr);
  const pastRecords = filtered.filter(r => formatDateForCompare(r.rawDate) !== todayStr);

  const totalRecords = filtered.length;

  const paginatedRecords = rowsPerPage === "All"
    ? filtered
    : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} username={admin.name} role={admin.role} />
        <div className="p-4 container">
          <PageHeading title="Attendance Records" />

          {/* Filters */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col md={3}>
                <Form.Control
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>

              <Col md={3}>
                <Form.Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {uniqueEmployees.map((emp, i) => (
                    <option key={i} value={emp}>{emp}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={2}>
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  {[
                    "January","February","March","April","May","June",
                    "July","August","September","October","November","December",
                  ].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={2}>
                <Form.Select
                  value={rowsPerPage}
                  onChange={(e) => {setRowsPerPage(e.target.value);
                  setCurrentPage(1);
                }}
                >
                  {[10, 25, 50, "All"].map((n) => (
                    <option key={n} value={n}>{n} per page</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={2} className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={handleReset}>Reset</Button>
                <Button variant="outline-primary" onClick={() => setShowColumnsModal(true)}><Gear /></Button>
                <Button variant="success" onClick={handleExport}><FileEarmarkText /></Button>
              </Col>
            </Row>
          </CardContainer>

          {/* Today's Attendance */}
          <CardContainer className="mt-3">
            <h5 style={{color: " #055993", fontWeight: "bold"}}>Today's Attendance</h5>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "20vh" }}>
                <Spinner animation="border" />
              </div>
            ) : (
              <Table bordered hover responsive>
                <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                  <tr>
                    {selectedColumns.map(col => <th key={col}>{allColumns.find(c => c.key === col).label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {todayRecords
                    .slice(0, rowsPerPage === "All" ? todayRecords.length : rowsPerPage)
                    .map((r, idx) => (
                    <tr key={idx} style={{ textAlign: "center", backgroundColor: "#e6f7ff" }}>
                      {selectedColumns.map(col => <td key={col}>{renderCell(col, r, idx)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContainer>

          {/* Past Attendance */}
          <CardContainer className="mt-3">
            <h5 style={{color: " #055993", fontWeight: "bold"}}>Past Attendance</h5>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "20vh" }}>
                <Spinner animation="border" />
              </div>
            ) : (
              <Table bordered hover responsive>
                <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                  <tr>
                    {selectedColumns.map(col => <th key={col}>{allColumns.find(c => c.key === col).label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((r, idx) => (
                    <tr key={idx} style={{ textAlign: "center" }}>
                      {selectedColumns.map(col => <td key={col}>{renderCell(col, r, idx)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContainer>

          {/* Column Selection Modal */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Select Columns</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {allColumns.map((col) => (
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
              <Button onClick={() => setShowColumnsModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
