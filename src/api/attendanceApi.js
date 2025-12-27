import api from "./axios";

// Mark attendance for the current employee
export const markAttendance = () => 
  api.post("/v1/attendance/mark");

// Get attendance for the current employee
export const getMyAttendance = () => 
  api.get("/v1/attendance/my");

// Get all attendance (admin only)
export const getAllAttendance = () =>
  api.get("/v1/attendance/all");
