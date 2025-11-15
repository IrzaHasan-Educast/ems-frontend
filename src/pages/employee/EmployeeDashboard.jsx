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
    // Hardcoded employee data
    setEmployee({ fullName: "Irza Hasan", role: "Employee" });

    // Load session from localStorage
    const savedSession = localStorage.getItem("currentSession");
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      setCurrentSession({
        ...parsed,
        clockIn: parsed.clockIn ? new Date(parsed.clockIn) : null,
        clockOut: parsed.clockOut ? new Date(parsed.clockOut) : null,
      });
    }

    // Optional: fetch history from API
    // fetchHistory();
  }, []);

  const saveSession = (session) => {
    setCurrentSession(session);
    localStorage.setItem("currentSession", JSON.stringify(session));
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8080/api/v1/work-sessions/clock-in",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const session = {
        clockIn: new Date(res.data.clockInTime),
        clockOut: res.data.clockOutTime ? new Date(res.data.clockOutTime) : null,
        totalHours: res.data.totalWorkingHours ? parseFloat(res.data.totalWorkingHours) : 0,
        onBreak: false,
        sessionId: res.data.id,
      };
      saveSession(session);
    } catch (err) {
      console.error(err);
      alert("Clock in failed. Make sure you are logged in as Employee.");
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
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const now = new Date();
      const hours = ((now - new Date(currentSession.clockIn)) / 1000 / 3600).toFixed(2);
      const updated = { ...currentSession, clockOut: now, totalHours: parseFloat(hours) };
      saveSession(updated);
    } catch (err) {
      console.error(err);
      alert("Clock out failed");
    }
    setLoading(false);
  };

  const handleTakeBreak = () => {
    const updated = { ...currentSession, onBreak: !currentSession.onBreak };
    saveSession(updated);
  };

  if (!employee) return <div>Loading...</div>;

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} />
        <div className="p-4">
          <h3 className="text-primary mb-4">Welcome, {employee.fullName}</h3>

          {/* Current Session Card */}
          <CardContainer title="Current Session">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
              <div>
                <p>
                  Clock In:{" "}
                  {currentSession?.clockIn
                    ? currentSession.clockIn.toLocaleTimeString()
                    : "--"}
                </p>
                <p>
                  Clock Out:{" "}
                  {currentSession?.clockOut
                    ? currentSession.clockOut.toLocaleTimeString()
                    : "--"}
                </p>
                <p>Total Hours: {currentSession?.totalHours || 0}</p>
                <p>Status: {currentSession?.onBreak ? "On Break" : "Working"}</p>
              </div>
              <div className="d-flex gap-2 flex-wrap mt-2">
                {!currentSession?.clockIn || currentSession.clockOut ? (
                  <Button
                    variant="success"
                    onClick={handleClockIn}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Clock In"}
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={handleClockOut}
                    disabled={loading}
                  >
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

          {/* History Card */}
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
