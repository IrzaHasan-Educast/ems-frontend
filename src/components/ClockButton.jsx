import React, { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";

const ClockButton = ({ onClockIn, onClockOut, isClockedIn, loading }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="text-center my-4">
      <h2>{formattedTime}</h2>
      <Button
        onClick={isClockedIn ? onClockOut : onClockIn}
        disabled={loading}
        style={{
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          fontSize: "1.5rem",
          backgroundColor: isClockedIn ? "#dc3545" : "#28a745",
          border: "none",
          boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {loading ? <Spinner animation="border" size="sm" /> : isClockedIn ? "Clock Out" : "Clock In"}
      </Button>
    </div>
  );
};

export default ClockButton;
