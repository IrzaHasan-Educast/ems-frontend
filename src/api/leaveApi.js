import api from "./axios";

// -------------------- Leave APIs --------------------

// Apply leave (employee)
export const applyLeave = (leaveData) => api.post("/api/leaves", leaveData);

// Update leave (employee/admin)
export const updateLeave = (leaveId, leaveData) => api.put(`/api/leaves/${leaveId}`, leaveData);

// Approve leave (admin)
export const approveLeave = (leaveId) => api.put(`/api/leaves/${leaveId}/approve`);

// Reject leave (admin)
export const rejectLeave = (leaveId) => api.put(`/api/leaves/${leaveId}/reject`);

// Get all leaves (admin)
export const getAllLeaves = () => api.get("/api/leaves");

// Get leaves by employee
export const getLeavesByEmployee = (employeeId) => api.get(`/api/leaves/employee/${employeeId}`);

// Get leaves by status
export const getLeavesByStatus = (status) => api.get(`/api/leaves/status/${status}`);
