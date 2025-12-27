import api from "./axios";  // axios instance with REACT_APP_API

// Employee APIs
export const getAllEmployees = () => api.get("/v1/employees");
export const getEmployeeById = (id) => api.get(`/v1/employees/${id}`);
export const addEmployee = (data) => api.post("/v1/employees", data);
export const updateEmployee = (id, data) => api.put(`/v1/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/v1/employees/${id}`);
export const getRoles = () => api.get("/v1/roles");
export const toggleActiveEmployee = (id) => api.put(`/v1/employees/toggle-active/${id}`);

// ✅ User APIs for edit page
export const getUserByEmployeeId = (employeeId) =>
  api.get(`/v1/users/employee/${employeeId}`);

export const updateUser = (userId, data) =>
  api.put(`/v1/users/${userId}`, data);
