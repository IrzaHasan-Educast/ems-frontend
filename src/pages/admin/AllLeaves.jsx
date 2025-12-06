// src/pages/admin/AllLeaves.jsx

import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal, Badge } from "react-bootstrap";
import Sidebar from "../../components/Sidebar";
import TopNavbar from "../../components/Navbar";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getAllLeaves, approveLeave, rejectLeave } from "../../api/leaveApi";
import { getCurrentUser } from "../../api/userApi";
import { Gear } from "react-bootstrap-icons";
import * as XLSX from "xlsx";

const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "employeeName", label: "Employee" },
  { key: "leaveType", label: "Leave Type" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "duration", label: "Duration" },
  { key: "description", label: "Description" },
  { key: "prescriptionImg", label: "Prescription" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

const AllLeaves = ({ onLogout }) => {
  const [leaves, setLeaves] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedColumns, setSelectedColumns] = useState(allColumns.map(c => c.key));
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  const [admin, setAdmin] = useState({ name: "", role: "" });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchAdmin = async () => {
      const res = await getCurrentUser();
      setAdmin({
        name: res.data.fullName,
        role: res.data.role,
      });
    };
    fetchAdmin();
  }, []);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await getAllLeaves();
        setLeaves(res.data);
        setFiltered(res.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    fetchLeaves();
  }, []);

  // Filtering
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    let f = leaves.filter((l) => {
      const matchSearch =
        [l.employeeName, l.leaveType, l.description, l.status]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchStatus = statusFilter ? l.status === statusFilter : true;

      return matchSearch && matchStatus;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, leaves]);

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("");
    setRowsPerPage(10);
    setCurrentPage(1);
    setSelectedColumns(allColumns.map(c => c.key));
  };

  const handleApprove = async (id) => {
    await approveLeave(id);
    const updated = leaves.map(l => l.id === id ? { ...l, status: "APPROVED" } : l);
    setLeaves(updated);
  };

  const handleReject = async (id) => {
    await rejectLeave(id);
    const updated = leaves.map(l => l.id === id ? { ...l, status: "REJECTED" } : l);
    setLeaves(updated);
  };

  const totalPages =
    rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);

  const displayed =
    rowsPerPage === "All"
      ? filtered
      : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter(k => k !== key));
    } else {
      setSelectedColumns([...selectedColumns, key]);
    }
  };

  const renderCell = (col, l, index) => {
    switch (col) {
      case "sno":
        return (currentPage - 1) * rowsPerPage + index + 1;

      case "employeeName":
        return l.employeeName;

      case "leaveType":
        return l.leaveType;

      case "startDate":
        return l.startDate;

      case "endDate":
        return l.endDate;

      case "duration":
        return l.duration + " Days";

      case "description":
        return l.description;

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
              l.status === "APPROVED"
                ? "success"
                : l.status === "REJECTED"
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
              disabled={l.status !== "PENDING"}
              onClick={() => handleApprove(l.id)}
            >
              Approve
            </Button>

            <Button
              size="sm"
              variant="danger"
              disabled={l.status !== "PENDING"}
              onClick={() => handleReject(l.id)}
            >
              Reject
            </Button>
          </div>
        );

      default:
        return "--";
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} username={admin.name} role={admin.role} />

        <div className="p-4 container">
          <PageHeading title="All Leave Requests" />

          <CardContainer>
            <Row className="align-items-center g-2">
              <Col md={3}>
                <Form.Control
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>

              <Col md={3}>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </Form.Select>
              </Col>

              <Col md={2}>
                <Form.Select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(e.target.value)}
                >
                  {[10, 25, 50, "All"].map((num) => (
                    <option key={num} value={num}>
                      {num} per page
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4} className="d-flex gap-2 justify-content-end">
                <Button variant="secondary" onClick={handleReset}>
                  Reset
                </Button>

                <Button variant="outline-primary" onClick={() => setShowColumnsModal(true)}>
                  <Gear />
                </Button>
              </Col>
            </Row>
          </CardContainer>

          <CardContainer className="mt-3">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: "40vh" }}>
                <Spinner animation="border" variant="warning" />
              </div>
            ) : (
              <>
                <Table bordered hover responsive className="mt-2">
                  <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                    <tr>
                      {selectedColumns.map(colKey => {
                        const col = allColumns.find(c => c.key === colKey);
                        return <th key={colKey}>{col.label}</th>;
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {displayed.map((l, idx) => (
                      <tr key={l.id} style={{ textAlign: "center" }}>
                        {selectedColumns.map(col => (
                          <td key={col}>{renderCell(col, l, idx)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {rowsPerPage !== "All" && (
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <Button
                      variant="outline-primary"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    <span>
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline-primary"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContainer>

          {/* Column Selection Modal */}
          <Modal show={showColumnsModal} onHide={() => setShowColumnsModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Select Columns to Display</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {allColumns.map(col => (
                <Form.Check
                  key={col.key}
                  type="checkbox"
                  label={col.label}
                  checked={selectedColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
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
