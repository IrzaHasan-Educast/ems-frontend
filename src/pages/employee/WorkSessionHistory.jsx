// src/pages/AttendanceHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/EmployeeNavbar";
import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading";

import { Table, Form, Button, InputGroup, FormControl, Spinner } from "react-bootstrap";

// ⬅️ Reusable API calls
import { getCurrentUser, getWorkSessions } from "../../api/workSessionApi";

const WorkSessionHistory = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState("");
  const [selectedStatus, setselectedStatus] = useState("");
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

  const getMonthName = (dateStr) => {
    const [day, month, year] = dateStr.split("-");
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleString("en-US", { month: "long" });
  };

  const millisToHMS = (ms) => {
    if (!ms || ms < 0) return "0h 0m 0s";

    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return `${h}h ${m}m ${s}s`;
  };


  const isoToMillis = (iso) => {
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const h = parseInt(match?.[1] || 0);
    const m = parseInt(match?.[2] || 0);
    const s = parseInt(match?.[3] || 0);
    return ((h * 60 + m) * 60 + s) * 1000;
  };


  // -------- Fetch Work History --------
  const fetchHistory = useCallback(async (employeeId) => {
    try {
      setLoading(true);
      const res = await getWorkSessions(employeeId);

      if (res.data && Array.isArray(res.data)) {
      const formatted = res.data.map((s) => {
      const clockIn = new Date(s.clockInTime);
      const clockOut = s.clockOutTime ? new Date(s.clockOutTime) : null;
      const now = new Date();

      let totalMs = 0;
      let workingMs = 0;
      let breakMs = 0;

      if (clockOut) {
        // ✅ Completed session → backend values
        totalMs = isoToMillis(s.totalSessionHours);
        workingMs = isoToMillis(s.totalWorkingHours);
        breakMs = isoToMillis(s.idleTime);
      } else {
        // ✅ Working session → dynamic calculation
        totalMs = now - clockIn;
        breakMs = isoToMillis(s.idleTime); // agar null → 0
        workingMs = totalMs - breakMs;
      }

      return {
        id: s.id,
        date: clockIn.toLocaleDateString("en-GB").replace(/\//g, "-"),
        clockIn: formatTimeAMPM(clockIn),
        clockOut: clockOut ? formatTimeAMPM(clockOut) : "--",

        totalHours: millisToHMS(totalMs),
        workingHours: millisToHMS(workingMs),
        breakHours: millisToHMS(breakMs),

        status: s.status,
      };

    });

      setHistory(formatted);
      setFilteredHistory(formatted);
    }

    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally{
      setLoading(false);
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
      filtered = filtered.filter((h) => getMonthName(h.date) === selectedDate);
    }
    if(selectedStatus){
      filtered = filtered.filter((h)=> h.status === selectedDate);
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
  }, [searchQuery, selectedDate,selectedStatus, history]);

  const handleReset = () => {
    setSelectedDate("");
    setSearchQuery("");
    setselectedStatus("");
    setFilteredHistory(history);
  };

  const uniqueMonths = [...new Set(history.map((h) => getMonthName(h.date)))];

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
      case "Early Clocked Out":
        return "text-secondary";
      case "Auto Clocked Out":
        return "text-info"
      default:
        return "";
    }
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

        <div className="p-4">
          <PageHeading title="Work Session History" />

          {/* Search + Filter */}
          <CardContainer title="Search & Filter">
            <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">
              <div className="row w-100">
                <div className="col-md-4">
                  <InputGroup>
                    <FormControl
                      placeholder="Search Here..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>
                </div>

                <div className="col-md-3">
                  <Form.Select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                    <option value="">Select Month</option>
                    {uniqueMonths.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-3">
                  <Form.Select
                  value={selectedStatus}
                  onChange={(e)=>setselectedStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    {[...new Set(history.map(h => h.status))].map((s)=>(
                      <option key={s} value={s}>{s}</option>
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
            {loading?(
            <div className="d-flex justify-content-center align-items-center" style={{height:"40vh", color:"rgb(245, 138, 41)"}}>
              <Spinner animation="border"/>
              </div>
            ):(

            <Table bordered hover responsive className="table-theme text-center">
              <thead style={{ backgroundColor: "#055993", color: "white" }}>
                <tr>
                  <th>S. No.</th>
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
                  <tr key={h.id} className={h.clockOut === "--" && idx === 0 ? "current-session-row" : ""}>
                    <td>{idx+1}</td>
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
            )}
          </CardContainer>
        </div>
      </div>
    </div>
  );
};

export default WorkSessionHistory;
