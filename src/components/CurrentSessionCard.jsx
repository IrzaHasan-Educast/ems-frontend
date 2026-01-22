import React, { useEffect, useState } from "react";
import { Button, Badge, Spinner, Row, Col, Card } from "react-bootstrap";
import { formatTimeAMPM, getNowUTC, parseApiDate } from "../utils/time";

const CurrentSessionCard = ({
  currentSession,
  handleClockIn,
  handleClockOut,
  handleTakeBreak,
  loading,
}) => {
  const [elapsed, setElapsed] = useState(0);

  // --- Timer Logic ---
  useEffect(() => {
    const clockIn = parseApiDate(currentSession?.clockInTime);
    // If not clocked in OR already clocked out, stop timer
    if (!clockIn || currentSession?.clockOutTime) {
      setElapsed(0);
      return;
    }

    // Update every second
    const interval = setInterval(() => {
      setElapsed(getNowUTC().getTime() - clockIn.getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession?.clockInTime, currentSession?.clockOutTime]);

  // --- Formatters ---
  const formatElapsed = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    // Format: 02 : 15 : 45
    return (
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {hrs.toString().padStart(2, "0")}
        <span className="text-muted mx-1">:</span>
        {mins.toString().padStart(2, "0")}
        <span className="text-muted mx-1">:</span>
        <span style={{ color: "#dc3545" }}>{secs.toString().padStart(2, "0")}</span>
      </span>
    );
  };

  const formatDuration = (hoursDecimal) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if(hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  // --- Calculation Logic ---
  const clockIn = parseApiDate(currentSession?.clockInTime);
  const clockOut = parseApiDate(currentSession?.clockOutTime);

  const totalHours = clockIn
    ? ((clockOut || getNowUTC()).getTime() - clockIn.getTime()) / 1000 / 3600
    : 0;

  const breakHours =
    currentSession?.breaks?.reduce((sum, b) => {
      const start = parseApiDate(b.startTime);
      const end = parseApiDate(b.endTime) || getNowUTC();
      if (!start) return sum;
      return sum + (end.getTime() - start.getTime()) / 1000 / 3600;
    }, 0) || 0;

  const workingHours = Math.max(totalHours - breakHours, 0);

  // --- Status Logic ---
  const getStatus = () => {
    if (!currentSession?.clockInTime) return "Inactive";
    if (currentSession?.clockOutTime) return "Completed";
    if (currentSession?.onBreak) return "On Break";
    return "Working";
  };

  const status = getStatus();
  
  // Define Colors
  const isWorking = status === "Working";
  const isOnBreak = status === "On Break";

  return (
    <div className="w-100">
      {/* 1. TOP HEADER: Status & Clock In Time */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Badge 
          bg={isWorking ? "success" : isOnBreak ? "warning" : "secondary"} 
          className="px-3 py-2 rounded-pill d-flex align-items-center gap-2"
        >
          {isWorking && (
             <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
          )}
          {status.toUpperCase()}
        </Badge>
        <div className="text-end">
            <small className="text-muted d-block text-uppercase" style={{fontSize: "0.7rem", letterSpacing: "1px"}}>Started At</small>
            <span className="fw-bold text-dark">{formatTimeAMPM(currentSession?.clockInTime) || "--:--"}</span>
        </div>
      </div>

      {/* 2. HERO SECTION: The Timer */}
      <div className="text-center py-2 mb-4">
        <h1 className="display-4 fw-bold text-dark mb-0">
          {currentSession?.clockInTime && !currentSession?.clockOutTime
            ? formatElapsed(elapsed)
            : "00:00:00"}
        </h1>
        <small className="text-muted">Total Elapsed Time</small>
      </div>

      {/* 3. CONTROLS: Buttons */}
      <Row className="g-2 mb-4 justify-content-center">
        {/* If no session, show Clock In (Though mostly handled by parent dashboard) */}
        {!currentSession?.clockInTime || currentSession?.clockOutTime ? (
          <Col xs={10}>
            <Button 
                variant="success" 
                size="lg" 
                className="w-100 py-3 fw-bold shadow-sm"
                onClick={handleClockIn} 
                disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" /> : "START SESSION"}
            </Button>
          </Col>
        ) : (
          <>
            {/* Break Button */}
            <Col xs={4}>
              <Button
                variant={isOnBreak ? "primary" : "warning"}
                size="lg"
                className="w-100 py-3 fw-bold text-white shadow-sm border-0"
                style={{ backgroundColor: isOnBreak ? "#0d6efd" : "#fd7e14" }}
                onClick={handleTakeBreak}
                disabled={loading}
              >
                 {loading ? <Spinner animation="border" size="sm" /> : (
                    <>
                        <i className={`bi ${isOnBreak ? 'bi-play-fill' : 'bi-cup-hot'} me-2`}></i>
                        {isOnBreak ? "End Break" : "Take a break"}
                    </>
                 )}
              </Button>
            </Col>

            {/* Clock Out Button */}
            <Col xs={4}>
              <Button
                variant="outline-danger"
                size="lg"
                className="w-100 py-3 fw-bold shadow-sm"
                onClick={handleClockOut}
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : (
                    <>
                        <i className="bi bi-stop-circle me-2"></i>
                        End Shift
                    </>
                )}
              </Button>
            </Col>
          </>
        )}
      </Row>

      {/* 4. FOOTER: Stats Grid */}
      <Card className="bg-light border-0">
        <Card.Body className="py-3 px-2">
            <Row className="text-center g-0 divide-x">
                <Col xs={4} className="border-end">
                    <small className="text-muted d-block text-uppercase" style={{fontSize: "0.65rem"}}>Working</small>
                    <span className="fw-bold text-success">{formatDuration(workingHours)}</span>
                </Col>
                <Col xs={4} className="border-end">
                    <small className="text-muted d-block text-uppercase" style={{fontSize: "0.65rem"}}>Break</small>
                    <span className="fw-bold text-warning">{formatDuration(breakHours)}</span>
                </Col>
                <Col xs={4}>
                    <small className="text-muted d-block text-uppercase" style={{fontSize: "0.65rem"}}>Shift End</small>
                    {/* Placeholder for shift end, or Clock Out time if done */}
                    <span className="fw-bold text-dark">
                        {currentSession?.clockOutTime ? formatTimeAMPM(currentSession.clockOutTime) : "..."}
                    </span>
                </Col>
            </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CurrentSessionCard;