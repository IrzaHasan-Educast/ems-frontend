import React, { useState, useEffect } from "react";
import ManagerSidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading";
import { Table, Badge, Spinner, Form, InputGroup } from "react-bootstrap";
import * as attendanceApi from "../../api/attendanceApi";

const TeamAttendance = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await attendanceApi.getManagerAttendanceHistory();
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate)
        );
        setAttendance(sorted);
        setFilteredAttendance(sorted);
      } catch (err) {
        console.error("Error fetching team attendance:", err);
      }
      setLoading(false);
    };
    fetchAttendance();
  }, []);

  useEffect(() => {
    let filtered = attendance;

    if (searchTerm) {
      filtered = filtered.filter((a) =>
        a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((a) => a.attendanceDate === dateFilter);
    }

    setFilteredAttendance(filtered);
  }, [searchTerm, dateFilter, attendance]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PK", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="d-flex">
      <ManagerSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className="flex-grow-1">
        <Navbar
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role") || "Manager"}
        />

        <div className="container-fluid p-3">
          <PageHeading title="Team Attendance" />

          <CardContainer>
            {/* Filters */}
            <div className="row mb-3">
              <div className="col-md-6 mb-2">
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by employee name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>
              <div className="col-md-6 mb-2">
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-calendar"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </InputGroup>
              </div>
            </div>

            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading attendance...</p>
              </div>
            ) : filteredAttendance.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Marked At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendance.map((record, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{record.employeeName || "Unknown"}</strong>
                        </td>
                        <td>{formatDate(record.attendanceDate)}</td>
                        <td>
                          <Badge bg={record.present ? "success" : "danger"}>
                            {record.present ? "Present" : "Absent"}
                          </Badge>
                        </td>
                        <td>
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleTimeString()
                            : "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted">No attendance records found</p>
            )}
          </CardContainer>
        </div>
      </div>
    </div>
  );
};

export default TeamAttendance;