import api from "./axios";  // axios instance with REACT_APP_API

// Employee APIs
export const getAllEmployees = () => api.get("/api/v1/employees");
export const getEmployeeById = (id) => api.get(`/api/v1/employees/${id}`);
export const addEmployee = (data) => api.post("/api/v1/employees", data);
export const updateEmployee = (id, data) => api.put(`/api/v1/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/api/v1/employees/${id}`);
export const getRoles = () => api.get("/api/v1/roles");
export const toggleActiveEmployee = (id) => api.put(`/api/v1/employees/toggle-active/${id}`);

// ✅ User APIs for edit page
export const getUserByEmployeeId = (employeeId) =>
  api.get(`/api/v1/users/employee/${employeeId}`);

export const updateUser = (userId, data) =>
  api.put(`/api/v1/users/${userId}`, data);
