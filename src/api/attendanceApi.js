import axios from "./axios";

//Mark attendance for the current employee
export const markAttendance = ()=> axios.post("api/v1/attendance/mark");

//Get attendane for the current employee
export const getMyAttendance = ()=> axios.get("api/v1/attendance/my");

// Get all attendance (admin only)
export const getAllAttendance = () => axios.get("api/v1/attendance/all");