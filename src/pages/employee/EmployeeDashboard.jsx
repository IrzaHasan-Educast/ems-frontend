import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import CardContainer from "../../components/CardContainer";
import CurrentSessionCard from "../../components/CurrentSessionCard";
import { Button } from "react-bootstrap";
import * as attendanceApi from "../../api/attendanceApi";
import * as workSessionApi from "../../api/workSessionApi";
import * as breakApi from "../../api/breakApi";
import PageHeading from "../../components/PageHeading";
import Swal from "sweetalert2";
import {
  formatTimeAMPM,
  getNowUTC,
  formatPakistanDateLabel,
  parseApiDate,
} from "../../utils/time";

const EmployeeDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true); // new

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const formatDuration = (hoursDecimal) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

const fetchHistory = useCallback(async (employeeId) => {
  try {
    const res = await workSessionApi.getFirst3WorkSessions(employeeId);

    if (res.data && Array.isArray(res.data)) {
      const sorted = res.data.sort(
        (a, b) => parseApiDate(b.clockInTime) - parseApiDate(a.clockInTime)
      );

      const formatted = sorted.map((s) => {
        const clockIn = parseApiDate(s.clockInTime);
        const clockOut = parseApiDate(s.clockOutTime);

        const totalBreakMillis =
          s.breaks?.reduce((sum, b) => {
            const start = parseApiDate(b.startTime);
            const end = parseApiDate(b.endTime) || getNowUTC();
            if (!start) return sum;
            return sum + (end.getTime() - start.getTime());
          }, 0) || 0;

        const totalMillis =
          (clockOut || getNowUTC()).getTime() - (clockIn?.getTime() || 0);

        const netMillis = totalMillis - totalBreakMillis;

        return {
          id: s.id,
          clockInTime: s.clockInTime,
          clockOutTime: s.clockOutTime,
          clockInFormatted: formatTimeAMPM(s.clockInTime),
          clockOutFormatted: s.clockOutTime ? formatTimeAMPM(s.clockOutTime) : "--",
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

  // ✅ IMPORTANT: do not convert here, just store raw backend strings
const fetchActiveSession = useCallback(async () => {
  setSessionLoading(true); // start loading
  try {
    const res = await workSessionApi.getActiveSession();
    if (res.data) {
      setCurrentSession({
        ...res.data,
        clockInTime: res.data.clockInTime,
        clockOutTime: res.data.clockOutTime || null,
        breaks: res.data.breaks || [],
        onBreak: res.data.breaks?.some((b) => !b.endTime) || false,
        currentBreakId: res.data.breaks?.find((b) => !b.endTime)?.id || null,
        sessionId: res.data.id,
      });
    } else {
      setCurrentSession(null);
    }
  } catch (err) {
    console.error(err);
    setCurrentSession(null);
  }
  setSessionLoading(false); // done loading
}, []);


  useEffect(() => {
    fetchCurrentUser();
    fetchActiveSession();
  }, [fetchCurrentUser, fetchActiveSession]);

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await workSessionApi.clockIn();

      try {
        await attendanceApi.markAttendance();
        Swal.fire({
          icon: "success",
          title: "Attendance Marked",
          text: "You are present today!",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        if (err.response?.status === 400) {
          console.log("Attendance already marked for today.");
        } else {
          console.error("Attendance API error:", err);
        }
      }

      await fetchActiveSession();
      if (employee?.id) await fetchHistory(employee.id);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Clock in failed.", "error");
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    if (!currentSession?.sessionId) return;

    const result = await Swal.fire({
      title: "Clock Out",
      text: "Do you want to clock out now?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, clock out!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await workSessionApi.clockOut(currentSession.sessionId);
      await fetchActiveSession();
      if (employee?.id) await fetchHistory(employee.id);

      Swal.fire({
        icon: "success",
        title: "Clocked Out!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Clock out failed.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
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
      await fetchActiveSession();
      if (employee?.id) await fetchHistory(employee.id);
    } catch (err) {
      console.error(err);
      alert("Break operation failed.");
    }
    setLoading(false);
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} username={employee?.fullName} />

        <div className="p-4">
          <PageHeading title="Employee Dashboard" />

          <h4 className="mb-4" style={{ color: "#055993" }}>
            Welcome, {employee?.fullName}
          </h4>

<CardContainer title="Current Session">
  {sessionLoading ? (
    <div className="text-center p-4">
      <p>Loading current session...</p>
    </div>
  ) : currentSession ? (
    <CurrentSessionCard
      currentSession={currentSession}
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
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        }}
      >
        {loading ? "Loading..." : "Clock In"}
      </div>
    </div>
  )}
</CardContainer>



          <CardContainer title="Recent Work Sessions">
            <div className="d-flex flex-column gap-3">
              {history.slice(0, 3).map((h, idx) => (
                <div key={idx} className="p-3 border rounded shadow-sm bg-light">
                  <h5 className="mb-2" style={{ color: "#055993" }}>
                    {formatPakistanDateLabel(h.clockInTime)}
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
                <Button variant="primary" onClick={() => navigate("/employee/work-history")}>
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
