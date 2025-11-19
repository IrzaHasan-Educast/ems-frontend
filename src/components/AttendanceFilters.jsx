// src/components/AttendanceFilters.jsx
import React, { useState } from "react";

const AttendanceFilters = ({ onApply }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const applyFilters = () => {
    onApply({ from, to, month, year });
  };

  return (
    <div className="filters-container">
      <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
      <input type="date" value={to} onChange={e => setTo(e.target.value)} />

      <select value={month} onChange={e => setMonth(e.target.value)}>
        <option value="">Month</option>
        <option value="1">January</option>
        <option value="2">February</option>
      </select>

      <select value={year} onChange={e => setYear(e.target.value)}>
        <option value="">Year</option>
        <option value="2025">2025</option>
      </select>

      <button className="apply-btn" onClick={applyFilters}>
        Apply
      </button>
    </div>
  );
};

export default AttendanceFilters;
