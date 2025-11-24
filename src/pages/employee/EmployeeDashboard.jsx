// src/pages/employee/EmployeeDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/EmployeeSidebar";
import TopNavbar from "../../components/EmployeeNavbar";
import CardContainer from "../../components/CardContainer";
import CurrentSessionCard from "../../components/CurrentSessionCard";
import { Button } from "react-bootstrap";
import * as attendanceApi from "../../api/attendanceApi"; // <- import attendance API
import * as workSessionApi from "../../api/workSessionApi";
import * as breakApi from "../../api/breakApi";
import PageHeading from "../../components/PageHeading";
import axios from "../../api/axios";
import Swal from "sweetalert2";
import ClockButton from "../../components/ClockButton";


const EmployeeDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Format helpers
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
      // Sort descending by clockIn
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
          clockIn,
          clockOut,
          clockInFormatted: formatTimeAMPM(clockIn),
          clockOutFormatted: clockOut ? formatTimeAMPM(clockOut) : "--",
          totalHours: formatDuration(totalMillis / 1000 / 3600),
          workingHours: formatDuration(netMillis / 1000 / 3600),
          breakHours: formatDuration(totalBreakMillis / 1000 / 3600),
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
      const res = await workSessionApi.getMe();
      setEmployee({ fullName: res.data.fullName, id: res.data.employeeId });
      fetchHistory(res.data.employeeId);
    } catch (err) {
      console.error(err);
    }
  }, [fetchHistory]);

  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await workSessionApi.getActiveSession();
      if (res.data) {
        setCurrentSession({
          ...res.data,
          clockIn: new Date(res.data.clockInTime),
          clockOut: res.data.clockOutTime ? new Date(res.data.clockOutTime) : null,
          breaks: res.data.breaks || [],
          onBreak: res.data.breaks?.some((b) => !b.endTime) || false,
          currentBreakId: res.data.breaks?.find((b) => !b.endTime)?.id || null,
          sessionId: res.data.id,
        });
      } else setCurrentSession(null);
    } catch (err) {
      console.error(err);
      setCurrentSession(null);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchActiveSession();
  }, [fetchCurrentUser, fetchActiveSession]);

  // Handle Clock In/Out/Break
  const handleClockIn = async () => {
  setLoading(true);
  try {
    // 1. Clock in for work session
    await workSessionApi.clockIn();

    // 2. Try marking attendance (once per day)
    try {
      await attendanceApi.markAttendance();
    } catch (err) {
      // If attendance already exists, ignore error
      if (err.response?.status === 400 || err.response?.data?.includes("already marked")) {
        console.log("Attendance already marked for today.");
      } else {
        console.error("Attendance API error:", err);
      }
    }

    // 3. Refresh active session and history
    fetchActiveSession();
    fetchHistory(employee.id);

  } catch (err) {
    console.error(err);
    alert("Clock in failed.");
  }
  setLoading(false);
};

const handleClockOut = async () => {
  if (!currentSession?.sessionId) return;

  // Single confirmation using SweetAlert2
  const result = await Swal.fire({
    title: 'Clock Out',
    text: "Do you want to clock out now?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, clock out!',
    cancelButtonText: 'Cancel',
    showClass: { popup: 'animate__animated animate__fadeInDown' },
    hideClass: { popup: 'animate__animated animate__fadeOutUp' }
  });

  if (!result.isConfirmed) return;

  setLoading(true);
  try {
    await workSessionApi.clockOut(currentSession.sessionId);
    fetchActiveSession();
    fetchHistory(employee.id);

    // Success message as toast or inline alert instead of another modal
    Swal.fire({
      icon: 'success',
      title: 'Clocked Out!',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
  } catch (err) {
    console.error(err);

    Swal.fire({
      icon: 'error',
      title: 'Clock out failed.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
  }
  setLoading(false);
};


  const handleTakeBreak = async () => {
    if (!currentSession?.sessionId) return;
    setLoading(true);
    try {
      if (!currentSession.onBreak) {
        await breakApi.startBreak(currentSession.sessionId);
      } else {
        await breakApi.endBreak(currentSession.currentBreakId);
      }
      fetchActiveSession();
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

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} username={employee?.fullName}/>
        <div className="p-4">
          <PageHeading
            title="Employee Dashboard"
          />

        <h4 className="mb-4" style={{ color: "#055993" }}>Welcome, {employee?.fullName}</h4>
        {/* Current Session Card or Clock In Button */}
        <CardContainer title="Current Session">
          {currentSession ? (
            <CurrentSessionCard
              currentSession={currentSession}
              formatTimeAMPM={formatTimeAMPM}
              handleClockIn={handleClockIn}
              handleClockOut={handleClockOut}
              handleTakeBreak={handleTakeBreak}
              loading={loading}
            />
          ) : (
            <div className="text-center p-4">
              <p>No active session. Start your work now!</p>
              <div 
                className="clock-in-circle mx-auto"
                onClick={handleClockIn}
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  backgroundColor: "#28a745",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  userSelect: "none",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                }}
              >
                {loading ? "Loading..." : "Clock In"}
              </div>
            </div>

          )}
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
      onClick={() => navigate("/employee/attendance-history")}
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
