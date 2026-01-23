import React, { useEffect, useState } from "react";
import { 
  Table, 
  Button, 
  Spinner, 
  Form, 
  Row, 
  Col, 
  Modal, 
  Badge 
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import TopNavbar from "../../../components/Navbar";
import CardContainer from "../../../components/CardContainer";
import PageHeading from "../../../components/PageHeading";
import { getAllShifts, deleteShift } from "../../../api/shiftApi";
import { Eye, PencilSquare, Trash, Gear, FileEarmarkText } from "react-bootstrap-icons";
import * as XLSX from "xlsx";

const allColumns = [
  { key: "sno", label: "S.No" },
  { key: "shiftName", label: "Shift Name" },
  { key: "startsAt", label: "Start Time" },
  { key: "endsAt", label: "End Time" },
  { key: "managerName", label: "Managed By" },
  { key: "actions", label: "Actions" },
];

// Time formatter function for AM/PM
const formatTimeAMPM = (timeString) => {
  if (!timeString) return "--";

  const lower = timeString.toLowerCase();
  // If already contains am/pm, just return
  if (lower.includes("am") || lower.includes("pm")) return timeString;

  const parts = timeString.split(":");
  if (parts.length < 2) return timeString;

  let hour = parseInt(parts[0], 10);
  if (Number.isNaN(hour)) return timeString;

  const minutes = parts[1].slice(0, 2); // handle HH:mm or HH:mm:ss
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minutes} ${ampm}`;
};

const ViewShifts = ({ onLogout }) => {
  const [shifts, setShifts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [managers, setManagers] = useState([]);

  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const defaultVisible = ["sno", "shiftName", "startsAt", "endsAt", "managerName", "actions"];
  const [selectedColumns, setSelectedColumns] = useState(defaultVisible);
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchShifts = async () => {
    try {
      const res = await getAllShifts();
      setShifts(res.data);
      setFiltered(res.data);

      const uniqueManagers = [
        ...new Set(res.data.map(s => s.managerName).filter(Boolean)),
      ].sort();
      setManagers(uniqueManagers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  // FILTERING (theme ki tarha)
  useEffect(() => {
    let result = shifts;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        [
          s.shiftName,
          s.managerName,
          s.startsAt,
          s.endsAt
        ].some(v => v?.toLowerCase().includes(term))
      );
    }

    if (managerFilter) {
      result = result.filter(s => s.managerName === managerFilter);
    }

    // Sort by shift name
    result = [...result].sort((a, b) => (a.shiftName || "").localeCompare(b.shiftName || ""));

    setFiltered(result);
    setCurrentPage(1);
  }, [searchTerm, managerFilter, shifts]);

  const totalPages =
    rowsPerPage === "All"
      ? 1
      : Math.ceil(filtered.length / rowsPerPage || 1);

  const paginatedData =
    rowsPerPage === "All"
      ? filtered
      : filtered.slice(
          (currentPage - 1) * rowsPerPage,
          currentPage * rowsPerPage
        );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this shift?")) return;
    await deleteShift(id);
    fetchShifts();
  };

  const handleViewEmployees = (shift) => {
    navigate("/admin/employee-shifts/assign", {
      state: {
        filterShiftId: shift.id,
        filterShiftName: shift.shiftName,
        filterStartTime: shift.startsAt,
        filterEndTime: shift.endsAt,
      },
    });
  };

  const handleExport = () => {
    const fileName = prompt("Enter file name:", "Shifts_List");
    if (!fileName) return;

    const exportCols = selectedColumns.filter((c) => c !== "actions");
    const headers = exportCols.map(
      (colKey) => allColumns.find((c) => c.key === colKey).label
    );

    const data = filtered.map((shift, idx) =>
      exportCols.map((col) => {
        if (col === "sno") return idx + 1;
        if (col === "startsAt" || col === "endsAt")
          return formatTimeAMPM(shift[col]);
        return shift[col] || "--";
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shifts");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const handleReset = () => {
    setSearchTerm("");
    setManagerFilter("");
    setRowsPerPage(15);
    setCurrentPage(1);
    setSelectedColumns(defaultVisible);
  };

  const toggleColumn = (key) => {
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter((k) => k !== key));
    } else {
      setSelectedColumns(
        allColumns
          .filter(
            (c) => selectedColumns.includes(c.key) || c.key === key
          )
          .map((c) => c.key)
      );
    }
  };

  const handlePrevious = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  const cellStyle = {
    padding: "4px 8px",
    fontSize: "0.85rem",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  };

  const renderCell = (col, shift, index) => {
    switch (col) {
      case "sno":
        return rowsPerPage === "All"
          ? index + 1
          : (currentPage - 1) * rowsPerPage + index + 1;

      case "shiftName":
        return (
          <span className="fw-semibold text-dark">
            {shift.shiftName}
          </span>
        );

      case "managerName":
        return (
          <Badge bg="secondary" className="fw-normal">
            {shift.managerName || "--"}
          </Badge>
        );

      case "startsAt":
      case "endsAt":
        return (
          <Badge bg="info" className="fw-normal">
            {formatTimeAMPM(shift[col])}
          </Badge>
        );

      case "actions":
        return (
          <div className="d-flex justify-content-center gap-1">
            <Button
              variant="outline-info"
              size="sm"
              style={{ padding: "2px 5px" }}
              onClick={() => handleViewEmployees(shift)}
              title="View assigned employees"
            >
              <Eye />
            </Button>
            <Button
              variant="outline-warning"
              size="sm"
              style={{ padding: "2px 5px" }}
              onClick={() => navigate(`/admin/shifts/edit/${shift.id}`)}
            >
              <PencilSquare />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              style={{ padding: "2px 5px" }}
              onClick={() => handleDelete(shift.id)}
            >
              <Trash />
            </Button>
          </div>
        );

      default:
        return shift[col] || "--";
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <TopNavbar
          toggleSidebar={toggleSidebar}
          username={localStorage.getItem("name")}
          role={localStorage.getItem("role")}
        />

        <div className="p-3 container-fluid">
          <PageHeading
            title="All Shifts"
            buttonText="Add Shift"
            onButtonClick={() => navigate("/admin/shifts/add")}
          />

          {/* FILTERS CARD - same theme style */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col lg={3} md={4} sm={12}>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="Search shifts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>

              <Col lg={3} md={4} sm={6}>
                <Form.Select
                  size="sm"
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                >
                  <option value="">All Managers</option>
                  {managers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col lg={2} md={4} sm={6}>
                <Form.Select
                  size="sm"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: "90px" }}
                >
                  {[15, 25, 50, "All"].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col
                lg={4}
                md={12}
                sm={12}
                className="d-flex gap-2 justify-content-lg-end justify-content-md-start"
              >
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleReset}
                  title="Reset"
                >
                  ↻
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowColumnsModal(true)}
                  title="Columns"
                >
                  <Gear />
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleExport}
                  title="Export"
                >
                  <FileEarmarkText />
                </Button>
              </Col>
            </Row>
          </CardContainer>

          {/* TABLE CONTAINER - theme matched */}
          <CardContainer className="mt-3" style={{ padding: "0px" }}>
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="warning" />
              </div>
            ) : (
              <>
                <div
                  style={{
                    overflowX: "auto",
                    maxWidth: "100%",
                    borderRadius: "8px",
                  }}
                >
                  <Table bordered hover size="sm" className="mb-0 w-100">
                    <thead
                      style={{
                        backgroundColor: "#FFA500",
                        color: "#fff",
                        textAlign: "center",
                      }}
                    >
                      <tr>
                        {selectedColumns.map((col) => (
                          <th
                            key={col}
                            style={{
                              padding: "8px",
                              fontSize: "0.85rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {allColumns.find((c) => c.key === col).label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((shift, idx) => (
                        <tr key={shift.id} style={{ textAlign: "center" }}>
                          {selectedColumns.map((col) => (
                            <td key={col} style={cellStyle}>
                              {renderCell(col, shift, idx)}
                            </td>
                          ))}
                        </tr>
                      ))}

                      {paginatedData.length === 0 && (
                        <tr>
                          <td
                            colSpan={selectedColumns.length}
                            className="text-center p-3 text-muted"
                          >
                            No shifts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {rowsPerPage !== "All" && paginatedData.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={handlePrevious}
                    >
                      Previous
                    </Button>
                    <span className="small text-muted">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContainer>

          {/* COLUMN MODAL - same style as employees page */}
          <Modal
            show={showColumnsModal}
            onHide={() => setShowColumnsModal(false)}
            centered
            scrollable
            size="sm"
          >
            <Modal.Header closeButton className="py-2">
              <Modal.Title className="fs-6">
                Show/Hide Columns
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {allColumns.map((col) => (
                <Form.Check
                  key={col.key}
                  type="switch"
                  id={`col-${col.key}`}
                  label={col.label}
                  checked={selectedColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="mb-2"
                />
              ))}
            </Modal.Body>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ViewShifts;