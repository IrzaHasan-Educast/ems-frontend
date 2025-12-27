import api from "./axios";

// Start a break for a work session
export const startBreak = (sessionId) =>
  api.post("/v1/breaks", { 
    workSessionId: sessionId, 
    startTime: new Date() 
  });

// End a break by break ID
export const endBreak = (breakId) =>
  api.put(`/v1/breaks/${breakId}`, { 
    endTime: new Date() 
  });
