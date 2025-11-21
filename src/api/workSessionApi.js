import axios from "./axios";

export const getCurrentUser = () => axios.get("/api/v1/work-sessions/me");
export const getWorkSessions = (employeeId) =>
  axios.get(`/api/v1/work-sessions/employee/${employeeId}`);
export const getActiveSession = () => axios.get("/api/v1/work-sessions/active");
export const clockIn = () => axios.post("/api/v1/work-sessions/clock-in");
export const clockOut = (sessionId) =>
  axios.put(`/api/v1/work-sessions/clock-out/${sessionId}`);
// fetch current user
export const getMe = () => axios.get("/api/v1/work-sessions/me");
