// src/pages/admin/AllLeaves.jsx
import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getAllLeaves, approveLeave, rejectLeave } from "../../api/leaveApi";
import { getCurrentUser } from "../../api/userApi";
import { Gear, FileEarmarkText } from "react-bootstrap-icons";
import * as XLSX from "xlsx";
import { formatDate } from "../../utils/dateHelper";

const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "employeeName", label: "Employee" },
  { key: "leaveType", label: "Leave Type" },
  { key: "description", label: "Description" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "duration", label: "Days" },
  { key: "prescriptionImg", label: "Prescription" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

const AllLeaves = ({ onLogout }) => {
  const [leaves, setLeaves] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Column settings
  const [selectedColumns, setSelectedColumns] = useState(allColumns.map(c => c.key));
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  const [admin, setAdmin] = useState({ name: "", role: "" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch admin
  useEffect(() => {
    const fetchAdmin = async () => {
      const res = await getCurrentUser();
      setAdmin({ name: res.data.fullName, role: res.data.role });
    };
    fetchAdmin();
  }, []);

  // Fetch leave data
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await getAllLeaves();
        const formatted = res.data
          .map(l => ({
            ...l,
            startDate: formatDate(l.startDate),
            endDate: formatDate(l.endDate),
            status: l.status.charAt(0).toUpperCase() + l.status.slice(1).toLowerCase(),
            leaveType: l.leaveType.charAt(0).toUpperCase() + l.leaveType.slice(1).toLowerCase(),
          }))
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

        setLeaves(formatted);
        setFiltered(formatted);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchLeaves();
  }, []);

  // Unique filters (dropdown)
  const employeeNames = [...new Set(leaves.map(l => l.employeeName))];
  const leaveTypes = [...new Set(leaves.map(l => l.leaveType))];

  // Main Filtering Logic
  useEffect(() => {
    const term = searchTerm.toLowerCase();

    let f = leaves.filter(l => {
      const matchSearch = [l.employeeName, l.leaveType, l.description, l.status]
        .join(" ")
        .toLowerCase()
        .includes(term);

      const matchStatus = statusFilter ? l.status === statusFilter : true;
      const matchMonth = monthFilter ? new Date(l.startDate).getMonth() + 1 === +monthFilter : true;
      const matchEmployee = employeeFilter ? l.employeeName === employeeFilter : true;
      const matchType = typeFilter ? l.leaveType === typeFilter : true;

      return matchSearch && matchStatus && matchMonth && matchEmployee && matchType;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, monthFilter, employeeFilter, typeFilter, leaves]);

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("");
    setMonthFilter("");
    setEmployeeFilter("");
    setTypeFilter("");
    setRowsPerPage(10);
    setCurrentPage(1);
    setSelectedColumns(allColumns.map(c => c.key));
  };

  // Pagination math
  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const start = rowsPerPage === "All" ? 0 : (currentPage - 1) * rowsPerPage;
  const end = rowsPerPage === "All" ? filtered.length : currentPage * rowsPerPage;

  const displayed = filtered.slice(start, end);

  // ============================================
  //   ✅ UPDATED EXCEL EXPORT FUNCTION
  // ============================================
  const exportToExcel = () => {
    const fileName = window.prompt("Enter file name:");

    // ❌ User pressed Cancel OR Empty → Stop
    if (!fileName || fileName.trim() === "") return;

    // Only selected columns (Actions column excluded)
    const exportCols = selectedColumns.filter(col => col !== "actions");

    const excelData = filtered.map((row, index) => {
      const obj = {};

      exportCols.forEach(col => {
        switch (col) {
          case "sno":
            obj["S.No"] = index + 1;
            break;
          case "employeeName":
            obj["Employee"] = row.employeeName;
            break;
          case "leaveType":
            obj["Leave Type"] = row.leaveType;
            break;
          case "description":
            obj["Description"] = row.description;
            break;
          case "startDate":
            obj["Start Date"] = row.startDate;
            break;
          case "endDate":
            obj["End Date"] = row.endDate;
            break;
          case "duration":
            obj["Days"] = row.duration;
            break;
          case "prescriptionImg":
            obj["Prescription"] = row.prescriptionImg || "--";
            break;
          case "status":
            obj["Status"] = row.status;
            break;
          default:
            break;
        }
      });

      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leaves");

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // Render table cells
  const renderCell = (col, l, idx) => {
    switch (col) {
      case "sno":
        return start + idx + 1;
      case "prescriptionImg":
        return l.prescriptionImg ? (
          <a href={l.prescriptionImg} target="_blank" rel="noreferrer">
            View
          </a>
        ) : (
          "--"
        );
      case "status":
        return (
          <Badge
            bg={
              l.status === "Approved"
                ? "success"
                : l.status === "Rejected"
                ? "danger"
                : "warning"
            }
          >
            {l.status}
          </Badge>
        );
      case "actions":
        return (
          <div className="d-flex gap-2 justify-content-center">
            <Button
              size="sm"
              variant="success"
              disabled={l.status !== "Pending"}
              onClick={() => approveLeave(l.id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={l.status !== "Pending"}
              onClick={() => rejectLeave(l.id)}
            >
              Reject
            </Button>
          </div>
        );
      default:
        return l[col];
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} username={admin.name} role={admin.role} />
        <div className="p-4 container">
          <PageHeading title="All Leave Requests" />

          {/* Filters */}
          <CardContainer>
            <Row className="align-items-center g-2">
              <Col md={3}>
                <Form.Control
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </Col>

              <Col md={3}>
                <Form.Select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
                  <option value="">All Employees</option>
                  {employeeNames.map((n, i) => (
                    <option key={i} value={n}>
                      {n}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                  <option value="">All Leave Types</option>
                  {leaveTypes.map((t, i) => (
                    <option key={i} value={t}>
                      {t}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                  <option value="">All Months</option>
                  {["January","Feburary","March","April","May","June","July","August","September","October","November","December"].map((m,i)=>(
                    <option key={i} value={i+1}>{m}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={3}>
                <Form.Select value={rowsPerPage} onChange={(e)=>setRowsPerPage(e.target.value)}>
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                  <option value="All">All</option>
                </Form.Select>
              </Col>

              <Col md={3} className="d-flex gap-2 justify-content-end">
                <Button variant="secondary" onClick={handleReset}>Reset</Button>
                <Button variant="outline-primary" onClick={() => setShowColumnsModal(true)}>
                  <Gear />
                </Button>
                <Button variant="success" onClick={exportToExcel}>
                  <FileEarmarkText />
                </Button>
              </Col>
            </Row>
          </CardContainer>

          {/* Table */}
          <CardContainer className="mt-3">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "40vh" }}>
                <Spinner animation="border" variant="warning" />
              </div>
            ) : (
              <>
                <Table bordered hover responsive className="mt-2 text-center">
                  <thead style={{ backgroundColor: "#FFA500", color: "white" }}>
                    <tr>
                      {selectedColumns.map(cKey => (
                        <th key={cKey}>{allColumns.find(c => c.key === cKey)?.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((l, idx) => (
                      <tr key={l.id}>
                        {selectedColumns.map(col => (
                          <td key={col}>{renderCell(col, l, idx)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Pagination */}
                {rowsPerPage !== "All" && (
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <Button
                      variant="outline-primary"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>

                    <span>
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline-primary"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContainer>

          {/* Columns Modal */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Select Columns to Display</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {allColumns.map(c => (
                <Form.Check
                  key={c.key}
                  type="checkbox"
                  label={c.label}
                  checked={selectedColumns.includes(c.key)}
                  onChange={() => {
                    setSelectedColumns(prev =>
                      prev.includes(c.key)
                        ? prev.filter(k => k !== c.key)
                        : [...prev, c.key]
                    );
                  }}
                />
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowColumnsModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default AllLeaves;
