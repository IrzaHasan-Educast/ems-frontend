import React, { useEffect, useState } from "react";
import { Button, Badge, Spinner } from "react-bootstrap";
import { formatTimeAMPM, getNowUTC, parseApiDate } from "../utils/time";

const CurrentSessionCard = ({
  currentSession,
  handleClockIn,
  handleClockOut,
  handleTakeBreak,
  loading,
}) => {
  const [elapsed, setElapsed] = useState(0);

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

  const formatElapsed = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hrs.toString().padStart(2, "0")}h:${mins
      .toString()
      .padStart(2, "0")}m:${secs.toString().padStart(2, "0")}s`;
  };

  const getStatus = () => {
    if (!currentSession?.clockInTime) return "No Session";
    if (currentSession?.clockOutTime) return "Completed";
    if (currentSession?.onBreak) return "On Break";
    return "Working";
  };

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

  const formatDuration = (hoursDecimal) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const status = getStatus();
  const statusColor =
    status === "Working" ? "success" : status === "On Break" ? "warning" : "secondary";

  return (
    <div className="p-3 border rounded shadow-sm bg-light">
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
        <div>
          <p>
            <strong>Clock In:</strong> {formatTimeAMPM(currentSession?.clockInTime)}
          </p>
          <p>
            <strong>Clock Out:</strong> {formatTimeAMPM(currentSession?.clockOutTime)}
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
              {status}
            </Badge>
          </p>
        </div>

        <div className="d-flex flex-column gap-2 mt-2 align-items-center">
          <h5 style={{ fontFamily: "monospace", color: "#055993" }}>
            {currentSession?.clockInTime && !currentSession?.clockOutTime
              ? formatElapsed(elapsed)
              : "--"}
          </h5>

          <div className="d-flex gap-2 flex-wrap">
            {!currentSession?.clockInTime || currentSession?.clockOutTime ? (
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
              disabled={!currentSession?.clockInTime || currentSession?.clockOutTime}
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
