// src/pages/EmployeeDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/EmployeeSidebar";
import TopNavbar from "../../components/EmployeeNavbar";
import CardContainer from "../../components/CardContainer";
import { Button, Table } from "react-bootstrap";
import axios from "axios";

const EmployeeDashboard = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Format time to AM/PM
  const formatTimeAMPM = (date) => {
    if (!date) return "--";
    const d = new Date(date);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 ko 12 banao
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
        const formatted = res.data.map(s => {
          const clockIn = new Date(s.clockInTime);
          const clockOut = s.clockOutTime ? new Date(s.clockOutTime) : null;

          const totalBreakMillis = s.breaks?.reduce((sum, b) => {
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
            status: s.status
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
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setEmployee({ fullName: res.data.fullName, id: res.data.employeeId });
      fetchHistory(res.data.employeeId);
    } catch (err) {
      console.error("Failed fetching user", err);
    }
  }, [fetchHistory]);

  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/work-sessions/active",
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (res.data) {
        const session = {
          ...res.data,
          clockIn: new Date(res.data.clockInTime),
          clockOut: res.data.clockOutTime ? new Date(res.data.clockOutTime) : null,
          breaks: res.data.breaks || [],
          onBreak: res.data.breaks?.some(b => !b.endTime) || false,
          currentBreakId: res.data.breaks?.find(b => !b.endTime)?.id || null,
          sessionId: res.data.id,
        };
        setCurrentSession(session);
      } else {
        setCurrentSession(null);
      }
    } catch (err) {
      console.error("Failed fetching active session", err);
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

      const now = new Date();
      const workedHours = (now - new Date(currentSession.clockIn)) / 1000 / 3600;
      const totalBreakHours = currentSession.breaks.reduce(
        (sum, b) => sum + (b.durationHours || 0),
        0
      );
      const netHours = workedHours - totalBreakHours;

      setCurrentSession({
        ...currentSession,
        clockOut: now,
        totalHours: netHours,
        onBreak: false,
        currentBreakId: null,
      });
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
        // Start break
        const res = await axios.post(
          "http://localhost:8080/api/v1/breaks",
          { workSessionId: currentSession.sessionId, startTime: new Date() },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        setCurrentSession({
          ...currentSession,
          onBreak: true,
          currentBreakId: res.data.id,
        });
      } else {
        // End break
        const breakId = currentSession.currentBreakId;
        const res = await axios.put(
          `http://localhost:8080/api/v1/breaks/${breakId}`,
          { endTime: new Date() },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        const updatedBreaks = [...currentSession.breaks.filter(b => b.id !== breakId), res.data];
        setCurrentSession({
          ...currentSession,
          onBreak: false,
          currentBreakId: null,
          breaks: updatedBreaks,
        });
      }
    } catch (err) {
      console.error(err);
      alert("Break operation failed.");
    }
    setLoading(false);
  };

  const calculateNetHours = () => {
    if (!currentSession?.clockIn) return 0;
    const clockOutTime = currentSession.clockOut || new Date();
    const workedHours = (clockOutTime - new Date(currentSession.clockIn)) / 1000 / 3600;
    const totalBreakHours = currentSession.breaks.reduce((sum, b) => sum + (b.durationHours || 0), 0);
    return (workedHours - totalBreakHours).toFixed(2);
  };

  const calculateSessionTimes = (session) => {
    if (!session?.clockInTime) return { netHours: 0, idleHours: 0 };
    const clockIn = new Date(session.clockInTime);
    const clockOut = session.clockOutTime ? new Date(session.clockOutTime) : new Date();
    const totalMillis = clockOut - clockIn;

    const totalBreakMillis = session.breaks.reduce((sum, b) => {
      const start = new Date(b.startTime);
      const end = b.endTime ? new Date(b.endTime) : new Date();
      return sum + (end - start);
    }, 0);

    const netMillis = totalMillis - totalBreakMillis;
    const netHours = netMillis / 1000 / 3600;
    const idleHours = totalBreakMillis / 1000 / 3600;

    return {
      netHours: formatDuration(netHours),
      idleHours: formatDuration(idleHours)
    };
  };

  const calculateNetWorkingHours = (session) => {
    if (!session?.clockInTime) return 0;
    const clockIn = new Date(session.clockInTime);
    const clockOut = session.clockOutTime ? new Date(session.clockOutTime) : new Date();
    const totalMillis = clockOut - clockIn;

    const totalBreakMillis = session.breaks.reduce((sum, b) => {
      const start = new Date(b.startTime);
      const end = b.endTime ? new Date(b.endTime) : new Date();
      return sum + (end - start);
    }, 0);

    const netMillis = totalMillis - totalBreakMillis;
    const netHours = netMillis / 1000 / 3600;

    return formatDuration(netHours);
  };

  if (!employee) return <div>Loading...</div>;
  const { idleHours } = calculateSessionTimes(currentSession);

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} />
        <div className="p-4">
          <h3 className="text-primary mb-4">Welcome, {employee.fullName}</h3>

          {/* Current Session */}
          <CardContainer title="Current Session">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
              <div>
                <p>Clock In: {formatTimeAMPM(currentSession?.clockIn)}</p>
                <p>Clock Out: {formatTimeAMPM(currentSession?.clockOut)}</p>
                <p>Total Hours: {calculateNetHours()} h</p>
                <p>Total Working Hours: {calculateNetWorkingHours(currentSession)}</p>
                <p>Break Duration: {idleHours}</p>
                <p>Status: {currentSession?.onBreak ? "On Break" : "Working"}</p>
              </div>

              <div className="d-flex gap-2 flex-wrap mt-2">
                {!currentSession?.clockIn || currentSession.clockOut ? (
                  <Button variant="success" onClick={handleClockIn} disabled={loading}>
                    {loading ? "Processing..." : "Clock In"}
                  </Button>
                ) : (
                  <Button variant="danger" onClick={handleClockOut} disabled={loading}>
                    {loading ? "Processing..." : "Clock Out"}
                  </Button>
                )}

                <Button
                  variant={currentSession?.onBreak ? "warning" : "info"}
                  onClick={handleTakeBreak}
                  disabled={!currentSession?.clockIn || currentSession.clockOut}
                >
                  {currentSession?.onBreak ? "End Break" : "Take Break"}
                </Button>
              </div>
            </div>
          </CardContainer>

          {/* Work History */}
          <CardContainer title="Work History">
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
                {history.map((h, idx) => (
                  <tr key={idx}>
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

export default EmployeeDashboard;
