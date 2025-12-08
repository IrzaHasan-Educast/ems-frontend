// src/pages/employee/LeaveHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/EmployeeSidebar";
import TopNavbar from "../../components/EmployeeNavbar";
import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading";
import "../../styles/AttendanceHistory.css";
import { useNavigate } from "react-router-dom";

import { Table, Form, Button, InputGroup, FormControl, Badge } from "react-bootstrap";
import { getCurrentUser } from "../../api/workSessionApi";
import { getLeavesByEmployee, deleteLeaveById } from "../../api/leaveApi";
import dayjs from "dayjs";

const LeaveHistory = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const formatDate = (dateStr) => (dateStr ? dayjs(dateStr).format("DD-MM-YYYY") : "");
  const formatDateTime = (dateStr) => (dateStr ? dayjs(dateStr).format("DD-MM-YYYY HH:mm:ss") : "");
  const getMonthName = (dateStr) => (dateStr ? dayjs(dateStr).format("MMMM") : "");

  const fetchLeaves = useCallback(async (employeeId) => {
    try {
      const res = await getLeavesByEmployee(employeeId);
      if (res.data && Array.isArray(res.data)) {
        const formatted = res.data
          .map((lv) => ({
            id: lv.id,
            type: lv.leaveType,
            status: lv.status,
            startDate: formatDate(lv.startDate),
            endDate: formatDate(lv.endDate),
            duration: lv.duration,
            description: lv.description || "--",
            appliedOn: formatDateTime(lv.appliedOn),
            prescriptionImg: lv.prescriptionImg,
            monthName: getMonthName(lv.startDate),
          }))
          .sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
        setLeaves(formatted);
        setFilteredLeaves(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch leaves", err);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await getCurrentUser();
      setEmployee({ fullName: res.data.fullName, id: res.data.employeeId });
      fetchLeaves(res.data.employeeId);
    } catch (err) {
      console.error("Failed fetching user", err);
    }
  }, [fetchLeaves]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    let filtered = [...leaves];
    if (selectedMonth) filtered = filtered.filter((lv) => lv.monthName === selectedMonth);
    if (selectedStatus) filtered = filtered.filter((lv) => lv.status.toUpperCase() === selectedStatus.toUpperCase());
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((lv) =>
        `${lv.type} ${lv.status} ${lv.description} ${lv.startDate} ${lv.endDate}`.toLowerCase().includes(q)
      );
    }
    setFilteredLeaves(filtered);
  }, [searchQuery, selectedStatus, selectedMonth, leaves]);

  const handleReset = () => {
    setSelectedMonth("");
    setSelectedStatus("");
    setSearchQuery("");
    setFilteredLeaves(leaves);
  };

  const handleDelete = async (leaveId) => {
    if (window.confirm("Are you sure you want to delete this pending leave?")) {
      try {
        await deleteLeaveById(leaveId);
        setLeaves((prev) => prev.filter((lv) => lv.id !== leaveId));
        setFilteredLeaves((prev) => prev.filter((lv) => lv.id !== leaveId));
      } catch (err) {
        console.error("Failed to delete leave", err);
        alert("Failed to delete leave.");
      }
    }
  };

  if (!employee) return <div>Loading...</div>;

  const uniqueMonths = [...new Set(leaves.map((lv) => lv.monthName))];

  const statusColor = (status) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "danger";
      case "PENDING":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} username={employee?.fullName} />

        <div className="p-4">
          <PageHeading
            title="My Leave History"
            buttonText="Apply Leave"
            onButtonClick={() => navigate("/employee/leave/apply")}
          />

          {/* Search & Filter */}
          <CardContainer title="Search & Filter">
            <div className="row w-100 mb-3">
              <div className="col-md-4">
                <InputGroup>
                  <FormControl
                    placeholder="Search by type, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </div>

              <div className="col-md-3">
                <Form.Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">Select Month</option>
                  {uniqueMonths.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-md-3">
                <Form.Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="">Select Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </Form.Select>
              </div>

              <div className="col-md-2">
                <Button variant="secondary" className="w-100" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>

            <div className="ms-auto mb-2">
              <strong>Total Records: {filteredLeaves.length}</strong>
            </div>
          </CardContainer>

          {/* Table */}
          <CardContainer title="Leave Records">
            <Table bordered hover responsive className="table-theme text-center">
              <thead style={{ backgroundColor: "#055993", color: "white" }}>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Prescription</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeaves.map((lv, idx) => (
                  <tr key={lv.id}>
                    <td>{idx + 1}</td>
                    <td>{lv.type}</td>
                    <td className="text-start">{lv.description}</td>
                    <td>{lv.startDate}</td>
                    <td>{lv.endDate}</td>
                    <td>{lv.duration}</td>
                    <td>{lv.appliedOn}</td>
                    <td>
                      <Badge bg={statusColor(lv.status)} className="text-uppercase">
                        {lv.status}
                      </Badge>
                    </td>
                    <td>
                      {lv.prescriptionImg ? (
                        <a href={lv.prescriptionImg} target="_blank" rel="noreferrer" className="text-primary">
                          View
                        </a>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td>
                      {lv.status.toUpperCase() === "PENDING" && (
                        <Button variant="danger" size="sm" onClick={() => handleDelete(lv.id)}>
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContainer>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;
