import axios from "./axios";

export const startBreak = (sessionId) =>
  axios.post("/api/v1/breaks", { workSessionId: sessionId, startTime: new Date() });

export const endBreak = (breakId) =>
  axios.put(`/api/v1/breaks/${breakId}`, { endTime: new Date() });
