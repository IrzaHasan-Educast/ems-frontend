import axios from "./axios";

// Employee APIs
export const getAllEmployees = () => axios.get("/api/v1/employees");
export const getEmployeeById = (id) => axios.get(`/api/v1/employees/${id}`);
export const addEmployee = (data) => axios.post("/api/v1/employees", data);
export const updateEmployee = (id, data) => axios.put(`/api/v1/employees/${id}`, data);
export const deleteEmployee = (id) => axios.delete(`/api/v1/employees/${id}`);
export const getRoles = () => axios.get("/api/v1/roles");

// ✅ User APIs for edit page
export const getUserByEmployeeId = (employeeId) =>
  axios.get(`/api/v1/users/employee/${employeeId}`);

export const updateUser = (userId, data) =>
  axios.put(`/api/v1/users/${userId}`, data);
