import React, { useEffect, useState } from "react";
import { Button, Badge, Spinner } from "react-bootstrap";

const CurrentSessionCard = ({
  currentSession,
  formatTimeAMPM,
  handleClockIn,
  handleClockOut,
  handleTakeBreak,
  loading,
}) => {
  const [elapsed, setElapsed] = useState(0);

  // Live timer update
  useEffect(() => {
    if (!currentSession?.clockIn || currentSession.clockOut) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      const diff = new Date() - new Date(currentSession.clockIn);
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession]);

  const formatElapsed = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}h:${mins
      .toString()
      .padStart(2, "0")}m:${secs.toString().padStart(2, "0")}s`;
  };

  // Status logic
  const getStatus = () => {
    if (!currentSession?.clockIn) return "No Session";
    if (currentSession.clockOut) return "Completed";
    if (currentSession.onBreak) return "On Break";
    return "Working";
  };

  // Hours calculation
  const totalHours =
    currentSession?.clockIn
      ? ((currentSession.clockOut || new Date()) - new Date(currentSession.clockIn)) / 1000 / 3600
      : 0;

  const breakHours =
    currentSession?.breaks?.reduce((sum, b) => {
      const start = new Date(b.startTime);
      const end = b.endTime ? new Date(b.endTime) : new Date();
      return sum + (end - start) / 1000 / 3600;
    }, 0) || 0;

  const workingHours = totalHours - breakHours;

  const formatDuration = (hoursDecimal) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const statusColor =
    getStatus() === "Working"
      ? "success"
      : getStatus() === "On Break"
      ? "warning"
      : "secondary";

  return (
    <div className="p-3 border rounded shadow-sm bg-light">
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
        <div>
          <p>
            <strong>Clock In:</strong> {formatTimeAMPM(currentSession?.clockIn)}
          </p>
          <p>
            <strong>Clock Out:</strong> {formatTimeAMPM(currentSession?.clockOut)}
          </p>
          <p>
            <strong>Total Hours:</strong> {formatDuration(totalHours)}
          </p>
          <p>
            <strong>Working Hours:</strong> {formatDuration(workingHours)}
          </p>
          <p>
            <strong>Break Duration:</strong> {formatDuration(breakHours)}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <Badge bg={statusColor} style={{ fontSize: "1em" }}>
              {getStatus()}
            </Badge>
          </p>
        </div>

        <div className="d-flex flex-column gap-2 mt-2 align-items-center">
          <h5 style={{ fontFamily: "monospace", color: "#055993" }}>
            {currentSession?.clockIn && !currentSession.clockOut ? formatElapsed(elapsed) : "--"}
          </h5>

          <div className="d-flex gap-2 flex-wrap">
            {!currentSession?.clockIn || currentSession.clockOut ? (
              <Button variant="success" onClick={handleClockIn} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : "Clock In"}
              </Button>
            ) : (
              <Button variant="danger" onClick={handleClockOut} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : "Clock Out"}
              </Button>
            )}

            <Button
              variant={currentSession?.onBreak ? "warning" : "info"}
              onClick={handleTakeBreak}
              disabled={!currentSession?.clockIn || currentSession.clockOut}
            >
              {currentSession?.onBreak ? "End Break" : "Take Break"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentSessionCard;
