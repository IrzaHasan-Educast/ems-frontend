import api from "./axios";

export const assignShift = (data) =>
  api.post("/v1/employee-shifts/assign", data);

export const getAllEmployeeShifts = () =>
  api.get("/v1/employee-shifts");

export const deleteEmployeeShift = (id) =>
  api.delete(`/v1/employee-shifts/${id}`);

export const updateEmployeeShift = (data) =>
  api.put("/v1/employee-shifts/update", data);

export const getMyShiftDetails = ()=>
api.get("/v1/employee-shifts/my");

export const getEmployeeShiftByEmployeeId = (empId) => api.get(`/v1/employee-shifts/employeeId/${empId}`);
export const getEmployeeListByManager = () => api.get("/v1/employee-shifts/employees");
export const getEmployeeShiftCountByManager = () => api.get("/v1/employee-shifts/shift/employee-count");
