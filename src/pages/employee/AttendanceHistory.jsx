// src/pages/AttendanceHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/EmployeeSidebar";
import TopNavbar from "../../components/EmployeeNavbar";
import CardContainer from "../../components/CardContainer";
import { Table, Form, Button } from "react-bootstrap";
import axios from "axios";
import "../../styles/AttendanceHistory.css"; // CSS for scrollable dropdowns

const AttendanceHistory = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const formatTimeAMPM = (date) => {
    if (!date) return "--";
    const d = new Date(date);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };

  const formatDuration = (hoursDecimal) => {
    if (!hoursDecimal) return "0h 0m";
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const fetchHistory = useCallback(async (employeeId) => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/v1/work-sessions/employee/${employeeId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (res.data && Array.isArray(res.data)) {
        const formatted = res.data.map((s) => {
          const clockIn = new Date(s.clockInTime);
          const clockOut = s.clockOutTime ? new Date(s.clockOutTime) : null;

          const totalBreakMillis =
            s.breaks?.reduce((sum, b) => {
              const start = new Date(b.startTime);
              const end = b.endTime ? new Date(b.endTime) : new Date();
              return sum + (end - start);
            }, 0) || 0;

          const totalMillis = (clockOut || new Date()) - clockIn;
          const netMillis = totalMillis - totalBreakMillis;

          return {
            id: s.id,
            date: clockIn.toLocaleDateString(),
            month: clockIn.toLocaleString("default", { month: "long" }),
            year: clockIn.getFullYear(),
            clockIn: formatTimeAMPM(clockIn),
            clockOut: clockOut ? formatTimeAMPM(clockOut) : "--",
            totalHours: formatDuration(totalMillis / 1000 / 3600),
            workingHours: formatDuration(netMillis / 1000 / 3600),
            breakHours: formatDuration(totalBreakMillis / 1000 / 3600),
            status: s.status,
          };
        });
        setHistory(formatted);
        setFilteredHistory(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/v1/work-sessions/me", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setEmployee({ fullName: res.data.fullName, id: res.data.employeeId });
      fetchHistory(res.data.employeeId);
    } catch (err) {
      console.error("Failed fetching user", err);
    }
  }, [fetchHistory]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Filters
  useEffect(() => {
    let filtered = [...history];
    if (selectedDate) filtered = filtered.filter((h) => h.date === selectedDate);
    setFilteredHistory(filtered);
  }, [selectedDate, selectedMonth, selectedYear, history]);

  const handleReset = () => {
    setSelectedDate("");
    setFilteredHistory(history);
  };

  if (!employee) return <div>Loading...</div>;

  // Generate options
  const uniqueDates = [...new Set(history.map((h) => h.date))];
 
  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} />
        <div className="p-4">
          <h3 className="text-primary mb-4">Attendance History</h3>

          <CardContainer title="Filters">
            <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
              <Form.Select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="scrollable-dropdown"
              >
                <option value="">Select Date</option>
                {uniqueDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Form.Select>

              <Button variant="secondary" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </CardContainer>

          <CardContainer title="Attendance Records">
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Hours</th>
                  <th>Working Hours</th>
                  <th>Break Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h) => (
                  <tr key={h.id}>
                    <td>{h.date}</td>
                    <td>{h.clockIn}</td>
                    <td>{h.clockOut}</td>
                    <td>{h.totalHours}</td>
                    <td>{h.workingHours}</td>
                    <td>{h.breakHours}</td>
                    <td>{h.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContainer>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
