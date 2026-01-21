// src/pages/employee/AttendanceHistory.jsx
import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Badge } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getMyAttendance } from "../../api/attendanceApi";
import { getCurrentUser } from "../../api/workSessionApi"; 

const AttendanceHistory = ({ onLogout }) => {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedShift, setSelectedShift] = useState(""); // new
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const beautifyShift = (shift) => {
    if (!shift) return "--";
    return shift
      .split("_")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  // Fetch employee info + attendance
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resEmp = await getCurrentUser();
        setEmployee({ fullName: resEmp.data.fullName, id: resEmp.data.employeeId });

        const res = await getMyAttendance();
        const formatted = res.data.map((a, index) => {
          const dateObj = new Date(a.attendanceDate);
          const dayOfWeek = dateObj.getDay();
          const dateStr = `${String(dateObj.getDate()).padStart(2,'0')}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${dateObj.getFullYear()}`;

          const timeObj = new Date(`1970-01-01T${a.attendanceTime}`);
          let hours = timeObj.getHours();
          const minutes = String(timeObj.getMinutes()).padStart(2,'0');
          const seconds = String(timeObj.getSeconds()).padStart(2,'0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12 || 12;
          const timeStr = `${String(hours).padStart(2,'0')}:${minutes}:${seconds} ${ampm}`;

          let status = a.present ? "Present" : "Absent";
          if (dayOfWeek === 0) status = "Sunday";

          return {
            id: index + 1,
            date: dateStr,
            rawDate: a.attendanceDate,
            time: timeStr,
            status,
            shift: beautifyShift(a.shift),
          };
        });

        formatted.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

        setRecords(formatted);
        setFiltered(formatted);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Filtering
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const f = records.filter(r => {
      const matchesSearch = [r.date, r.time, r.status, r.shift].join(" ").toLowerCase().includes(term);
      const matchesMonth = selectedMonth ? new Date(r.rawDate).getMonth() + 1 === parseInt(selectedMonth) : true;
      const matchesShift = selectedShift ? r.shift === selectedShift : true;
      return matchesSearch && matchesMonth && matchesShift;
    });
    setFiltered(f);
  }, [searchTerm, selectedMonth, selectedShift, records]);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedMonth("");
    setSelectedShift("");
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className="flex-grow-1">
        <TopNavbar 
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role")}
        /> 

        <div className="p-4 container">
          <PageHeading title="My Attendance History" />

          {/* Filters */}
          <CardContainer title="Search & Filter">
            <Row className="g-2 justify-content-center align-items-center mb-2">
              <Col md={3}>
                <Form.Control
                  type="text"
                  placeholder="Search by date, time, status, shift..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  {[
                    "January","February","March","April","May","June",
                    "July","August","September","October","November","December"
                  ].map((m,i) => (
                    <option key={i} value={i+1}>{m}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                >
                  <option value="">All Shifts</option>
                  {[...new Set(records.map(r => r.shift).filter(s => s !== "--"))].map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button variant="secondary" onClick={handleReset}>↻</Button>
              </Col>
            </Row>
          </CardContainer>

          {/* Table */}
          <CardContainer title="Attendance Records">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh", color: "rgb(245, 138, 41)"}}>
                <Spinner animation="border" />
              </div>
            ) : (
              <Table bordered hover responsive className="table-theme">
                <thead style={{ backgroundColor: "#194D33", color: "white", textAlign: "center" }}>
                  <tr>
                    <th>S.No</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Shift</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr key={idx} style={{ textAlign: "center" }}>
                      <td>{idx + 1}</td>
                      <td>{r.date}</td>
                      <td>{r.time}</td>
                      <td>
                        <Badge bg={
                          r.status === "Present" ? "success" :
                          r.status === "Absent" ? "danger" : "primary"
                        }>
                          {r.status}
                        </Badge>
                      </td>
                      <td>{r.shift}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContainer>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
