// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading";
import { useNavigate } from "react-router-dom";
import { getAllEmployees } from "../../api/employeeApi";
import { getAllAttendance } from "../../api/attendanceApi";
import { getCurrentUser } from "../../api/userApi";

// Recharts imports
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";

const AdminDashboard = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [admin, setAdmin] = useState({ name: "Admin", role: "Admin" });

  const [attendanceStats, setAttendanceStats] = useState({ totalEmployees: 0, presentToday: 0 });

  const [leaves, setLeaves] = useState([
    { name: "On Leave", value: 3 },
    { name: "Present", value: 7 },
  ]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch logged-in user info
        const userRes = await getCurrentUser();
        setAdmin({
          name: userRes.data.fullName,
          role: userRes.data.role
        });

        // Employees list
        const empRes = await getAllEmployees();
        const allEmployees = empRes.data;
        setEmployees(allEmployees);

        // Department stats
        const depts = {};
        allEmployees.forEach(emp => {
          const dep = emp.department || "Others";
          depts[dep] = (depts[dep] || 0) + 1;
        });
        const deptArray = Object.keys(depts).map(key => ({ name: key, value: depts[key] }));
        setDeptStats(deptArray);

        // Attendance stats
        const attendanceRes = await getAllAttendance();
        const todayStr = new Date().toISOString().split("T")[0];

        const employeeList = allEmployees.filter(emp => emp.role.toLowerCase() === "employee");
        const totalEmployees = employeeList.length;

        const presentToday = attendanceRes.data.filter(a =>
          employeeList.some(emp => emp.id === a.employeeId) &&
          a.attendanceDate === todayStr &&
          a.present
        ).length;

        setAttendanceStats({ totalEmployees, presentToday });

      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);


  const stats = [
    { title: "Total Employees", value: attendanceStats.totalEmployees, description: "Active Employees", color: "#055993", icon: "bi-people-fill" },
    { title: "Attendance Today", value: attendanceStats.presentToday, description: "Present today", color: "#FFA500", icon: "bi-calendar-check" },
    // { title: "New Joinees", value: 5, description: "Joined this month", color: "#28A745", icon: "bi-person-plus" },
    { title: "Departments", value: deptStats.length, description: "Total Departments", color: "#6F42C1", icon: "bi-building" },
  ];

  const COLORS = ["#FF8042", "#0088FE", "#00C49F", "#FFBB28", "#6F42C1", "#FFA500"];

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} username={admin.name} role={admin.role} />

        <div className="p-4">
          <PageHeading title="Admin Dashboard" />

          {/* Stats Cards */}
          <div className="d-flex flex-wrap gap-3 mb-4">
            {stats.map((stat, idx) => (
              <CardContainer key={idx}>
                <div className="d-flex align-items-center">
                  <div
                    className="me-3 p-3 rounded-circle text-white d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: stat.color, width: "60px", height: "60px", fontSize: "1.5rem" }}
                  >
                    <i className={`bi ${stat.icon}`}></i>
                  </div>
                  <div>
                    <h3 className="mb-0">{stat.value}</h3>
                    <p className="mb-0 text-muted">{stat.description}</p>
                  </div>
                </div>
              </CardContainer>
            ))}
          </div>

          {/* Charts */}
          <div className="d-flex flex-wrap gap-3">
            <CardContainer title="Employees by Department">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={deptStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#055993">
                    {deptStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContainer>

            <CardContainer title="Leaves Overview Today">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={leaves} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {leaves.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContainer>
          </div>

          {/* Quick Actions */}
          <CardContainer title="Quick Actions">
            <div className="d-flex gap-3 flex-wrap">
              <button className="btn btn-primary" onClick={() => navigate("/admin/employees")}>
                <i className="bi bi-people-fill me-2"></i> Manage Employees
              </button>
              <button className="btn btn-warning text-white"onClick={() => navigate("/admin/attendance")}>
                <i className="bi bi-calendar-check me-2"></i> Attendance
              </button>
              <button
                className="btn btn-success"
                onClick={() => navigate("/admin/employees/add")}
              >
                <i className="bi bi-person-plus me-2"></i> Add Employee
              </button>
            </div>
          </CardContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
