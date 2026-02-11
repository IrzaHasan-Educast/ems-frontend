import React, { useState, useEffect, useCallback } from "react";
import { Table, Form, Button, InputGroup, FormControl, Spinner, Badge, Row, Col } from "react-bootstrap";

import CardContainer from "../../components/CardContainer";
import PageHeading from "../../components/PageHeading";
import { getCurrentUser, getWorkSessions } from "../../api/workSessionApi";

const WorkSessionHistory = () => {  
  // 2. States
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);


  // --- HELPERS ---
  const formatTimeAMPM = (date) => {
    if (!date) return "--";
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  };

  const formatDate = (date) => {
    if (!date) return "--";
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`; // 19-Jan-26
  };

  const getMonthName = (dateStr) => {
    // Expecting format: YYYY-MM-DD or similar
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", { month: "long" });
  };

  const isoToMillis = (iso) => {
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const h = parseInt(match[1] || 0);
    const m = parseInt(match[2] || 0);
    const s = parseInt(match[3] || 0);
    return ((h * 60 + m) * 60 + s) * 1000;
  };

  const millisToHMS = (ms) => {
    if (!ms || ms < 0) return "0h 0m";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`; // Simplified
  };

  // --- DATA FETCHING ---
  const fetchHistory = useCallback(async (employeeId) => {
    setLoading(true);
    try {
      const res = await getWorkSessions(employeeId);
      if (res.data && Array.isArray(res.data)) {
        const formatted = res.data.map((s) => {
          const clockIn = new Date(s.clockInTime);
          const clockOut = s.clockOutTime ? new Date(s.clockOutTime) : null;
          const now = new Date();

          let totalMs = 0, workingMs = 0, breakMs = 0;

          if (s.status === "Completed" || s.status.includes("Clocked Out")) {
            // Completed
            totalMs = isoToMillis(s.totalSessionHours);
            workingMs = isoToMillis(s.totalWorkingHours);
            breakMs = isoToMillis(s.idleTime);
          } else {
            // Active
            totalMs = now - clockIn;
            breakMs = isoToMillis(s.idleTime);
            workingMs = totalMs - breakMs;
          }

          return {
            id: s.id,
            dateObj: clockIn, // For Sorting
            date: formatDate(clockIn),
            monthName: clockIn.toLocaleString("en-US", { month: "long" }),
            clockIn: formatTimeAMPM(clockIn),
            clockOut: clockOut ? formatTimeAMPM(clockOut) : "--",
            totalHours: millisToHMS(totalMs),
            workingHours: millisToHMS(workingMs),
            breakHours: millisToHMS(breakMs),
            status: s.status,
          };
        });

        // Sort: Latest first
        formatted.sort((a, b) => b.dateObj - a.dateObj);

        setHistory(formatted);
        setFiltered(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        const res = await getCurrentUser();
        setEmployee({ fullName: res.data.fullName, id: res.data.employeeId });
        fetchHistory(res.data.employeeId);
      } catch (err) {
        console.error("Failed fetching user", err);
        setLoading(false);
      }
    };
    initData();
  }, [fetchHistory]);

  // --- FILTERING ---
  useEffect(() => {
    let result = [...history];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((h) =>
        [h.date, h.status].join(" ").toLowerCase().includes(q)
      );
    }

    if (selectedMonth) {
      result = result.filter((h) => h.monthName === selectedMonth);
    }

    if (selectedStatus) {
      result = result.filter((h) => h.status === selectedStatus);
    }

    setFiltered(result);
    setCurrentPage(1);
  }, [searchQuery, selectedMonth, selectedStatus, history]);

  // --- HANDLERS ---
  const handleReset = () => {
    setSelectedMonth("");
    setSelectedStatus("");
    setSearchQuery("");
    setRowsPerPage(10);
    setCurrentPage(1);
    setFiltered(history);
  };

  // --- PAGINATION ---
  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = rowsPerPage === "All" ? filtered : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrevious = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // --- UI HELPERS ---
  const getStatusBadge = (status) => {
    const map = {
      "Completed": "success",
      "Working": "primary",
      "On Break": "warning",
      "Invalid Clocked Out": "danger",
      "Auto Clocked Out": "info",
      "Early Clocked Out": "secondary"
    };
    return <Badge bg={map[status] || "secondary"}>{status}</Badge>;
  };

  const uniqueMonths = [...new Set(history.map((h) => h.monthName))];
  const uniqueStatus = [...new Set(history.map((h) => h.status))];

  return (
    <>
        <div className="p-3 container-fluid">
          <PageHeading title="Work Session History" />

          {/* FILTERS */}
          <CardContainer>
            <Row className="g-2 align-items-center">
              <Col lg={3} md={6}>
                <InputGroup size="sm">
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <FormControl
                    placeholder="Search date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </Col>

              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {uniqueMonths.map((m) => <option key={m} value={m}>{m}</option>)}
                </Form.Select>
              </Col>

              <Col lg={2} md={4} sm={6}>
                <Form.Select size="sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="">All Status</option>
                  {uniqueStatus.map((s) => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </Col>

              <Col lg={2} md={4} sm={6}>
                 <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
                  {[10, 25, 50, "All"].map(n => <option key={n} value={n}>{n} per page</option>)}
                </Form.Select>
              </Col>

              <Col lg={3} md={12} className="d-flex justify-content-end gap-2">
                <Button variant="secondary" size="sm" onClick={handleReset}>↻</Button>
              </Col>
            </Row>
          </CardContainer>

          {/* TABLE */}
          <CardContainer className="mt-3" style={{ padding: "0" }}>
            {loading ? (
              <div className="text-center p-5"><Spinner animation="border" variant="warning" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center p-5 text-muted">No session records found.</div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <Table bordered hover size="sm" className="mb-0 w-100">
                    <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                      <tr>
                        <th className="p-2">S. No.</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Clock In</th>
                        <th className="p-2">Clock Out</th>
                        <th className="p-2">Total Hours</th>
                        <th className="p-2">Working Hours</th>
                        <th className="p-2">Break Hours</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((h, idx) => (
                        <tr key={h.id} style={{ textAlign: "center", verticalAlign: "middle" }}>
                          <td style={{padding: "6px"}}>{rowsPerPage === "All" ? idx + 1 : (currentPage - 1) * rowsPerPage + idx + 1}</td>
                          <td style={{padding: "6px"}}>{h.date}</td>
                          <td style={{padding: "6px"}}>{h.clockIn}</td>
                          <td style={{padding: "6px"}}>{h.clockOut}</td>
                          <td style={{padding: "6px"}}>{h.totalHours}</td>
                          <td style={{padding: "6px"}}>{h.workingHours}</td>
                          <td style={{padding: "6px"}}>{h.breakHours}</td>
                          <td style={{padding: "6px"}}>{getStatusBadge(h.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* PAGINATION */}
                {rowsPerPage !== "All" && paginatedData.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-3">
                    <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrevious}>Previous</Button>
                    <span className="small text-muted">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
                  </div>
                )}
              </>
            )}
          </CardContainer>

        </div>
      </>
  );
};

export default WorkSessionHistory;