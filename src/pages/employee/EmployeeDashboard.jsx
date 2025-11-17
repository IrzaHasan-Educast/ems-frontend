// src/pages/EmployeeDashboard.jsx
import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    setEmployee({ fullName: "Irza Hasan", role: "Employee" });
    fetchActiveSession();
  }, []);

  // Fetch active session from backend
  const fetchActiveSession = async () => {
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
  };

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

  if (!employee) return <div>Loading...</div>;

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
                <p>Clock In: {currentSession?.clockIn ? currentSession.clockIn.toLocaleTimeString() : "--"}</p>
                <p>Clock Out: {currentSession?.clockOut ? currentSession.clockOut.toLocaleTimeString() : "--"}</p>
                <p>Total Hours: {calculateNetHours()}</p>
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
                  <th>Breaks</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr key={idx}>
                    <td>{h.date}</td>
                    <td>{h.clockIn}</td>
                    <td>{h.clockOut}</td>
                    <td>{h.totalHours}</td>
                    <td>{h.breaks}</td>
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
