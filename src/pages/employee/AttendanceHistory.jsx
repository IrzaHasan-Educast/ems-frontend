import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Badge, InputGroup, Card } from "react-bootstrap";
import PageHeading from "../../components/PageHeading";
import CardContainer from "../../components/CardContainer";
import { getMyAttendance } from "../../api/attendanceApi";
import { getMyShiftDetails } from "../../api/employeeShiftApi"; 
import { getCurrentUser } from "../../api/workSessionApi";

const AttendanceHistory = () => {
  // States
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [shiftInfo, setShiftInfo] = useState(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // --- HELPER: Time Logic ---
  const getTimeColor = (attTime, shiftStart) => {
    if (!attTime || !shiftStart) return "text-dark";

    const att = new Date(`1970-01-01T${attTime}`);
    const start = new Date(`1970-01-01T${shiftStart}`);
    const diffMs = att - start;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return "text-success fw-bold"; 
    if (diffMins >= 0 && diffMins <= 15) return "text-dark";
    if (diffMins > 15 && diffMins <= 60) return "text-warning fw-bold";
    if (diffMins > 60) return "text-danger fw-bold";

    return "text-dark";
  };

  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return "--";
    const [h, m, s] = timeStr.split(":");
    const date = new Date();
    date.setHours(h, m, s || 0);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resEmp = await getCurrentUser();
        setEmployee({ fullName: resEmp.data.fullName, id: resEmp.data.employeeId });

        let myShift = null;
        try {
          const shiftRes = await getMyShiftDetails();
          myShift = shiftRes.data; 
          setShiftInfo(myShift);
        } catch (e) {
          console.warn("Shift details fetch failed");
        }

        const res = await getMyAttendance();
        const formatted = res.data.map((a, index) => {
          const timeColor = myShift ? getTimeColor(a.attendanceTime, myShift.startsAt) : "text-dark";

          return {
            id: index + 1,
            rawDate: new Date(a.attendanceDate),
            date: formatDate(a.attendanceDate),
            monthName: new Date(a.attendanceDate).toLocaleString("en-US", { month: "long" }),
            time: formatTimeAMPM(a.attendanceTime),
            presentStatus: a.present ? "Present" : "Absent",
            timeColor: timeColor
          };
        });

        formatted.sort((a, b) => b.rawDate - a.rawDate);
        setRecords(formatted);
        setFiltered(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- FILTERING ---
  useEffect(() => {
    let result = [...records];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(r => r.date.toLowerCase().includes(q));
    }
    if (selectedMonth) {
      result = result.filter(r => r.monthName === selectedMonth);
    }
    setFiltered(result);
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, records]);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedMonth("");
    setRowsPerPage(10);
    setCurrentPage(1);
    setFiltered(records);
  };

  // --- PAGINATION ---
  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filtered.length / rowsPerPage);
  const displayed = rowsPerPage === "All" ? filtered : filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const uniqueMonths = [...new Set(records.map(r => r.monthName))];

  // ✅ DIRECT RETURN - No wrapper divs
  return (
    <>
      <PageHeading title="My Attendance History" />

      {/* SHIFT INFO CARD */}
      {shiftInfo && (
        <div className="mb-4">
          <Card className="border-0 shadow-sm text-white" style={{ background: "linear-gradient(135deg, #055993 0%, #044275 100%)", borderRadius: "12px" }}>
            <Card.Body className="d-flex flex-wrap justify-content-between align-items-center py-3 px-4">
              
              <div className="d-flex align-items-center mb-2 mb-md-0">
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px', backgroundColor: 'rgba(255,255,255,0.1)'}}>
                  <i className="bi bi-clock-history fs-3" style={{color: "#f58a29"}}></i>
                </div>
                <div>
                  <small className="text-white-50 text-uppercase fw-bold" style={{fontSize:"0.7rem", letterSpacing: "1px"}}>Current Shift</small>
                  <h4 className="m-0 fw-bold">{shiftInfo.shiftName}</h4>
                </div>
              </div>

              <div className="text-end">
                <Badge bg="light" text="dark" className="fs-6 px-3 py-2 rounded-pill shadow-sm">
                  <span style={{color: "#055993", fontWeight: "bold"}}>{formatTimeAMPM(shiftInfo.startsAt)}</span>
                  <span className="mx-2 text-muted">to</span>
                  <span style={{color: "#055993", fontWeight: "bold"}}>{formatTimeAMPM(shiftInfo.endsAt)}</span>
                </Badge>
              </div>

            </Card.Body>
          </Card>
        </div>
      )}

      {/* FILTERS */}
      <CardContainer>
        <Row className="g-2 align-items-center">
          <Col lg={4} md={12}>
            <InputGroup size="sm">
              <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
              <Form.Control placeholder="Search date..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </InputGroup>
          </Col>

          <Col lg={3} md={6}>
            <Form.Select size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="">All Months</option>
              {uniqueMonths.map((m) => <option key={m}>{m}</option>)}
            </Form.Select>
          </Col>

          <Col lg={2} md={6}>
            <Form.Select size="sm" value={rowsPerPage} onChange={(e) => {setRowsPerPage(e.target.value); setCurrentPage(1);}}>
              {[10, 25, 50, "All"].map(n => <option key={n} value={n}>{n} per page</option>)}
            </Form.Select>
          </Col>

          <Col lg={3} md={12} className="d-flex justify-content-end">
            <Button variant="secondary" size="sm" onClick={handleReset}>↻</Button>
          </Col>
        </Row>
      </CardContainer>

      {/* TABLE */}
      <CardContainer className="mt-3" style={{ padding: "0" }}>
        {loading ? (
          <div className="text-center p-5"><Spinner animation="border" variant="warning" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-5 text-muted">No attendance records found.</div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <Table bordered hover size="sm" className="mb-0 w-100">
                <thead style={{ backgroundColor: "#FFA500", color: "white", textAlign: "center" }}>
                  <tr>
                    <th className="p-2">S.No</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Check-In Time</th>
                    <th className="p-2">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((r, idx) => (
                    <tr key={r.id} style={{ textAlign: "center", verticalAlign: "middle" }}>
                      <td style={{padding: "6px"}}>{rowsPerPage === "All" ? idx + 1 : (currentPage - 1) * rowsPerPage + idx + 1}</td>
                      <td style={{padding: "6px"}}>{r.date}</td>
                      <td style={{padding: "6px"}} className={r.timeColor}>{r.time}</td>
                      <td style={{padding: "6px"}}>
                        <Badge bg={r.presentStatus === "Present" ? "success" : "danger"}>{r.presentStatus}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* PAGINATION */}
            {rowsPerPage !== "All" && displayed.length > 0 && (
              <div className="d-flex justify-content-between align-items-center p-3">
                <Button variant="outline-primary" size="sm" disabled={currentPage === 1} onClick={handlePrev}>Previous</Button>
                <span className="small text-muted">Page {currentPage} of {totalPages}</span>
                <Button variant="outline-primary" size="sm" disabled={currentPage === totalPages} onClick={handleNext}>Next</Button>
              </div>
            )}
          </>
        )}
      </CardContainer>
    </>
  );
};

export default AttendanceHistory;