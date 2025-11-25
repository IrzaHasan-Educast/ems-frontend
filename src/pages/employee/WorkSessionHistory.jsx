// src/pages/AttendanceHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/EmployeeSidebar";
import TopNavbar from "../../components/EmployeeNavbar";
import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading";
import "../../styles/AttendanceHistory.css";

import { Table, Form, Button, InputGroup, FormControl } from "react-bootstrap";

// ⬅️ Reusable API calls
import { getCurrentUser, getWorkSessions } from "../../api/workSessionApi";

const AttendanceHistory = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- Time format AM/PM ---
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

  // -------- Fetch Work History --------
  const fetchHistory = useCallback(async (employeeId) => {
    try {
      const res = await getWorkSessions(employeeId);

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

  // -------- Fetch Current User --------
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await getCurrentUser();
      setEmployee({ fullName: res.data.fullName, id: res.data.employeeId });
      fetchHistory(res.data.employeeId);
    } catch (err) {
      console.error("Failed fetching user", err);
    }
  }, [fetchHistory]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // -------- Search + Filter --------
  useEffect(() => {
    let filtered = [...history];

    if (selectedDate) {
      filtered = filtered.filter((h) => h.date === selectedDate);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((h) =>
        `${h.date} ${h.clockIn} ${h.clockOut} ${h.status}`
          .toLowerCase()
          .includes(query)
      );
    }

    setFilteredHistory(filtered);
  }, [searchQuery, selectedDate, history]);

  const handleReset = () => {
    setSelectedDate("");
    setSearchQuery("");
    setFilteredHistory(history);
  };

  if (!employee) return <div>Loading...</div>;

  const uniqueDates = [...new Set(history.map((h) => h.date))];

  const getStatusColor = (status) => {
    switch (status) {
      case "Invalid Clocked Out":
        return "text-danger";
      case "Completed":
        return "text-success";
      case "On Break":
        return "text-warning";
      case "Working":
        return "text-primary";
      default:
        return "";
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} username={employee?.fullName} />

        <div className="p-4">
          <PageHeading title="Work Session History" />

          {/* Search + Filter */}
          <CardContainer title="Search & Filter">
            <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">
              <div className="row w-100">
                <div className="col-md-6">
                  <InputGroup>
                    <FormControl
                      placeholder="Search Here..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>
                </div>

                <div className="col-md-4">
                  <Form.Select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    <option value="">Select Date</option>
                    {uniqueDates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                <div className="col-md-2">
                  <Button variant="secondary" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </div>

              <div className="ms-auto">
                <strong>Total Records: {filteredHistory.length}</strong>
              </div>
            </div>
          </CardContainer>

          {/* Table */}
          <CardContainer title="Work Session Records">
            <Table bordered hover responsive className="table-theme">
              <thead style={{ backgroundColor: "#055993", color: "white" }}>
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
                {filteredHistory.map((h, idx) => (
                  <tr
                    key={h.id}
                    className={
                      h.clockOut === "--" && idx === 0 ? "current-session-row" : ""
                    }
                  >
                    <td>{h.date}</td>
                    <td>{h.clockIn}</td>
                    <td>{h.clockOut}</td>
                    <td>{h.totalHours}</td>
                    <td>{h.workingHours}</td>
                    <td>{h.breakHours}</td>
                    <td className={getStatusColor(h.status)}>{h.status}</td>
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
