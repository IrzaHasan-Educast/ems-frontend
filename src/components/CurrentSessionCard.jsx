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
  const [breakElapsed, setBreakElapsed] = useState(0);

  // --- Timer Logic ---
  useEffect(() => {
    const clockIn = parseApiDate(currentSession?.clockInTime);
    if (!clockIn || currentSession?.clockOutTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(getNowUTC().getTime() - clockIn.getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession?.clockInTime, currentSession?.clockOutTime]);

  // --- Break Timer Logic ---
  useEffect(() => {
    if (!currentSession?.onBreak) {
      setBreakElapsed(0);
      return;
    }

    // Find current active break
    const activeBreak = currentSession?.breaks?.find(b => !b.endTime);
    const breakStart = parseApiDate(activeBreak?.startTime);
    
    if (!breakStart) {
      setBreakElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setBreakElapsed(getNowUTC().getTime() - breakStart.getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession?.onBreak, currentSession?.breaks]);

  // --- Formatters ---
  const formatElapsed = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
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
    if (hrs === 0) return `${mins}m`;
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
  const isWorking = status === "Working";
  const isOnBreak = status === "On Break";
  const isInactive = status === "Inactive" || status === "Completed";

  return (
    <div className="w-100">
      {/* 1. TOP HEADER: Status & Clock In Time */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Badge
          bg={isWorking ? "success" : isOnBreak ? "warning" : "secondary"}
          className="px-3 py-2 rounded-pill d-flex align-items-center gap-2"
          style={{ fontSize: "0.9rem" }}
        >
          {isWorking && (
            <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
          )}
          {isOnBreak && (
            <i className="bi bi-cup-hot-fill"></i>
          )}
          {status.toUpperCase()}
        </Badge>
        <div className="text-end">
          <small className="text-muted d-block text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>
            Started At
          </small>
          <span className="fw-bold text-dark">{formatTimeAMPM(currentSession?.clockInTime) || "--:--"}</span>
        </div>
      </div>

      {/* 2. HERO SECTION: The Timer - Changes based on break state */}
      <div 
        className="text-center py-4 mb-4 rounded-3"
        style={{
          backgroundColor: isOnBreak ? "#fff3cd" : isWorking ? "#d1e7dd" : "#f8f9fa",
          border: isOnBreak ? "2px dashed #ffc107" : isWorking ? "2px solid #198754" : "1px solid #dee2e6",
          transition: "all 0.3s ease"
        }}
      >
        {/* Show Break Timer when on break */}
        {isOnBreak ? (
          <>
            <div className="mb-2">
              <i className="bi bi-cup-hot-fill text-warning fs-2"></i>
            </div>
            <h1 className="display-4 fw-bold mb-0" style={{ color: "#ff6b00" }}>
              {formatElapsed(breakElapsed)}
            </h1>
            <small className="text-warning fw-bold">BREAK TIME RUNNING</small>
            <div className="mt-3 px-3">
              <div className="progress" style={{ height: "6px" }}>
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                  role="progressbar" 
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="display-4 fw-bold text-dark mb-0">
              {currentSession?.clockInTime && !currentSession?.clockOutTime
                ? formatElapsed(elapsed)
                : "00:00:00"}
            </h1>
            <small className="text-muted">
              {isWorking ? "Active Working Time" : "Total Elapsed Time"}
            </small>
          </>
        )}
      </div>

      {/* 3. CONTROLS: Buttons */}
      <Row className="g-2 mb-4 justify-content-center">
        {isInactive ? (
          <Col xs={10}>
            <Button
              variant="success"
              size="lg"
              className="w-100 py-3 fw-bold shadow-sm"
              onClick={handleClockIn}
              disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" /> : (
                <>
                  <i className="bi bi-play-circle-fill me-2"></i>
                  START SESSION
                </>
              )}
            </Button>
          </Col>
        ) : (
          <>
            {/* Break Button */}
            <Col xs={12}>
              <Button
                variant={isOnBreak ? "primary" : "warning"}
                size="lg"
                className="w-100 py-3 fw-bold text-white shadow-sm border-0 position-relative"
                style={{ 
                  backgroundColor: isOnBreak ? "#0d6efd" : "#fd7e14",
                  animation: isOnBreak ? "pulse 2s infinite" : "none"
                }}
                onClick={handleTakeBreak}
                disabled={loading}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <i className={`bi ${isOnBreak ? 'bi-play-fill' : 'bi-cup-hot-fill'} me-2`}></i>
                    {isOnBreak ? "Resume Work" : "Take Break"}
                  </>
                )}
              </Button>
            </Col>

            {/* Clock Out Button */}
            <Col xs={12}>
              <Button
                variant="outline-danger"
                size="lg"
                className="w-100 py-3 fw-bold shadow-sm"
                onClick={handleClockOut}
                disabled={loading || isOnBreak}
                title={isOnBreak ? "End break first to clock out" : ""}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
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
          <Row className="text-center g-0">
            <Col xs={4} className="border-end">
              <small className="text-muted d-block text-uppercase" style={{ fontSize: "0.65rem" }}>
                Working
              </small>
              <span className="fw-bold text-success d-block" style={{ fontSize: "1.1rem" }}>
                {formatDuration(workingHours)}
              </span>
              {isWorking && <i className="bi bi-check-circle-fill text-success small"></i>}
            </Col>
            <Col xs={4} className="border-end">
              <small className="text-muted d-block text-uppercase" style={{ fontSize: "0.65rem" }}>
                Break
              </small>
              <span className="fw-bold text-warning d-block" style={{ fontSize: "1.1rem" }}>
                {formatDuration(breakHours)}
              </span>
              {isOnBreak && <i className="bi bi-cup-hot-fill text-warning small"></i>}
            </Col>
            <Col xs={4}>
              <small className="text-muted d-block text-uppercase" style={{ fontSize: "0.65rem" }}>
                Shift End
              </small>
              <span className="fw-bold text-dark d-block" style={{ fontSize: "1.1rem" }}>
                {currentSession?.clockOutTime ? formatTimeAMPM(currentSession.clockOutTime) : "..."}
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export default CurrentSessionCard;