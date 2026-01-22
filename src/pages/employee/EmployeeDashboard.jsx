import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Spinner, Badge } from "react-bootstrap";
import Swal from "sweetalert2";

// Components
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import CurrentSessionCard from "../../components/CurrentSessionCard";
import CardContainer from "../../components/CardContainer";

// APIs
import * as attendanceApi from "../../api/attendanceApi";
import * as workSessionApi from "../../api/workSessionApi";
import * as breakApi from "../../api/breakApi";
import * as employeeApi from "../../api/employeeApi";
import * as employeeShiftApi from "../../api/employeeShiftApi"; // Ensure this is imported

// Utils
import {
  formatTimeAMPM,
  formatPakistanDateLabel,
} from "../../utils/time";

const EmployeeDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data States
  const [employee, setEmployee] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [shiftDetails, setShiftDetails] = useState(null); // New State for Shift
  const [history, setHistory] = useState([]);

  // Loading States
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // --- Helper: Parse ISO Duration ---
  const parseDurationString = (durationStr) => {
    if (!durationStr) return "--";
    const hoursMatch = durationStr.match(/(\d+)H/);
    const minsMatch = durationStr.match(/(\d+)M/);
    const h = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const m = minsMatch ? parseInt(minsMatch[1]) : 0;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // --- Helper: Format Shift Time (18:00:00 -> 06:00 PM) ---
  const formatShiftTime = (timeStr) => {
    if (!timeStr) return "--";
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- Fetching Logic (Parallel) ---
  const fetchHistory = useCallback(async (empId) => {
    if (!empId) return;
    try {
      const res = await workSessionApi.getFirst3WorkSessions(empId);
      if (res.data && Array.isArray(res.data)) setHistory(res.data);
    } catch (err) {
      console.error("History fetch error", err);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch User, Session, and Shift Details in Parallel
      const [userRes, sessionRes, shiftRes] = await Promise.all([
        employeeApi.getMyDetails(),
        workSessionApi.getActiveSession(),
        employeeShiftApi.getMyShiftDetails().catch(err => ({ data: null })) // Catch error if no shift assigned
      ]);

      const empData = userRes.data;
      setEmployee(empData);
      setShiftDetails(shiftRes.data);

      if (sessionRes.data) {
        const sData = sessionRes.data;
        setCurrentSession({
          ...sData,
          sessionId: sData.id,
          onBreak: sData.breaks?.some((b) => !b.endTime) || false,
          currentBreakId: sData.breaks?.find((b) => !b.endTime)?.id || null,
        });
      } else {
        setCurrentSession(null);
      }

      if (empData?.id) fetchHistory(empData.id);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      // Fallback mechanism
      try {
        const meRes = await workSessionApi.getMe();
        setEmployee({ ...meRes.data, id: meRes.data.employeeId });
        fetchHistory(meRes.data.employeeId);
      } catch (e) { /* ignore */ }
    } finally {
      setPageLoading(false);
    }
  }, [fetchHistory]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshSession = async () => {
    const sessionRes = await workSessionApi.getActiveSession();
    if (sessionRes.data) {
      const sData = sessionRes.data;
      setCurrentSession({
        ...sData,
        sessionId: sData.id,
        onBreak: sData.breaks?.some((b) => !b.endTime) || false,
        currentBreakId: sData.breaks?.find((b) => !b.endTime)?.id || null,
      });
    } else {
      setCurrentSession(null);
    }
    if (employee?.id) await fetchHistory(employee.id);
  };

  // --- Actions ---

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      // 1. Start Work Session
      await workSessionApi.clockIn();

      // 2. Mark Attendance
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
        // If already marked (400), show welcome back toast
        if (err.response && err.response.status === 400) {
           const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
           Toast.fire({ icon: 'info', title: 'Welcome Back' });
        } else {
           const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
           Toast.fire({ icon: 'success', title: 'Clocked In Successfully' });
        }
      }

      await refreshSession();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Clock in failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentSession?.sessionId) return;
    const result = await Swal.fire({
      title: "Clock Out?",
      text: "Are you sure you want to end your shift?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, Clock Out",
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await workSessionApi.clockOut(currentSession.sessionId);
      await refreshSession();
      Swal.fire({ icon: "success", title: "Session Ended", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", "Could not clock out.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTakeBreak = async () => {
    if (!currentSession?.sessionId) return;
    setActionLoading(true);
    try {
      if (!currentSession.onBreak) {
        await breakApi.startBreak(currentSession.sessionId);
      } else {
        await breakApi.endBreak(currentSession.currentBreakId);
      }
      await refreshSession();
    } catch (err) {
      Swal.fire("Error", "Break action failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- Quick Action Component ---
  const QuickActionBtn = ({ icon, label, path, color }) => (
    <div 
        className="col-6 col-md-3 mb-3 mb-md-0" 
        onClick={() => navigate(path)}
        style={{ cursor: 'pointer' }}
    >
        <div className="p-3 bg-white border rounded shadow-sm text-center h-100 hover-shadow transition-all">
            <div className={`mb-2 text-${color}`} style={{ fontSize: '1.5rem' }}>
                <i className={`bi ${icon}`}></i>
            </div>
            <div className="small fw-bold text-dark">{label}</div>
        </div>
    </div>
  );

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1 bg-light d-flex flex-column" style={{ minHeight: "100vh" }}>
        <TopNavbar 
          toggleSidebar={toggleSidebar} 
          username={localStorage.getItem("name")} 
          role={localStorage.getItem("role")} 
        />

        <div className="container-fluid p-4">
          
          {pageLoading ? (
             <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
                <Spinner animation="border" variant="primary" />
             </div>
          ) : (
            <>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="fw-bold text-dark mb-1">Dashboard</h4>
                  <p className="text-muted mb-0">
                    Welcome, <span className="fw-bold text-primary">{employee?.fullName}</span>
                  </p>
                </div>
                <div className="d-none d-md-block text-end">
                    <Badge bg="light" text="dark" className="border px-3 py-2 fw-normal">
                        <i className="bi bi-calendar-event me-2"></i>
                        {formatPakistanDateLabel(new Date().toISOString())}
                    </Badge>
                </div>
              </div>

              {/* Quick Actions Row */}
              <Row className="mb-4 g-3">
                 <QuickActionBtn icon="bi-person-badge" label="My Profile" path="/employee/my-profile" color="primary" />
                 <QuickActionBtn icon="bi-clock-history" label="Work History" path="/employee/work-history" color="success" />
                 <QuickActionBtn icon="bi-calendar-check" label="Attendance" path="/employee/attendance-history" color="info" />
                 <QuickActionBtn icon="bi-envelope-paper" label="Apply Leave" path="/employee/leave/apply" color="warning" />
              </Row>

              <Row className="g-4">
                {/* Main Session Card */}
                <Col lg={8}>
                  <CardContainer title="My Workspace">
                    {currentSession ? (
                        <CurrentSessionCard
                            currentSession={currentSession}
                            handleClockIn={handleClockIn}
                            handleClockOut={handleClockOut}
                            handleTakeBreak={handleTakeBreak}
                            loading={actionLoading}
                        />
                    ) : (
                        // --- THE ROUND CLOCK IN BUTTON ---
                        <div className="text-center py-4">
                            <div 
                                onClick={!actionLoading ? handleClockIn : null}
                                className="clock-btn shadow-lg mx-auto mb-4"
                                style={{
                                    width: "130px",
                                    height: "130px",
                                    borderRadius: "50%",
                                    background: actionLoading 
                                        ? "#e9ecef" 
                                        : "linear-gradient(145deg, #28a745, #20c997)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: actionLoading ? "default" : "pointer",
                                    transition: "transform 0.2s ease",
                                    border: "3px solid rgba(255,255,255,0.3)"
                                }}
                                onMouseDown={(e) => !actionLoading && (e.currentTarget.style.transform = "scale(0.95)")}
                                onMouseUp={(e) => !actionLoading && (e.currentTarget.style.transform = "scale(1)")}
                            >
                                {actionLoading ? (
                                    <Spinner animation="border" variant="secondary" />
                                ) : (
                                    <>
                                        <i className="bi bi-fingerprint text-white" style={{ fontSize: "2rem" }}></i>
                                        <span className="text-white fw-bold mt-2" style={{ fontSize: "1rem", letterSpacing: "1px" }}>CLOCK IN</span>
                                    </>
                                )}
                            </div>
                            <h5 className="text-muted">Not working yet?</h5>
                            <p className="text-muted small">Click the button above to start your day.</p>
                        </div>
                    )}
                  </CardContainer>
                </Col>

                {/* Right Side: Profile & Shift Summary */}
                <Col lg={4}>
                   <div className="d-flex flex-column gap-4 h-100">
                        {/* Profile & Shift Card */}
                        <Card className="border-0 shadow-sm">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 text-primary">
                                        <span className="h4 m-0 fw-bold">{employee?.fullName?.charAt(0)}</span>
                                    </div>
                                    <div className="ms-3">
                                        <h6 className="mb-0 fw-bold">{employee?.fullName}</h6>
                                        <small className="text-muted">{employee?.designation || "Employee"}</small>
                                        <div className="mt-1">
                                            <Badge bg="success" className="me-1">Active</Badge>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Shift Details Section */}
                                <div className="bg-light p-3 rounded border">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="small text-muted fw-bold text-uppercase">Today's Shift</span>
                                        <i className="bi bi-brightness-high text-warning"></i>
                                    </div>
                                    {shiftDetails ? (
                                        <>
                                            <h6 className="mb-1 fw-bold text-dark">{shiftDetails.shiftName}</h6>
                                            <div className="d-flex align-items-center small text-secondary">
                                                <i className="bi bi-clock me-2"></i>
                                                {formatShiftTime(shiftDetails.startsAt)} - {formatShiftTime(shiftDetails.endsAt)}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="small text-muted">No Shift Assigned</div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Mini Recent History */}
                        <Card className="border-0 shadow-sm flex-grow-1">
                            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                                <h6 className="mb-0 fw-bold">Recent Activity</h6>
                                <small 
                                    className="text-primary cursor-pointer" 
                                    style={{cursor: 'pointer'}}
                                    onClick={() => navigate('/employee/work-history')}
                                >
                                    View All
                                </small>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {history.length === 0 ? (
                                    <div className="text-center text-muted py-4 small">No recent activity</div>
                                ) : (
                                    <ul className="list-group list-group-flush">
                                        {history.slice(0, 3).map((h, i) => (
                                            <li key={i} className="list-group-item px-4 py-3 border-light">
                                                <div className="d-flex justify-content-between">
                                                    <div>
                                                        <span className="fw-bold text-dark d-block" style={{fontSize: '0.9rem'}}>
                                                            {formatPakistanDateLabel(h.clockInTime)}
                                                        </span>
                                                        <small className="text-muted">
                                                            {formatTimeAMPM(h.clockInTime)} 
                                                            {h.clockOutTime ? ` - ${formatTimeAMPM(h.clockOutTime)}` : " ..."}
                                                        </small>
                                                    </div>
                                                    <div className="text-end">
                                                        {h.status === 'Working' ? (
                                                            <Badge bg="success">Active</Badge>
                                                        ) : (
                                                            <span className="fw-bold text-dark bg-light px-2 py-1 rounded small">
                                                                {parseDurationString(h.totalWorkingHours)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Card.Body>
                        </Card>
                   </div>
                </Col>
              </Row>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;