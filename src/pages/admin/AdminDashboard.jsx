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
  YAxis,
  CartesianGrid
} from "recharts";

import CardContainer from "../../components/CardContainer";

import { getAllEmployees } from "../../api/employeeApi";
import { getAllAttendance } from "../../api/attendanceApi";
import { getAllShifts } from "../../api/shiftApi";
import { getAllLeaves } from "../../api/leaveApi"; // ✅ Imported Leave API
import { getCurrentUser } from "../../api/userApi";
import { formatPakistanDateLabel } from "../../utils/time";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // --- State ---
  const [adminUser, setAdminUser] = useState({ name: "Admin", role: "ADMIN" });
  
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    totalDepts: 0,
    totalShifts: 0
  });

  // ✅ Changed State: From recentEmployees to recentLeaves
  const [recentLeaves, setRecentLeaves] = useState([]); 
  const [attendanceChartData, setAttendanceChartData] = useState([]); 
  const [roleDistribution, setRoleDistribution] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  
  // --- Fetch Logic ---
  const fetchDashboardData = useCallback(async () => {
    try {
      setPageLoading(true);
      
      // ✅ Added getAllLeaves() to Promise.all
      const [userRes, empRes, attRes, shiftRes, leaveRes] = await Promise.all([
        getCurrentUser(),
        getAllEmployees(),
        getAllAttendance(),
        getAllShifts(),
        getAllLeaves()
      ]);

      setAdminUser({ name: userRes.data.fullName, role: userRes.data.role });

      const allEmployees = empRes.data || [];
      const allAttendance = attRes.data || [];
      const allShifts = shiftRes.data || [];
      const allLeaves = leaveRes.data || [];

      // Stats
      const uniqueDepts = new Set(allEmployees.map(e => e.department).filter(Boolean)).size;
      const todayStr = new Date().toISOString().split("T")[0];
      const presentToday = allAttendance.filter(a => a.attendanceDate === todayStr && a.present).length;

      setStats({
        totalEmployees: allEmployees.length,
        presentToday: presentToday,
        totalDepts: uniqueDepts,
        totalShifts: allShifts.length
      });

      // Pie Chart Data
      setAttendanceChartData([
        { name: "Present", value: presentToday },
        { name: "Absent", value: allEmployees.length - presentToday }
      ]);

      // Bar Chart Data (Role Distribution)
      const roles = {};
      allEmployees.forEach(emp => {
        const r = emp.role || "UNKNOWN";
        roles[r] = (roles[r] || 0) + 1;
      });
      setRoleDistribution(Object.keys(roles).map(key => ({ name: key, count: roles[key] })));

      // ✅ Logic for Pending Leaves (Top 5)
      const pendingLeavesList = allLeaves
        .filter(l => l.status === "PENDING")
        .slice(0, 5);
      setRecentLeaves(pendingLeavesList);

    } catch (err) {
      console.error("Admin Dashboard Error:", err);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // --- Helper Components ---
  const StatCard = ({ title, value, icon, color }) => (
    <Card className="border-0 shadow-sm h-100">
        <Card.Body className="d-flex align-items-center p-3">
            <div className={`rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0`} 
                 style={{ width: 50, height: 50, backgroundColor: color, fontSize: "1.25rem" }}>
                <i className={`bi ${icon}`}></i>
            </div>
            <div className="ms-3 overflow-hidden">
                <h3 className="mb-0 fw-bold">{value}</h3>
                <div className="small text-muted fw-bold text-truncate">{title}</div>
            </div>
        </Card.Body>
    </Card>
  );

  const QuickActionBtn = ({ label, path, icon, color }) => (
    <Button 
        variant="white" 
        className="w-100 border shadow-sm py-3 px-3 text-start d-flex align-items-center gap-3 hover-shadow mb-2"
        onClick={() => navigate(path)}
        style={{ transition: "all 0.2s", whiteSpace: "normal" }}
    >
        <div className={`text-${color} fs-3`}><i className={`bi ${icon}`}></i></div>
        <div style={{ lineHeight: "1.2" }}>
            <div className="fw-bold text-dark">{label}</div>
            <small className="text-muted">System Action</small>
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
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                <div>
                    <h4 className="fw-bold text-dark mb-0">Admin Dashboard</h4>
                    <p className="text-muted mb-0">System Overview & Controls</p>
                </div>
                <Badge bg="dark" className="px-3 py-2 shadow-sm fw-normal">
                    {formatPakistanDateLabel(new Date().toISOString())}
                </Badge>
              </div>

              {/* ROW 1: Stats */}
              <Row className="g-3 mb-4">
                <Col xs={12} sm={6} lg={3}>
                    <StatCard title="Total Employees" value={stats.totalEmployees} icon="bi-people-fill" color="#4e73df" />
                </Col>
                <Col xs={12} sm={6} lg={3}>
                    <StatCard title="Departments" value={stats.totalDepts} icon="bi-building" color="#1cc88a" />
                </Col>
                <Col xs={12} sm={6} lg={3}>
                    <StatCard title="Active Shifts" value={stats.totalShifts} icon="bi-calendar-range" color="#36b9cc" />
                </Col>
                <Col xs={12} sm={6} lg={3}>
                    <StatCard title="Attendance Today" value={stats.presentToday} icon="bi-check-circle-fill" color="#f6c23e" />
                </Col>
              </Row>

              {/* ROW 2: Layouts */}
              <Row className="g-4 mb-4">
                
                {/* 1. Employee Roles Distribution */}
                 <Col xs={12} md={12} lg={7} xl={4}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold py-3">Employee Role Distribution</Card.Header>
                        <Card.Body>
                            <div style={{ width: "100%", height: "280px" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={roleDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{fontSize: 10}} />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="count" fill="#4e73df" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 2. Attendance Pie Chart */}
                <Col xs={12} md={6} lg={12} xl={4}>
                     <Card className="border-0 shadow-sm h-100">
                        <Card.Header className="bg-white fw-bold py-3">Today's Status</Card.Header>
                        <Card.Body>
                             <div style={{ width: "100%", height: "280px" }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={attendanceChartData}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={80}
                                            paddingAngle={5} dataKey="value"
                                        >
                                            <Cell fill="#1cc88a" />
                                            <Cell fill="#e74a3b" />
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 3. Quick Actions */}
                <Col xs={12} md={6} lg={5} xl={4}>
                    <CardContainer title="System Controls">
                        <div className="d-flex flex-column pt-2">
                            <QuickActionBtn label="Manage Employees" path="/admin/employees" icon="bi-people" color="primary" />
                            <QuickActionBtn label="Shift Management" path="/admin/shifts" icon="bi-clock" color="info" />
                            <QuickActionBtn label="Assign Shifts" path="/admin/employee-shifts/assign" icon="bi-person-badge" color="warning" />
                            <QuickActionBtn label="Work Sessions" path="/admin/work-sessions" icon="bi-display" color="success" />
                        </div>
                    </CardContainer>
                </Col>
              </Row>

              {/* ✅ ROW 3: Replaced Recent Employees with Pending Leaves */}
              <Row>
                <Col xs={12}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
                            <span>Pending Leave Requests</span>
                            <Button variant="outline-primary" size="sm" onClick={() => navigate("/admin/leaves")}>
                                View All
                            </Button>
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
                                                <td className="ps-4 fw-bold text-dark text-nowrap">
                                                  {leave.employeeName || `ID: ${leave.employeeId}`}
                                                </td>
                                                <td><Badge bg="info" className="text-dark">{leave.leaveType}</Badge></td>
                                                <td className="text-nowrap">{leave.startDate} to {leave.endDate}</td>
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

export default AdminDashboard;