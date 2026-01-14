import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ManagerSidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import CardContainer from "../../components/CardContainer";
import CurrentSessionCard from "../../components/CurrentSessionCard";
import PageHeading from "../../components/PageHeading";
import { Button, Table, Badge, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";

import {
  getEmployeeListByManager,
  getEmployeeShiftCountByManager,
} from "../../api/employeeShiftApi";
import * as attendanceApi from "../../api/attendanceApi";
import * as workSessionApi from "../../api/workSessionApi";
import * as breakApi from "../../api/breakApi";

import {
  formatTimeAMPM,
  getNowUTC,
  formatPakistanDateLabel,
  parseApiDate,
} from "../../utils/time";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ManagerDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Manager's own data
  const [manager, setManager] = useState({ fullName: "Manager", id: null });
  const [currentSession, setCurrentSession] = useState(null);
  const [myHistory, setMyHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Team data
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [teamSessions, setTeamSessions] = useState([]);
  const [teamEmployees, setTeamEmployees] = useState([]); // Team employees list
  const [teamStats, setTeamStats] = useState({
    totalTeamMembers: 0,
    presentToday: 0,
    onBreak: 0,
    absentToday: 0,
    activeNow: 0,
  });
  const [teamLoading, setTeamLoading] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const COLORS = ["#28a745", "#dc3545", "#ffc107", "#17a2b8", "#6f42c1"];

  // ========== UTILITY FUNCTIONS ==========
  const formatDuration = (hoursDecimal) => {
    if (isNaN(hoursDecimal) || hoursDecimal < 0) return "0h 0m";
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  // ========== FETCH MANAGER'S OWN DATA ==========
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await workSessionApi.getMe();
      setManager({
        fullName: res.data.fullName,
        id: res.data.employeeId,
        role: res.data.role || "Manager",
      });
      localStorage.setItem("name", res.data.fullName);
      localStorage.setItem("role", res.data.role || "Manager");
      fetchMyHistory(res.data.employeeId);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  }, []);

  const fetchMyHistory = useCallback(async (employeeId) => {
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
            clockOutFormatted: s.clockOutTime
              ? formatTimeAMPM(s.clockOutTime)
              : "--",
            totalHours: formatDuration(totalMillis / 1000 / 3600),
            workingHours: formatDuration(netMillis / 1000 / 3600),
            breakHours: formatDuration(totalBreakMillis / 1000 / 3600),
          };
        });

        setMyHistory(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch my history:", err);
    }
  }, []);

  const fetchActiveSession = useCallback(async () => {
    setSessionLoading(true);
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
      console.error("Error fetching active session:", err);
      setCurrentSession(null);
    }
    setSessionLoading(false);
  }, []);

  // ========== FETCH TEAM DATA ==========
  const fetchTeamData = useCallback(async () => {
    setTeamLoading(true);
    try {
      // 1. Get total team members count using the new API
      const countRes = await getEmployeeShiftCountByManager();
      const totalTeamMembers = countRes.data || 0;

      // 2. Get team employees list (optional - for more details)
      let teamEmployeesList = [];
      try {
        const employeesRes = await getEmployeeListByManager();
        teamEmployeesList = employeesRes.data || [];
        setTeamEmployees(teamEmployeesList);
      } catch (err) {
        console.error("Error fetching team employees:", err);
      }

      // 3. Fetch team work sessions
      const sessionsRes = await workSessionApi.getManagerWorkSessionHistory();
      const allSessions = sessionsRes.data || [];
      setTeamSessions(allSessions);

      // 4. Fetch team attendance
      const attendanceRes = await attendanceApi.getManagerAttendanceHistory();
      const allAttendance = attendanceRes.data || [];
      setTeamAttendance(allAttendance);

      // 5. Calculate stats
      const todayStr = new Date().toISOString().split("T")[0];

      // Today's attendance - count present employees
      const todayAttendance = allAttendance.filter(
        (a) => a.attendanceDate === todayStr
      );
      const presentToday = todayAttendance.filter((a) => a.present).length;

      // Active sessions today (currently working)
      const activeSessions = allSessions.filter(
        (s) => !s.clockOutTime && s.clockInTime?.startsWith(todayStr)
      );
      const activeNow = activeSessions.length;

      // Currently on break (active sessions with ongoing break)
      const onBreak = activeSessions.filter((s) =>
        s.breaks?.some((b) => !b.endTime)
      ).length;

      // Absent = Total team members - Present today
      const absentToday = Math.max(0, totalTeamMembers - presentToday);

      setTeamStats({
        totalTeamMembers,
        presentToday,
        onBreak,
        absentToday,
        activeNow,
      });
    } catch (err) {
      console.error("Error fetching team data:", err);
    }
    setTeamLoading(false);
  }, []);

  // ========== CLOCK IN/OUT/BREAK HANDLERS ==========
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
      if (manager?.id) await fetchMyHistory(manager.id);
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
      if (manager?.id) await fetchMyHistory(manager.id);

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
      if (manager?.id) await fetchMyHistory(manager.id);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Break operation failed.", "error");
    }
    setLoading(false);
  };

  // ========== USE EFFECT ==========
  useEffect(() => {
    fetchCurrentUser();
    fetchActiveSession();
    fetchTeamData();
  }, [fetchCurrentUser, fetchActiveSession, fetchTeamData]);

  // ========== STATS CARDS DATA ==========
  const statsCards = [
    {
      title: "Team Members",
      value: teamStats.totalTeamMembers,
      description: "Total team size",
      color: "#055993",
      icon: "bi-people-fill",
    },
    {
      title: "Present Today",
      value: teamStats.presentToday,
      description: "Marked attendance",
      color: "#28a745",
      icon: "bi-person-check-fill",
    },
    // {
    //   title: "Active Now",
    //   value: teamStats.activeNow,
    //   description: "Currently working",
    //   color: "#17a2b8",
    //   icon: "bi-activity",
    // },
    {
      title: "On Break",
      value: teamStats.onBreak,
      description: "Taking break",
      color: "#ffc107",
      icon: "bi-cup-hot-fill",
    },
    {
      title: "Absent Today",
      value: teamStats.absentToday,
      description: "Not present",
      color: "#dc3545",
      icon: "bi-person-x-fill",
    },
  ];

  // Chart data
  const attendanceChartData = [
    { name: "Present", value: teamStats.presentToday },
    { name: "Absent", value: teamStats.absentToday },
  ];

  // Working status chart
  // const workingStatusChartData = [
  //   { name: "Working", value: teamStats.activeNow - teamStats.onBreak },
  //   { name: "On Break", value: teamStats.onBreak },
  //   { name: "Not Active", value: teamStats.presentToday - teamStats.activeNow },
  // ].filter((item) => item.value > 0);

  // Get recent team sessions (last 5)
  const recentTeamSessions = teamSessions
    .filter((s) => s.clockOutTime) // completed sessions
    .sort((a, b) => parseApiDate(b.clockInTime) - parseApiDate(a.clockInTime))
    .slice(0, 5);

  // Get currently active team members
  const activeTeamMembers = teamSessions.filter(
    (s) =>
      !s.clockOutTime &&
      s.clockInTime?.startsWith(new Date().toISOString().split("T")[0])
  );

  return (
    <div className="d-flex">
      <ManagerSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className="flex-grow-1">
        <Navbar
          toggleSidebar={toggleSidebar}
          username={manager.fullName}
          role={manager.role || "Manager"}
        />

        <div className="container-fluid p-3">
          <PageHeading title="Manager Dashboard" />

          <h4 className="mb-4" style={{ color: "#055993" }}>
            Welcome, {manager.fullName}!
          </h4>

          {/* ========== MY SESSION SECTION ========== */}
          <div className="row mb-4">
            <div className="col-12 col-lg-6">
              <CardContainer title="My Current Session">
                {sessionLoading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading session...</p>
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
                      onClick={!loading ? handleClockIn : undefined}
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        backgroundColor: loading ? "#6c757d" : "#28a745",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "1.2rem",
                        cursor: loading ? "not-allowed" : "pointer",
                        userSelect: "none",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                        transition: "transform 0.2s",
                      }}
                      onMouseOver={(e) => {
                        if (!loading)
                          e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {loading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        "Clock In"
                      )}
                    </div>
                  </div>
                )}
              </CardContainer>
            </div>

            <div className="col-12 col-lg-6">
              <CardContainer title="Quick Actions">
                <div className="d-grid gap-3">
                  <Button
                    variant="primary"
                    onClick={() => navigate("/manager/team-sessions")}
                  >
                    <i className="bi bi-people-fill me-2"></i>
                    View Team Work Sessions
                  </Button>

                  <Button
                    variant="success"
                    onClick={() => navigate("/manager/team-attendance")}
                  >
                    <i className="bi bi-calendar-check me-2"></i>
                    View Team Attendance
                  </Button>

                  <Button
                    variant="warning"
                    className="text-white"
                    onClick={() => navigate("/manager/leave-requests")}
                  >
                    <i className="bi bi-envelope-paper me-2"></i>
                    Manage Leave Requests
                  </Button>

                  <Button
                    variant="info"
                    className="text-white"
                    onClick={() => navigate("/manager/my-work-history")}
                  >
                    <i className="bi bi-clock-history me-2"></i>
                    My Work History
                  </Button>
                </div>
              </CardContainer>
            </div>
          </div>

          {/* ========== TEAM STATS CARDS ========== */}
          <div className="row g-3 mb-4">
            {statsCards.map((stat, idx) => (
              <div key={idx} className="col-6 col-sm-4 col-lg-3">
                <CardContainer>
                  <div className="text-center">
                    <div
                      className="mx-auto mb-2 rounded-circle text-white d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: stat.color,
                        width: 50,
                        height: 50,
                        fontSize: "1.3rem",
                      }}
                    >
                      <i className={`bi ${stat.icon}`}></i>
                    </div>
                    <h3 className="mb-0">
                      {teamLoading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        stat.value
                      )}
                    </h3>
                    <p className="mb-0 text-muted small">{stat.title}</p>
                  </div>
                </CardContainer>
              </div>
            ))}
          </div>

          {/* ========== CHARTS ROW ========== */}
          <div className="row g-3 mb-4">
            {/* Attendance Pie Chart */}
            <div className="col-12 col-lg-6">
              <CardContainer title="Team Attendance Today">
                {teamLoading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : teamStats.totalTeamMembers > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={attendanceChartData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={70}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {attendanceChartData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted">No team members</p>
                )}
              </CardContainer>
            </div>

            {/* Working Status Pie Chart */}
            {/* <div className="col-12 col-lg-4">
              <CardContainer title="Current Working Status">
                {teamLoading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : workingStatusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={workingStatusChartData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={70}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {workingStatusChartData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={
                              ["#17a2b8", "#ffc107", "#6c757d"][index % 3]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted">No active employees</p>
                )}
              </CardContainer>
            </div> */}

            {/* My Recent Sessions */}
            <div className="col-12 col-lg-6">
              <CardContainer title="My Recent Sessions">
                <div className="d-flex flex-column gap-2">
                  {myHistory.slice(0, 3).map((h, idx) => (
                    <div
                      key={idx}
                      className="p-2 border rounded bg-light d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong style={{ fontSize: "0.85rem" }}>
                          {formatPakistanDateLabel(h.clockInTime)}
                        </strong>
                        <br />
                        <small className="text-muted">
                          {h.clockInFormatted} - {h.clockOutFormatted}
                        </small>
                      </div>
                      <Badge bg="primary">{h.workingHours}</Badge>
                    </div>
                  ))}
                  {myHistory.length === 0 && (
                    <p className="text-muted text-center">No sessions yet</p>
                  )}
                </div>
              </CardContainer>
            </div>
          </div>

          {/* ========== CURRENTLY ACTIVE TEAM MEMBERS ========== */}
          {activeTeamMembers.length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <CardContainer title="Currently Active Team Members">
                  <div className="table-responsive">
                    <Table striped bordered hover size="sm">
                      <thead className="table-success">
                        <tr>
                          <th>Employee</th>
                          <th>Clock In Time</th>
                          <th>Working Since</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTeamMembers.map((session, idx) => {
                          const clockIn = parseApiDate(session.clockInTime);
                          const isOnBreak = session.breaks?.some(
                            (b) => !b.endTime
                          );

                          // Calculate working time
                          const totalBreakMillis =
                            session.breaks?.reduce((sum, b) => {
                              const start = parseApiDate(b.startTime);
                              const end = parseApiDate(b.endTime) || getNowUTC();
                              if (!start) return sum;
                              return sum + (end.getTime() - start.getTime());
                            }, 0) || 0;

                          const totalMillis =
                            getNowUTC().getTime() - (clockIn?.getTime() || 0);
                          const netMillis = totalMillis - totalBreakMillis;

                          return (
                            <tr key={idx}>
                              <td>
                                <strong>
                                  {session.employeeName || "Unknown"}
                                </strong>
                              </td>
                              <td>{formatTimeAMPM(session.clockInTime)}</td>
                              <td>{formatDuration(netMillis / 1000 / 3600)}</td>
                              <td>
                                {isOnBreak ? (
                                  <Badge bg="warning" className="text-dark">
                                    <i className="bi bi-cup-hot me-1"></i>
                                    On Break
                                  </Badge>
                                ) : (
                                  <Badge bg="success">
                                    <i className="bi bi-activity me-1"></i>
                                    Working
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </CardContainer>
              </div>
            </div>
          )}

          {/* ========== RECENT TEAM SESSIONS TABLE ========== */}
          <div className="row">
            <div className="col-12">
              <CardContainer title="Recent Team Work Sessions (Completed)">
                {teamLoading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading team data...</p>
                  </div>
                ) : recentTeamSessions.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead className="table-dark">
                          <tr>
                            <th>Employee</th>
                            <th>Date</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                            <th>Working Hours</th>
                            <th>Break Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTeamSessions.map((session, idx) => {
                            const clockIn = parseApiDate(session.clockInTime);
                            const clockOut = parseApiDate(session.clockOutTime);

                            const totalBreakMillis =
                              session.breaks?.reduce((sum, b) => {
                                const start = parseApiDate(b.startTime);
                                const end =
                                  parseApiDate(b.endTime) || getNowUTC();
                                if (!start) return sum;
                                return sum + (end.getTime() - start.getTime());
                              }, 0) || 0;

                            const totalMillis =
                              (clockOut || getNowUTC()).getTime() -
                              (clockIn?.getTime() || 0);
                            const netMillis = totalMillis - totalBreakMillis;

                            return (
                              <tr key={idx}>
                                <td>
                                  <strong>
                                    {session.employeeName || "Unknown"}
                                  </strong>
                                </td>
                                <td>
                                  {formatPakistanDateLabel(session.clockInTime)}
                                </td>
                                <td>{formatTimeAMPM(session.clockInTime)}</td>
                                <td>
                                  {session.clockOutTime
                                    ? formatTimeAMPM(session.clockOutTime)
                                    : "--"}
                                </td>
                                <td>
                                  <Badge bg="primary">
                                    {formatDuration(netMillis / 1000 / 3600)}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg="secondary">
                                    {formatDuration(
                                      totalBreakMillis / 1000 / 3600
                                    )}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                    <div className="text-end">
                      <Button
                        variant="primary"
                        onClick={() => navigate("/manager/team-sessions")}
                      >
                        View All Team Sessions →
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted">
                    No completed team sessions found
                  </p>
                )}
              </CardContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;