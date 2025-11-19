// src/components/CurrentSessionCard.jsx
import React from "react";
import { Button } from "react-bootstrap";

const CurrentSessionCard = ({
  currentSession,
  formatTimeAMPM,
  handleClockIn,
  handleClockOut,
  handleTakeBreak,
  loading,
}) => {
  // Status logic
  const getStatus = () => {
    if (!currentSession?.clockIn) return "No Session";
    if (currentSession.clockOut) return "Completed";
    if (currentSession.onBreak) return "On Break";
    return "Working";
  };

  // Total Hours / Working Hours / Break Duration formatting
  const totalHours = currentSession?.clockIn
    ? ((currentSession.clockOut || new Date()) - new Date(currentSession.clockIn)) / 1000 / 3600
    : 0;

const breakHours = currentSession?.breaks?.reduce((sum, b) => {
  const start = new Date(b.startTime);
  const end = b.endTime ? new Date(b.endTime) : new Date(); // agar break ongoing hai
  return sum + (end - start) / 1000 / 3600; // milliseconds to hours
}, 0) || 0;
  const workingHours = totalHours - breakHours;

  const formatDuration = (hoursDecimal) => {
    const totalMinutes = Math.round(hoursDecimal * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <div>
          <p>Clock In: {formatTimeAMPM(currentSession?.clockIn)}</p>
          <p>Clock Out: {formatTimeAMPM(currentSession?.clockOut)}</p>
          <p>Total Hours: {formatDuration(totalHours)}</p>
          <p>Working Hours: {formatDuration(workingHours)}</p>
          <p>Break Duration: {formatDuration(breakHours)}</p>
          <p>Status: {getStatus()}</p>
        </div>

        <div className="d-flex gap-2 flex-wrap mt-2">
          {!currentSession?.clockIn || currentSession.clockOut ? (
            <Button variant="success" onClick={handleClockIn} disabled={loading}>
              {loading ? "Processing..." : "Clock In"}
            </Button>
          ) : (
            <Button variant="danger" onClick={handleClockOut} disabled={loading}>
              {loading ? "Processing..." : "Clock Out"}
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
  );
};

export default CurrentSessionCard;
