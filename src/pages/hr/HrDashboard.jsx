import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Table, Badge, Spinner } from "react-bootstrap";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from "recharts";

// Components

import CardContainer from "../../components/CardContainer";

// APIs
import { getAllEmployees } from "../../api/employeeApi";
import { getAllAttendance } from "../../api/attendanceApi";
import { getAllLeaves } from "../../api/leaveApi";
import { getCurrentUser } from "../../api/userApi";

// Utils
import { formatPakistanDateLabel } from "../../utils/time";

const HRDashboard = () => {
  const navigate = useNavigate();

  // --- State ---
  const [hrUser, setHrUser] = useState({ name: "HR", role: "HR" });
  
  // Dashboard Stats
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
  });

  // Chart Data
  const [deptStats, setDeptStats] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const COLORS = ["#28a745", "#dc3545", "#ffc107", "#17a2b8"]; 

  // --- Fetch Logic ---
  const fetchDashboardData = useCallback(async () => {
    try {
      setPageLoading(true);
      
      const [userRes, empRes, attRes, leaveRes] = await Promise.all([
        getCurrentUser(),
        getAllEmployees(),
        getAllAttendance(),
        getAllLeaves() 
      ]);

      // 1. User Info
      setHrUser({
        name: userRes.data.fullName,
        role: userRes.data.role,
      });

      const allEmployees = empRes.data || [];
      const allAttendance = attRes.data || [];
      const allLeaves = leaveRes.data || [];

      // 2. Stats
      const totalEmployees = allEmployees.filter(e => e.role !== 'ADMIN').length;
      
      const todayStr = new Date().toISOString().split("T")[0];
      const presentToday = allAttendance.filter(
        (a) => a.attendanceDate === todayStr && a.present
      ).length;

      const pendingCount = allLeaves.filter(l => l.status === "PENDING").length;

      setStats({
        totalEmployees,
        presentToday,
        absentToday: Math.max(0, totalEmployees - presentToday),
        pendingLeaves: pendingCount
      });

      setAttendanceData([
        { name: "Present", value: presentToday },
        { name: "Absent", value: Math.max(0, totalEmployees - presentToday) }
      ]);

      // 3. Dept Stats
      const depts = {};
      allEmployees.forEach((emp) => {
        const dep = emp.department || "Unassigned";
        depts[dep] = (depts[dep] || 0) + 1;
      });
      const deptArray = Object.keys(depts).map((key) => ({ name: key, value: depts[key] }));
      setDeptStats(deptArray);

      // 4. Recent Leaves
      const pendingLeavesList = allLeaves
        .filter(l => l.status === "PENDING")
        .slice(0, 5);
      setRecentLeaves(pendingLeavesList);

    } catch (err) {
      console.error("HR Dashboard Load Error:", err);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Helper Components ---
  const StatCard = ({ title, value, icon, color, subtext }) => (
    <Card className="border-0 shadow-sm h-100">
        <Card.Body className="d-flex align-items-center">
            <div className={`rounded-circle p-3 d-flex align-items-center justify-content-center text-white`} 
                 style={{ width: 60, height: 60, backgroundColor: color, fontSize: "1.5rem" }}>
                <i className={`bi ${icon}`}></i>
            </div>
            <div className="ms-3">
                <h3 className="mb-0 fw-bold">{value}</h3>
                <div className="small text-muted fw-bold">{title}</div>
                {subtext && <div className="text-muted" style={{fontSize: "0.75rem"}}>{subtext}</div>}
            </div>
        </Card.Body>
    </Card>
  );

  const QuickActionBtn = ({ label, path, icon, color }) => (
    <Button 
        variant="white" 
        className="w-100 border shadow-sm py-3 px-3 text-start d-flex align-items-center gap-3 hover-shadow mb-3"
        onClick={() => navigate(path)}
        style={{ transition: "all 0.2s" }}
    >
        <div className={`text-${color} fs-3`}><i className={`bi ${icon}`}></i></div>
        <div>
            <div className="fw-bold text-dark lh-1">{label}</div>
            <small className="text-muted">Manage details</small>
        </div>
    </Button>
  );

  return (
    <>
        <div className="container-fluid p-4">
          {pageLoading ? (
             <div className="d-flex justify-content-center align-items-center" style={{height: "60vh"}}>
                 <Spinner animation="border" variant="primary" />
             </div>
          ) : (
            <>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold text-dark mb-0">HR Dashboard</h4>
                    <p className="text-muted mb-0">Welcome back, <span className="text-primary fw-bold">{hrUser.name}</span></p>
                </div>
                <Badge bg="white" text="dark" className="border px-3 py-2 shadow-sm fw-normal">
                    {formatPakistanDateLabel(new Date().toISOString())}
                </Badge>
              </div>

              {/* ROW 1: Stats */}
              <Row className="g-3 mb-4">
                <Col sm={6} lg={3}>
                    <StatCard title="Total Employees" value={stats.totalEmployees} icon="bi-people-fill" color="#055993" />
                </Col>
                <Col sm={6} lg={3}>
                    <StatCard title="Present Today" value={stats.presentToday} icon="bi-person-check-fill" color="#28a745" />
                </Col>
                <Col sm={6} lg={3}>
                    <StatCard title="Absent" value={stats.absentToday} icon="bi-person-x-fill" color="#dc3545" />
                </Col>
                <Col sm={6} lg={3}>
                    <StatCard title="Pending Leaves" value={stats.pendingLeaves} icon="bi-envelope-exclamation-fill" color="#ffc107" subtext="Requires Action" />
                </Col>
              </Row>

              {/* ROW 2: Layout requested -> Left: Quick Actions, Right: Attendance + Dept Charts */}
              <Row className="g-4 mb-4">
                
                {/* Left Column: Quick Actions */}
                <Col lg={4}>
                    <CardContainer title="Quick Actions">
                        <div className="d-flex flex-column pt-2">
                            <QuickActionBtn label="Employee Directory" path="/admin/employees" icon="bi-person-lines-fill" color="primary" />
                            <QuickActionBtn label="Attendance Records" path="/admin/attendance" icon="bi-calendar-check" color="success" />
                            <QuickActionBtn label="Leave Management" path="/admin/leaves" icon="bi-calendar2-event" color="warning" />
                            <QuickActionBtn label="Onboard Employee" path="/admin/employees/add" icon="bi-person-plus" color="info" />
                        </div>
                    </CardContainer>
                </Col>

                {/* Right Column: Charts Stacked */}
                <Col lg={8}>
                    {/* Top: Attendance Pie */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white fw-bold py-3">Today's Attendance Overview</Card.Header>
                        <Card.Body>
                            <div style={{ height: "250px" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={attendanceData}
                                            cx="50%" cy="50%"
                                            innerRadius={70} outerRadius={90}
                                            paddingAngle={5} dataKey="value"
                                        >
                                            <Cell fill={COLORS[0]} />
                                            <Cell fill={COLORS[1]} />
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Bottom: Department Bar Chart */}
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white fw-bold py-3">Employees by Department</Card.Header>
                        <Card.Body>
                            <div style={{ height: "300px" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={deptStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="value" fill="#055993" radius={[4, 4, 0, 0]} barSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
              </Row>

              {/* ROW 3: Pending Leaves Table */}
              <Row>
                <Col>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                            <span>Pending Leave Requests</span>
                            <Button variant="outline-primary" size="sm" onClick={() => navigate("/admin/leaves")}>View All</Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {recentLeaves.length > 0 ? (
                                <Table hover responsive className="mb-0 align-middle">
                                    <thead className="bg-light text-muted small">
                                        <tr>
                                            <th className="ps-4">Employee</th>
                                            <th>Type</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentLeaves.map((leave, i) => (
                                            <tr key={i}>
                                                <td className="ps-4 fw-bold text-dark">{leave.employeeName || "Employee #" + leave.employeeId}</td>
                                                <td><Badge bg="info" className="text-dark">{leave.leaveType}</Badge></td>
                                                <td>{leave.startDate} to {leave.endDate}</td>
                                                <td><Badge bg="warning" text="dark">Pending</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-5 text-muted">No pending leave requests.</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
              </Row>
            </>
          )}
        </div>
      </>
  );
};

export default HRDashboard;