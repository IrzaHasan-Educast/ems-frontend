// src/pages/EmployeeDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/EmployeeSidebar";
import TopNavbar from "../../components/EmployeeNavbar";
import CardContainer from "../../components/CardContainer";
import CurrentSessionCard from "../../components/CurrentSessionCard";
import { Button } from "react-bootstrap";
import axios from "axios";

const EmployeeDashboard = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

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
        // Sort by clockIn descending
        const sorted = res.data.sort(
          (a, b) => new Date(b.clockInTime) - new Date(a.clockInTime)
        );

        const formatted = sorted.map((s) => {
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
            // date: clockIn.toLocaleDateString(),
            clockIn: clockIn,          // keep as Date object
            clockOut: clockOut,        // keep as Date object or null
            clockInFormatted: formatTimeAMPM(clockIn),
            clockOutFormatted: clockOut ? formatTimeAMPM(clockOut) : "--",

            totalHours: formatDuration(totalMillis / 1000 / 3600),
            workingHours: formatDuration(netMillis / 1000 / 3600),
            breakHours: formatDuration(totalBreakMillis / 1000 / 3600),
            status: clockOut
              ? "Completed"
              : s.breaks?.some((b) => !b.endTime)
              ? "On Break"
              : "Working",
          };
        });

        setHistory(formatted);
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

  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/v1/work-sessions/active", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data) {
        const session = {
          ...res.data,
          clockIn: new Date(res.data.clockInTime),
          clockOut: res.data.clockOutTime ? new Date(res.data.clockOutTime) : null,
          breaks: res.data.breaks || [],
          onBreak: res.data.breaks?.some((b) => !b.endTime) || false,
          currentBreakId: res.data.breaks?.find((b) => !b.endTime)?.id || null,
          sessionId: res.data.id,
        };
        setCurrentSession(session);
      } else setCurrentSession(null);
    } catch (err) {
      console.error("Failed fetching active session", err);
      setCurrentSession(null);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchActiveSession();
  }, [fetchCurrentUser, fetchActiveSession]);

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8080/api/v1/work-sessions/clock-in",
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setCurrentSession({
        clockIn: new Date(res.data.clockInTime),
        clockOut: null,
        breaks: [],
        onBreak: false,
        currentBreakId: null,
        sessionId: res.data.id,
      });
      fetchHistory(employee.id);
    } catch (err) {
      console.error(err);
      alert("Clock in failed.");
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    if (!currentSession?.sessionId) return;
    setLoading(true);
    try {
      await axios.put(
        `http://localhost:8080/api/v1/work-sessions/clock-out/${currentSession.sessionId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setCurrentSession((prev) => ({
        ...prev,
        clockOut: new Date(),
        onBreak: false,
        currentBreakId: null,
      }));
      fetchHistory(employee.id);
    } catch (err) {
      console.error(err);
      alert("Clock out failed.");
    }
    setLoading(false);
  };

  const handleTakeBreak = async () => {
    if (!currentSession?.sessionId) return;
    setLoading(true);

    try {
      if (!currentSession.onBreak) {
        const res = await axios.post(
          "http://localhost:8080/api/v1/breaks",
          { workSessionId: currentSession.sessionId, startTime: new Date() },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setCurrentSession((prev) => ({ ...prev, onBreak: true, currentBreakId: res.data.id }));
      } else {
        const breakId = currentSession.currentBreakId;
        const res = await axios.put(
          `http://localhost:8080/api/v1/breaks/${breakId}`,
          { endTime: new Date() },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setCurrentSession((prev) => ({
          ...prev,
          onBreak: false,
          currentBreakId: null,
          breaks: [...prev.breaks.filter((b) => b.id !== breakId), res.data],
        }));
      }
      fetchHistory(employee.id);
    } catch (err) {
      console.error(err);
      alert("Break operation failed.");
    }
    setLoading(false);
  };

const formatPrettyDate = (dateObj) => {
  if (!dateObj) return "--";
  return dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};



  if (!employee) return <div>Loading...</div>;

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} />
        <div className="p-4">
          <h3 className="text mb-4">Welcome, {employee.fullName}</h3>

          {/* Current Session */}
          <CardContainer title="Current Session">
            <CurrentSessionCard
              currentSession={currentSession}
              formatTimeAMPM={formatTimeAMPM}
              handleClockIn={handleClockIn}
              handleClockOut={handleClockOut}
              handleTakeBreak={handleTakeBreak}
              loading={loading}
            />
          </CardContainer>

          {/* Recent 3 Days Attendance */}
          <CardContainer title="Recent Work Sessions">
            <div className="d-flex flex-column gap-3">
              {history.slice(0, 3).map((h, idx) => (
                <div key={idx} className="p-3 border rounded shadow-sm bg-light">
                  <h5 className="mb-2" style={{ color: "#055993" }}>
                    {formatPrettyDate(new Date(h.clockIn))}
                  </h5>
                  <div className="d-flex justify-content-between flex-wrap gap-3">
                    <div>
                      <p className="m-0 text-muted">Clock In</p>
                      <h6>{h.clockInFormatted}</h6>
                    </div>
                    <div>
                      <p className="m-0 text-muted">Clock Out</p>
                      <h6>{h.clockOutFormatted}</h6>
                    </div>
                    <div>
                      <p className="m-0 text-muted">Working Hours</p>
                      <h6>{h.workingHours}</h6>
                    </div>
                    <div>
                      <p className="m-0 text-muted">Break Hours</p>
                      <h6>{h.breakHours}</h6>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-end">
                <Button
                  variant="primary"
                  onClick={() => (window.location.href = "/employee/attendancehistory")}
                >
                  View Full History →
                </Button>
              </div>
            </div>
          </CardContainer>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
