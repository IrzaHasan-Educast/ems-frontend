import api from "./axios";

export const getAllShifts = () => {
  return api.get("/v1/shifts");
};

export const addShift = (shift) => {
  return api.post("/v1/shifts", shift);
};

export const updateShift = (id, shift) => {
  return api.put(`/v1/shifts/${id}`, shift);
};

export const getShiftById = (id) => {
  return api.get(`/v1/shifts/${id}`);
};

export const deleteShift = (id) => {
  return api.delete(`/v1/shifts/${id}`);
};
