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
import { getMyShift } from "../../api/shiftApi"; // Ensure this is imported

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
  const [manager, setManager] = useState({ fullName: "Manager", id: null });
  const [currentSession, setCurrentSession] = useState(null);
  const [myShift, setMyShift] = useState(null); // Store shift details
  
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
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const COLORS = ["#28a745", "#dc3545"];

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

  const formatShiftTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // --- Fetch Logic ---
  const fetchDashboardData = useCallback(async () => {
    try {
      const [meRes, sessionRes, countRes, teamSessionsRes, attendanceRes, shiftRes] = await Promise.all([
        workSessionApi.getMe(),
        workSessionApi.getActiveSession(),
        getEmployeeShiftCountByManager(),
        workSessionApi.getManagerWorkSessionHistory(),
        attendanceApi.getManagerAttendanceHistory(),
        getMyShift().catch(() => ({ data: null })) // Handle if no shift assigned
      ]);

      setManager({ fullName: meRes.data.fullName, id: meRes.data.employeeId, role: meRes.data.role });
      
      // Store Shift Details
      if (shiftRes.data) {
        setMyShift(shiftRes.data);
      }

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

      const totalMembers = countRes.data || 0;
      const allSessions = teamSessionsRes.data || [];
      const allAttendance = attendanceRes.data || [];
      const todayStr = new Date().toISOString().split("T")[0];

      const presentCount = allAttendance.filter(a => a.attendanceDate === todayStr && a.present).length;
      
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
      
      const recent = allSessions
        .filter(s => s.clockOutTime)
        .sort((a, b) => parseApiDate(b.clockInTime) - parseApiDate(a.clockInTime))
        .slice(0, 5);
      setRecentTeamSessions(recent);

    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Actions ---
  const refreshManagerSession = async () => {
    const res = await workSessionApi.getActiveSession();
    setCurrentSession(res.data ? {
      ...res.data,
      sessionId: res.data.id,
      onBreak: res.data.breaks?.some(b => !b.endTime),
      currentBreakId: res.data.breaks?.find(b => !b.endTime)?.id
    } : null);
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      await workSessionApi.clockIn();
      try { await attendanceApi.markAttendance(); } catch (e) {} 
      await refreshManagerSession();
    } catch (err) { Swal.fire("Error", "Clock in failed", "error"); } 
    finally { setActionLoading(false); }
  };

  const handleClockOut = async () => {
    if(!currentSession) return;
    const result = await Swal.fire({ title: "End Shift?", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33" });
    if (!result.isConfirmed) return;
    setActionLoading(true);
    try {
      await workSessionApi.clockOut(currentSession.sessionId);
      await refreshManagerSession();
    } catch (err) { Swal.fire("Error", "Failed to clock out", "error"); } 
    finally { setActionLoading(false); }
  };

  const handleTakeBreak = async () => {
    if(!currentSession) return;
    setActionLoading(true);
    try {
      currentSession.onBreak 
        ? await breakApi.endBreak(currentSession.currentBreakId)
        : await breakApi.startBreak(currentSession.sessionId);
      await refreshManagerSession();
    } catch (err) { Swal.fire("Error", "Break action failed", "error"); } 
    finally { setActionLoading(false); }
  };

  // --- UI Components ---
  const StatCard = ({ title, value, icon, color, subtext }) => (
    <Card className="border-0 shadow-sm h-100 stat-card">
        <Card.Body className="d-flex align-items-center p-3">
            <div className={`rounded-circle p-3 d-flex align-items-center justify-content-center text-white flex-shrink-0`} 
                 style={{ width: 50, height: 50, backgroundColor: color }}>
                <i className={`bi ${icon} fs-4`}></i>
            </div>
            <div className="ms-3 overflow-hidden">
                <h3 className="mb-0 fw-bold text-truncate">{value}</h3>
                <div className="small text-muted fw-bold text-truncate">{title}</div>
                {subtext && <div className="text-muted text-truncate" style={{fontSize: "0.7rem"}}>{subtext}</div>}
            </div>
        </Card.Body>
    </Card>
  );

  const QuickActionBtn = ({ label, path, icon, color }) => (
    <Button 
        variant="white" 
        className="w-100 h-100 border shadow-sm py-3 px-3 text-start d-flex align-items-center gap-3 hover-shadow"
        onClick={() => navigate(path)}
    >
        <div className={`text-${color} fs-4`}><i className={`bi ${icon}`}></i></div>
        <div className="fw-bold text-dark lh-1 text-truncate">{label}</div>
    </Button>
  );

  return (
    <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
      <ManagerSidebar isOpen={isSidebarOpen} onLogout={onLogout} toggleSidebar={toggleSidebar}/>
      
      <div className="flex-grow-1 d-flex flex-column bg-light" style={{ minWidth: 0 }}>
        <Navbar toggleSidebar={toggleSidebar} username={manager.fullName} role="Manager" />

        <div className="p-3 p-md-4 container-fluid" style={{ overflowY: "auto", flex: 1 }}>
          
          {pageLoading ? (
             <div className="d-flex justify-content-center align-items-center" style={{height: "60vh"}}>
                 <Spinner animation="border" variant="primary" />
             </div>
          ) : (
            <>
              {/* Header with Shift Info */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
                <div>
                    <h4 className="fw-bold text-dark mb-0">Manager Dashboard</h4>
                    <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="text-muted small">Welcome back, <span className="text-primary fw-bold">{manager.fullName}</span></span>
                        {myShift && (
                            <Badge bg="info" className="text-dark border small fw-normal">
                                Shift: {formatShiftTime(myShift.startsAt)} - {formatShiftTime(myShift.endsAt)}
                            </Badge>
                        )}
                    </div>
                </div>
                <Badge bg="white" text="dark" className="border px-3 py-2 shadow-sm fw-normal align-self-md-center align-self-start">
                    {formatPakistanDateLabel(new Date().toISOString())}
                </Badge>
              </div>

              {/* ROW 1: My Session & Quick Actions */}
              <Row className="g-3 mb-4">
                <Col xs={12} lg={7} xl={8}>
                    <CardContainer title="My Workspace" className="h-100">
                        {currentSession ? (
                            <CurrentSessionCard 
                                currentSession={currentSession}
                                handleClockIn={handleClockIn}
                                handleClockOut={handleClockOut}
                                handleTakeBreak={handleTakeBreak}
                                loading={actionLoading}
                            />
                        ) : (
                            <div className="text-center py-4 d-flex align-items-center justify-content-center flex-column h-100">
                                <Button 
                                    onClick={handleClockIn}
                                    variant="success" 
                                    className="rounded-pill px-5 py-3 fw-bold shadow-lg d-flex align-items-center gap-2"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <Spinner size="sm"/> : <><i className="bi bi-fingerprint"></i> CLOCK IN</>}
                                </Button>
                                <p className="text-muted mt-2 small">Start session to track hours</p>
                            </div>
                        )}
                    </CardContainer>
                </Col>
                <Col xs={12} lg={5} xl={4}>
                    <CardContainer title="Team Actions" className="h-100">
                        <div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                            <QuickActionBtn label="Attendance" path="/manager/team-attendance" icon="bi-calendar-check" color="success" />
                            <QuickActionBtn label="Work Sessions" path="/manager/team-sessions" icon="bi-clock-history" color="primary" />
                            <QuickActionBtn label="Leave Requests" path="/manager/team-leave" icon="bi-envelope-paper" color="warning" />
                            {/* <QuickActionBtn label="My History" path="/employee/work-history" icon="bi-journal-text" color="info" /> */}
                        </div>
                    </CardContainer>
                </Col>
              </Row>

              {/* ROW 2: Team Stats - Responsive Grid */}
              <h5 className="fw-bold text-dark mb-3">Team Overview</h5>
              <Row className="g-3 mb-4">
                <Col xs={6} md={3}>
                    <StatCard title="Total Team" value={teamStats.totalMembers} icon="bi-people-fill" color="#055993" />
                </Col>
                <Col xs={6} md={3}>
                    <StatCard title="Present" value={teamStats.present} icon="bi-person-check-fill" color="#28a745" subtext={`${teamStats.absent} Absent`} />
                </Col>
                <Col xs={6} md={3}>
                    <StatCard title="Active Now" value={teamStats.active} icon="bi-activity" color="#17a2b8" />
                </Col>
                <Col xs={6} md={3}>
                    <StatCard title="On Break" value={teamStats.onBreak} icon="bi-cup-hot-fill" color="#ffc107" />
                </Col>
              </Row>

              {/* ROW 3: Charts & Active Table */}
              <Row className="g-3 mb-4">
                {/* Charts - Full width on mobile, 4 cols on desktop */}
                <Col xs={12} lg={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold py-3">Attendance Ratio</Card.Header>
                        <Card.Body className="d-flex justify-content-center align-items-center">
                            {teamStats.totalMembers > 0 ? (
                                <div style={{ width: "100%", height: 250 }}>
                                    <ResponsiveContainer>
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
                                </div>
                            ) : <div className="text-center py-5 text-muted">No Data</div>}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Active Members Table - Full width on mobile, 8 cols on desktop */}
                <Col xs={12} lg={8}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                            <span>Active Team Members</span>
                            <Badge bg="success">{activeTeamMembers.length} Online</Badge>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                {activeTeamMembers.length > 0 ? (
                                    <Table hover className="mb-0 align-middle text-nowrap">
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
                                    <div className="text-center py-5 text-muted">No active members.</div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
              </Row>

              {/* ROW 4: Recent Completed Sessions */}
              <Row>
                <Col xs={12}>
                    <CardContainer title="Recently Completed Sessions">
                        <div className="table-responsive">
                            {recentTeamSessions.length > 0 ? (
                                <Table hover className="align-middle text-nowrap mb-0">
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
                            ) : <div className="p-4 text-center text-muted">No recent sessions found.</div>}
                        </div>
                        <div className="text-end mt-2">
                             <Button variant="link" size="sm" onClick={() => navigate("/manager/team-sessions")}>View All Activity &rarr;</Button>
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