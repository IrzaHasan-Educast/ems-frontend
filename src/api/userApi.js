import api from "./axios"; // axios instance with baseURL and interceptors

// Get the currently logged-in user
export const getCurrentUser = () => api.get("/v1/users/me");
