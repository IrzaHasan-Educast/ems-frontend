// src/components/AttendanceTable.jsx
import React from "react";
import { Table } from "react-bootstrap";

const AttendanceTable = ({ data }) => {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Date</th>
          <th>Clock In</th>
          <th>Clock Out</th>
          <th>Total Hours</th>
          <th>Break</th>
        </tr>
      </thead>

      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td>{row.date}</td>
            <td>{row.clockIn}</td>
            <td>{row.clockOut}</td>
            <td>{row.totalHours}</td>
            <td>{row.break}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default AttendanceTable;
