import api from "./axios";

// -------------------- Leave APIs --------------------

// Apply leave (employee)
export const applyLeave = (leaveData) => api.post("/v1/leaves", leaveData);

// Update leave (employee/admin)
export const updateLeave = (leaveId, leaveData) => api.put(`/v1/leaves/${leaveId}`, leaveData);

// Approve leave (admin)
export const approveLeave = (leaveId) => api.put(`/v1/leaves/${leaveId}/approve`);

// Reject leave (admin)
export const rejectLeave = (leaveId) => api.put(`/v1/leaves/${leaveId}/reject`);

// Reject leave (admin)
export const setPendingLeave = (leaveId) => api.put(`/v1/leaves/${leaveId}/pending`);

// Get all leaves (admin)
export const getAllLeaves = () => api.get("/v1/leaves/admin");

// Get leaves of their employees
export const getEmployeeLeavesByManager = () => api.get("/v1/leaves/manager");

// Get leaves by employee
export const getLeavesByEmployee = (employeeId) => api.get(`/v1/leaves/employee/${employeeId}`);

// Delete leave (employee, only pending)
export const deleteLeaveById = (leaveId) => api.delete(`/v1/leaves/employee/${leaveId}`);

// Get leaves by status
export const getLeavesByStatus = (status) => api.get(`/v1/leaves/status/${status}`);

// Get leave types
export const getLeaveTypes = () => api.get("/v1/leaves/types");

// Upload prescription
export const uploadPrescription = (formData) =>
  api.post("/v1/upload/prescription", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });