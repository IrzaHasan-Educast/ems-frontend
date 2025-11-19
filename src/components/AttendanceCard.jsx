// src/components/AttendanceCard.jsx
import React from "react";
import "./AttendanceCard.css";

const AttendanceCard = ({ dayLabel, clockIn, clockOut, totalHours }) => {
  return (
    <div className="attendance-card">
      <h5 className="day">{dayLabel}</h5>

      <div className="row-item">
        <span>Clock In</span>
        <strong>{clockIn}</strong>
      </div>

      <div className="row-item">
        <span>Clock Out</span>
        <strong>{clockOut}</strong>
      </div>

      <div className="row-item">
        <span>Total Hours</span>
        <strong>{totalHours}</strong>
      </div>
    </div>
  );
};

export default AttendanceCard;
