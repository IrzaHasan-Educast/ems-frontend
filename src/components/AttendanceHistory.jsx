// // src/components/AttendanceHistory.jsx
// import React, { useState, useEffect } from "react";
// import axios from "../api/axios";

// const AttendanceHistory = ({ employeeId }) => {
//   const [sessions, setSessions] = useState([]);

//   useEffect(() => {
//     fetchHistory();
//   }, []);

//   const fetchHistory = async () => {
//     try {
//       const res = await axios.get(`/api/v1/work-sessions/${employeeId}/history`);
//       setSessions(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   return (
//     <div className="card p-3 shadow-sm">
//       <h5>Attendance History</h5>
//       <table className="table table-striped mt-2">
//         <thead>
//           <tr>
//             <th>Date</th>
//             <th>Clock In</th>
//             <th>Clock Out</th>
//             <th>Total Hours</th>
//             <th>Breaks</th>
//           </tr>
//         </thead>
//         <tbody>
//           {sessions.map((s) => (
//             <tr key={s.id}>
//               <td>{new Date(s.clockIn).toLocaleDateString()}</td>
//               <td>{new Date(s.clockIn).toLocaleTimeString()}</td>
//               <td>{s.clockOut ? new Date(s.clockOut).toLocaleTimeString() : "-"}</td>
//               <td>{s.totalHours || 0}</td>
//               <td>{s.breaks?.length || 0}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default AttendanceHistory;


// src/components/AttendanceHistory.jsx
import React, { useEffect, useState } from "react";
// import axios from "../api/axios"; // ❌ API temporarily disabled

const AttendanceHistory = ({ employeeId }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // fetchSessions(); // ❌ API temporarily disabled
    // Using hardcoded dummy data
    const dummySessions = [
      {
        id: 1,
        date: new Date("2025-11-14"),
        clockIn: new Date("2025-11-14T09:00:00"),
        clockOut: new Date("2025-11-14T17:00:00"),
        totalHours: 8,
        breaks: [
          { id: 1, startTime: new Date("2025-11-14T12:30:00"), endTime: new Date("2025-11-14T13:00:00") }
        ]
      },
      {
        id: 2,
        date: new Date("2025-11-13"),
        clockIn: new Date("2025-11-13T10:00:00"),
        clockOut: new Date("2025-11-13T18:30:00"),
        totalHours: 8.5,
        breaks: []
      }
    ];
    setSessions(dummySessions);
  }, []);

  return (
    <div className="card p-3 shadow-sm mt-3">
      <h5>Attendance History</h5>
      {sessions.length === 0 ? (
        <p>No attendance records found.</p>
      ) : (
        <table className="table table-sm mt-2">
          <thead>
            <tr>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Total Hours</th>
              <th>Breaks</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.date.toLocaleDateString()}</td>
                <td>{session.clockIn.toLocaleTimeString()}</td>
                <td>{session.clockOut ? session.clockOut.toLocaleTimeString() : "-"}</td>
                <td>{session.totalHours}</td>
                <td>
                  {session.breaks.length > 0
                    ? session.breaks.map((b) => `${b.startTime.toLocaleTimeString()} - ${b.endTime.toLocaleTimeString()}`).join(", ")
                    : "No Breaks"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AttendanceHistory;
