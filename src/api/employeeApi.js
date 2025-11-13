import axios from "./axios"; // your pre-configured axios instance

const res = await axios.get("/api/v1/employees"); // ab perfect match hoga
export const getEmployeeById = (id) => axios.get(`/api/v1/employees/${id}`);
export const addEmployee = (data) => axios.post("/api/v1/employees", data);
export const updateEmployee = (id, data) => axios.put(`/api/v1/employees/${id}`, data);
export const deleteEmployee = (id) => axios.delete(`/api/v1/employees/${id}`);
