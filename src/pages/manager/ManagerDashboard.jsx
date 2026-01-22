import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Table, Badge, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Components
import ManagerSidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import CurrentSessionCard from "../../components/CurrentSessionCard";
import CardContainer from "../../components/CardContainer";

// APIs
import { getEmployeeShiftCountByManager } from "../../api/employeeShiftApi";
import * as attendanceApi from "../../api/attendanceApi";
import * as workSessionApi from "../../api/workSessionApi";
import * as breakApi from "../../api/breakApi";

// Utils
import {
  formatTimeAMPM,
  getNowUTC,
  formatPakistanDateLabel,
  parseApiDate,
} from "../../utils/time";

const ManagerDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- State ---
  // Manager's Personal State
  const [manager, setManager] = useState({ fullName: "Manager", id: null });
  const [currentSession, setCurrentSession] = useState(null);
  const [myHistory, setMyHistory] = useState([]);

  // Team State
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    present: 0,
    active: 0,
    onBreak: 0,
    absent: 0,
  });
  const [recentTeamSessions, setRecentTeamSessions] = useState([]);
  const [activeTeamMembers, setActiveTeamMembers] = useState([]);

  // Loading States
  const [pageLoading, setPageLoading] = useState(true); // Initial Load
  const [actionLoading, setActionLoading] = useState(false); // Button Clicks

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const COLORS = ["#28a745", "#dc3545"]; // Green (Present), Red (Absent)

  // --- Helpers ---
  const formatDuration = (hoursDecimal) => {
    if (isNaN(hoursDecimal) || hoursDecimal <= 0) return "0h 0m";
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const calculateDuration = (startStr, endStr = null, breaks = []) => {
    const start = parseApiDate(startStr);
    const end = parseApiDate(endStr) || getNowUTC();
    if (!start) return 0;

    const totalBreakMillis = breaks.reduce((sum, b) => {
      const bStart = parseApiDate(b.startTime);
      const bEnd = parseApiDate(b.endTime) || getNowUTC();
      return bStart ? sum + (bEnd.getTime() - bStart.getTime()) : sum;
    }, 0);

    return (end.getTime() - start.getTime() - totalBreakMillis) / 1000 / 3600;
  };

  // --- Core Fetching Logic (Parallelized) ---
  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch everything in parallel to reduce load time
      const [
        meRes,
        sessionRes,
        countRes,
        teamSessionsRes,
        attendanceRes
      ] = await Promise.all([
        workSessionApi.getMe(),
        workSessionApi.getActiveSession(),
        getEmployeeShiftCountByManager(),
        workSessionApi.getManagerWorkSessionHistory(), // Assuming this gets history
        attendanceApi.getManagerAttendanceHistory()
      ]);

      // 1. Setup Manager Data
      const empId = meRes.data.employeeId;
      setManager({
        fullName: meRes.data.fullName,
        id: empId,
        role: meRes.data.role
      });
      localStorage.setItem("name", meRes.data.fullName);

      // 2. Setup Manager Session
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

      // 3. Fetch Manager History (Separate call as it's specific)
      if (empId) {
        workSessionApi.getFirst3WorkSessions(empId).then(res => {
             if(res.data) setMyHistory(res.data);
        }).catch(err => console.error("My history failed", err));
      }

      // 4. Calculate Team Stats
      const totalMembers = countRes.data || 0;
      const allSessions = teamSessionsRes.data || [];
      const allAttendance = attendanceRes.data || [];
      const todayStr = new Date().toISOString().split("T")[0];

      // Present Today
      const presentCount = allAttendance.filter(a => a.attendanceDate === todayStr && a.present).length;
      
      // Active & Break Status
      const activeSessions = allSessions.filter(s => !s.clockOutTime && s.clockInTime?.startsWith(todayStr));
      const onBreakCount = activeSessions.filter(s => s.breaks?.some(b => !b.endTime)).length;
      const activeCount = activeSessions.length;

      setTeamStats({
        totalMembers,
        present: presentCount,
        absent: Math.max(0, totalMembers - presentCount),
        active: activeCount,
        onBreak: onBreakCount
      });

      setActiveTeamMembers(activeSessions);
      
      // Recent Completed Sessions
      const recent = allSessions
        .filter(s => s.clockOutTime)
        .sort((a, b) => parseApiDate(b.clockInTime) - parseApiDate(a.clockInTime))
        .slice(0, 5);
      setRecentTeamSessions(recent);

    } catch (err) {
      console.error("Dashboard Load Error:", err);
      // Fallback for session if main fetch fails
      try {
        const fallbackSession = await workSessionApi.getActiveSession();
        setCurrentSession(fallbackSession.data || null);
      } catch (e) { /* ignore */ }
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Manager Actions (Clock In/Out) ---
  const refreshManagerSession = async () => {
    const res = await workSessionApi.getActiveSession();
    setCurrentSession(res.data ? {
      ...res.data,
      sessionId: res.data.id,
      onBreak: res.data.breaks?.some(b => !b.endTime),
      currentBreakId: res.data.breaks?.find(b => !b.endTime)?.id
    } : null);
    if(manager.id) {
       const hRes = await workSessionApi.getFirst3WorkSessions(manager.id);
       setMyHistory(hRes.data || []);
    }
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      await workSessionApi.clockIn();
      try {
        await attendanceApi.markAttendance();
        Swal.fire({ icon: "success", title: "Attendance Marked", timer: 1500, showConfirmButton: false });
      } catch (err) {
         // Silently handle 400 (already marked)
         const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
         Toast.fire({ icon: 'success', title: 'Session Started' });
      }
      await refreshManagerSession();
    } catch (err) {
      Swal.fire("Error", "Clock in failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if(!currentSession) return;
    const result = await Swal.fire({
      title: "End Shift?",
      text: "Clock out now?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes",
    });
    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await workSessionApi.clockOut(currentSession.sessionId);
      await refreshManagerSession();
      Swal.fire({ icon: "success", title: "Clocked Out", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", "Failed to clock out", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTakeBreak = async () => {
    if(!currentSession) return;
    setActionLoading(true);
    try {
      currentSession.onBreak 
        ? await breakApi.endBreak(currentSession.currentBreakId)
        : await breakApi.startBreak(currentSession.sessionId);
      await refreshManagerSession();
    } catch (err) {
      Swal.fire("Error", "Break action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- Components ---
  const StatCard = ({ title, value, icon, color, subtext }) => (
    <Card className="border-1 shadow-sm h-100">
        <Card.Body className="d-flex align-items-center">
            <div className={`rounded-circle p-3 d-flex align-items-center justify-content-center text-white`} 
                 style={{ width: 50, height: 50, backgroundColor: color }}>
                <i className={`bi ${icon} fs-4`}></i>
            </div>
            <div className="ms-3">
                <h3 className="mb-0 fw-bold">{value}</h3>
                <div className="small text-muted fw-bold">{title}</div>
                {subtext && <div className="text-muted" style={{fontSize: "0.7rem"}}>{subtext}</div>}
            </div>
        </Card.Body>
    </Card>
  );

  const QuickActionBtn = ({ label, path, icon, color }) => (
    <Button 
        variant="white" 
        className="w-100 h-100 border shadow-sm py-3 text-start d-flex align-items-center gap-3 hover-shadow"
        onClick={() => navigate(path)}
    >
        <div className={`text-${color} fs-4`}><i className={`bi ${icon}`}></i></div>
        <div className="fw-bold text-dark lh-1">{label}</div>
    </Button>
  );

  return (
    <div className="d-flex">
      <ManagerSidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1 bg-light d-flex flex-column" style={{ minHeight: "100vh" }}>
        <Navbar toggleSidebar={toggleSidebar} username={manager.fullName} role="Manager" />

        <div className="container-fluid p-4">
          
          {pageLoading ? (
             <div className="d-flex justify-content-center align-items-center" style={{height: "60vh"}}>
                 <Spinner animation="border" variant="primary" />
             </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold text-dark mb-0">Manager Dashboard</h4>
                    <p className="text-muted mb-0">Overview for <span className="text-primary fw-bold">{manager.fullName}</span></p>
                </div>
                <Badge bg="white" text="dark" className="border px-3 py-2 shadow-sm fw-normal">
                    {formatPakistanDateLabel(new Date().toISOString())}
                </Badge>
              </div>

              {/* ROW 1: My Session & Quick Actions */}
              <Row className="g-4 mb-4">
                <Col lg={7} xl={8}>
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
                            // Minimal Clock In for Manager
                            <div className="text-center py-4 d-flex align-items-center justify-content-center flex-column">
                                <Button 
                                    onClick={handleClockIn}
                                    variant="success" 
                                    className="rounded-pill px-5 py-3 fw-bold shadow-lg d-flex align-items-center gap-2"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <Spinner size="sm"/> : <><i className="bi bi-fingerprint"></i> CLOCK IN</>}
                                </Button>
                                <p className="text-muted mt-2 small">Start your own session to track hours</p>
                            </div>
                        )}
                    </CardContainer>
                </Col>
                <Col lg={5} xl={4}>
                    <CardContainer title="Team Actions">
                        <div className="d-grid gap-3">
                            <QuickActionBtn label="Attendance" path="/manager/team-attendance" icon="bi-calendar-check" color="success" />
                            <QuickActionBtn label="Work Sessions" path="/manager/team-sessions" icon="bi-clock-history" color="primary" />
                            <QuickActionBtn label="Leave Requests" path="/manager/leave-requests" icon="bi-envelope-paper" color="warning" />
                            <QuickActionBtn label="My History" path="/manager/my-work-history" icon="bi-journal-text" color="info" />
                        </div>
                    </CardContainer>
                </Col>
              </Row>

              {/* ROW 2: Team Stats */}
              <h5 className="fw-bold text-dark mb-3">Team Overview</h5>
              <Row className="g-3 mb-4">
                <Col sm={6} lg={3}>
                    <StatCard title="Total Team" value={teamStats.totalMembers} icon="bi-people-fill" color="#055993" />
                </Col>
                <Col sm={6} lg={3}>
                    <StatCard title="Present" value={teamStats.present} icon="bi-person-check-fill" color="#28a745" subtext={`${teamStats.absent} Absent`} />
                </Col>
                <Col sm={6} lg={3}>
                    <StatCard title="Active Now" value={teamStats.active} icon="bi-activity" color="#17a2b8" />
                </Col>
                <Col sm={6} lg={3}>
                    <StatCard title="On Break" value={teamStats.onBreak} icon="bi-cup-hot-fill" color="#ffc107" />
                </Col>
              </Row>

              {/* ROW 3: Charts & Tables */}
              <Row className="g-4">
                {/* Charts */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold py-3">Attendance Ratio</Card.Header>
                        <Card.Body>
                            {teamStats.totalMembers > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: "Present", value: teamStats.present },
                                                { name: "Absent", value: teamStats.absent }
                                            ]}
                                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                        >
                                            <Cell fill={COLORS[0]} />
                                            <Cell fill={COLORS[1]} />
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="text-center py-5 text-muted">No Data</div>}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Active Members Table */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                            <span>Active Team Members</span>
                            <Badge bg="success">{activeTeamMembers.length} Online</Badge>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {activeTeamMembers.length > 0 ? (
                                <Table hover responsive className="mb-0 align-middle">
                                    <thead className="bg-light text-muted small">
                                        <tr>
                                            <th className="ps-4">Employee</th>
                                            <th>Clock In</th>
                                            <th>Duration</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeTeamMembers.map((s, i) => {
                                            const duration = calculateDuration(s.clockInTime, null, s.breaks);
                                            const isOnBreak = s.breaks?.some(b => !b.endTime);
                                            return (
                                                <tr key={i}>
                                                    <td className="ps-4 fw-bold text-dark">{s.employeeName}</td>
                                                    <td>{formatTimeAMPM(s.clockInTime)}</td>
                                                    <td>{formatDuration(duration)}</td>
                                                    <td>
                                                        <Badge bg={isOnBreak ? 'warning' : 'success'}>
                                                            {isOnBreak ? 'On Break' : 'Working'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-5 text-muted">No team members currently active.</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
              </Row>

              {/* ROW 4: Recent Completed Sessions */}
              <Row className="mt-4">
                <Col>
                    <CardContainer title="Recently Completed Sessions">
                        {recentTeamSessions.length > 0 ? (
                            <div className="table-responsive">
                                <Table hover className="align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Employee</th>
                                            <th>Date</th>
                                            <th>Shift Time</th>
                                            <th>Working Hours</th>
                                            <th>Break Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTeamSessions.map((s, i) => {
                                            const workHrs = calculateDuration(s.clockInTime, s.clockOutTime, s.breaks);
                                            const breakHrs = s.breaks?.reduce((sum, b) => {
                                                const start = parseApiDate(b.startTime);
                                                const end = parseApiDate(b.endTime) || getNowUTC();
                                                return start ? sum + (end - start) : sum;
                                            }, 0) / 1000 / 3600 || 0;

                                            return (
                                                <tr key={i}>
                                                    <td className="fw-bold">{s.employeeName}</td>
                                                    <td>{formatPakistanDateLabel(s.clockInTime)}</td>
                                                    <td>
                                                        <span className="badge bg-light text-dark border">
                                                            {formatTimeAMPM(s.clockInTime)} - {formatTimeAMPM(s.clockOutTime)}
                                                        </span>
                                                    </td>
                                                    <td className="fw-bold text-success">{formatDuration(workHrs)}</td>
                                                    <td className="text-muted">{formatDuration(breakHrs)}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        ) : <div className="p-3 text-center text-muted">No recent completed sessions found.</div>}
                        <div className="text-end mt-2">
                             <Button variant="link" onClick={() => navigate("/manager/team-sessions")}>View All Activity &rarr;</Button>
                        </div>
                    </CardContainer>
                </Col>
              </Row>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;