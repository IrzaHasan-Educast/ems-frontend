// // src/components/AttendanceCard.jsx
// import React, { useState, useEffect } from "react";
// import axios from "../api/axios";
// import AppButton from "./AppButton";

// const AttendanceCard = ({ employeeId }) => {
//   const [currentSession, setCurrentSession] = useState(null);
//   const [currentBreak, setCurrentBreak] = useState(null);

//   useEffect(() => {
//     fetchTodaySession();
//   }, []);

//   const fetchTodaySession = async () => {
//     try {
//       const res = await axios.get(`/api/v1/work-sessions/${employeeId}/today`);
//       if (res.data) setCurrentSession(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleClockIn = async () => {
//     try {
//       const res = await axios.post("/api/v1/work-sessions/start", { employeeId });
//       setCurrentSession(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleClockOut = async () => {
//     try {
//       const res = await axios.put(`/api/v1/work-sessions/end/${currentSession.id}`);
//       setCurrentSession(null);
//       setCurrentBreak(null);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleBreakStart = async () => {
//     try {
//       const res = await axios.post("/api/v1/work-sessions/break/start", { workSessionId: currentSession.id });
//       setCurrentBreak(res.data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleBreakEnd = async () => {
//     try {
//       const res = await axios.put(`/api/v1/work-sessions/break/end/${currentBreak.id}`);
//       setCurrentBreak(null);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   return (
//     <div className="card p-3 mb-4 shadow-sm">
//       {!currentSession ? (
//         <AppButton text="Clock In" variant="success" onClick={handleClockIn} />
//       ) : (
//         <>
//           <p>Clocked in at: {new Date(currentSession.clockIn).toLocaleTimeString()}</p>
//           <p>Total Hours: {currentSession.totalHours || 0}</p>

//           {currentBreak ? (
//             <AppButton text="End Break" variant="warning" onClick={handleBreakEnd} />
//           ) : (
//             <AppButton text="Start Break" variant="secondary" onClick={handleBreakStart} />
//           )}

//           <AppButton text="Clock Out" variant="danger" onClick={handleClockOut} className="mt-2" />
//         </>
//       )}
//     </div>
//   );
// };

// export default AttendanceCard;


// src/components/AttendanceCard.jsx
import React, { useState, useEffect } from "react";
import AppButton from "./AppButton";
// import axios from "../api/axios"; // ❌ API temporarily disabled

const AttendanceCard = ({ employeeId }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [currentBreak, setCurrentBreak] = useState(null);

  useEffect(() => {
    // fetchTodaySession();
    // ❌ API call commented out, using hardcoded dummy session
    const dummySession = {
      id: 1,
      clockIn: new Date(new Date().setHours(9, 0, 0)), // 9:00 AM
      clockOut: null,
      totalHours: 0,
      breaks: [],
    };
    setCurrentSession(dummySession);
  }, []);

  const handleClockIn = () => {
    const session = {
      id: 2,
      clockIn: new Date(),
      clockOut: null,
      totalHours: 0,
      breaks: [],
    };
    setCurrentSession(session);
  };

  const handleClockOut = () => {
    setCurrentSession(null);
    setCurrentBreak(null);
  };

  const handleBreakStart = () => {
    const brk = { id: 1, startTime: new Date(), endTime: null };
    setCurrentBreak(brk);
  };

  const handleBreakEnd = () => {
    setCurrentBreak(null);
  };

  return (
    <div className="card p-3 mb-4 shadow-sm">
      {!currentSession ? (
        <AppButton text="Clock In" variant="success" onClick={handleClockIn} />
      ) : (
        <>
          <p>Clocked in at: {new Date(currentSession.clockIn).toLocaleTimeString()}</p>
          <p>Total Hours: {currentSession.totalHours || 0}</p>

          {currentBreak ? (
            <AppButton text="End Break" variant="warning" onClick={handleBreakEnd} />
          ) : (
            <AppButton text="Start Break" variant="secondary" onClick={handleBreakStart} />
          )}

          <AppButton text="Clock Out" variant="danger" onClick={handleClockOut} className="mt-2" />
        </>
      )}
    </div>
  );
};

export default AttendanceCard;
