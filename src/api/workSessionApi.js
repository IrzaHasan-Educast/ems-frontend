import api from "./axios";  // Axios instance with REACT_APP_API

// Work Session APIs

// Get current user's work session
export const getCurrentUser = () => api.get("/v1/work-sessions/me");

// Get all work sessions for a specific employee
export const getWorkSessions = (employeeId) =>
  api.get(`/v1/work-sessions/employee/${employeeId}`);

// Get all work sessions for a specific employee
export const getFirst3WorkSessions = (employeeId) =>
  api.get(`/v1/work-sessions/employee/${employeeId}/latest-sessions`);

// Get currently active session for logged-in user
export const getActiveSession = () => api.get("/v1/work-sessions/active");

// Clock in for the current user
export const clockIn = () => api.post("/v1/work-sessions/clock-in");

// Clock out for a specific session
export const clockOut = (sessionId) =>
  api.put(`/v1/work-sessions/clock-out/${sessionId}`);

// Fetch current logged-in user (duplicate of getCurrentUser, kept for convenience)
export const getMe = () => api.get("/v1/work-sessions/me");

// Admin: Get all work sessions
export const getAllWorkSessions = () => api.get("/v1/admin/work-sessions/all");

export const syncSessionHours = (id, payload) => api.patch(`/v1/admin/work-sessions/${id}/sync-hours`, payload);

// Manager specific APIs
export const getManagerWorkSessionHistory = () => api.get("v1/work-sessions/manager/history");

export const getManagerTeamActiveSessions = () => api.get("v1/work-sessions/manager/active");