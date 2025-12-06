import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/EmployeeSidebar";
import TopNavbar from "../../components/EmployeeNavbar";
import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading";
import "../../styles/AttendanceHistory.css"; // same theme
import { useNavigate } from "react-router-dom";

import { Table, Form, Button, InputGroup, FormControl } from "react-bootstrap";

// API CALLS
import { getCurrentUser } from "../../api/workSessionApi"; 
import { getLeavesByEmployee } from "../../api/leaveApi"; // <-- new leave API

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

  // ---- Month name extractor ----
  const getMonthName = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { month: "long" });
  };

  const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};


  // ---- Fetch Employee Leaves ----
  const fetchLeaves = useCallback(async (employeeId) => {
    try {
      const res = await getLeavesByEmployee(employeeId);

      if (res.data && Array.isArray(res.data)) {
        const formatted = res.data.map((lv) => ({
          id: lv.id,
          type: lv.leaveType,
          status: lv.status,
          startDate: formatDate(lv.startDate),
          endDate: formatDate(lv.endDate),
          duration: lv.duration,
          description: lv.description || "--",
          appliedOn: new Date(lv.appliedOn).toLocaleString(),
          prescriptionImg: lv.prescriptionImg,
          monthName: getMonthName(lv.startDate),
        }));

        setLeaves(formatted);
        setFilteredLeaves(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch leaves", err);
    }
  }, []);

  // ---- Fetch current user ----
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

  // ---- Search + Filter ----
  useEffect(() => {
    let filtered = [...leaves];

    if (selectedMonth) {
      filtered = filtered.filter((lv) => lv.monthName === selectedMonth);
    }

    if (selectedStatus) {
      filtered = filtered.filter((lv) => lv.status === selectedStatus);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((lv) =>
        `${lv.type} ${lv.status} ${lv.description} ${lv.startDate} ${lv.endDate}`
          .toLowerCase()
          .includes(q)
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

  if (!employee) return <div>Loading...</div>;

  const uniqueMonths = [...new Set(leaves.map((lv) => lv.monthName))];

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} username={employee?.fullName} />

        <div className="p-4">
          <PageHeading title="My Leave History"
            buttonText="Apply Leave"
            onButtonClick={() => navigate("/employee/leave/apply")} />

          {/* Search + Filter */}
          <CardContainer title="Search & Filter">
            <div className="row w-100 mb-3">

              {/* Search */}
              <div className="col-md-4">
                <InputGroup>
                  <FormControl
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </div>

              {/* Month filter */}
              <div className="col-md-3">
                <Form.Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">Select Month</option>
                  {uniqueMonths.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Form.Select>
              </div>

              {/* Status filter */}
              <div className="col-md-3">
                <Form.Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </Form.Select>
              </div>

              {/* Reset */}
              <div className="col-md-2">
                <Button variant="secondary" className="w-100" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>

            <div className="ms-auto">
              <strong>Total Records: {filteredLeaves.length}</strong>
            </div>
          </CardContainer>

          {/* Table */}
          <CardContainer title="Leave Records">
            <Table bordered hover responsive className="table-theme">
              <thead style={{ backgroundColor: "#055993", color: "white" }}>
                <tr className="text-center">
                  <th>S. No.</th>
                  <th>Leave Type</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Description</th>
                  <th>Applied On</th>
                  <th>Prescription</th>
                </tr>
              </thead>

              <tbody className="text-center">
                {filteredLeaves.map((lv, idx) => (
                  <tr key={lv.id}>
                    <td>{idx + 1}</td>
                    <td>{lv.type}</td>
                    <td>{lv.status}</td>
                    <td>{lv.startDate}</td>
                    <td>{lv.endDate}</td>
                    <td>{lv.duration}</td>
                    <td className="text-start">{lv.description}</td>
                    <td>{lv.appliedOn}</td>
                    <td>
                      {lv.prescriptionImg ? (
                        <a
                          href={lv.prescriptionImg}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary"
                        >
                          View
                        </a>
                      ) : (
                        "--"
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
