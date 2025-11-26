// src/api/axios.js
import axios from "axios";

// ✅ Base Axios instance
const instance = axios.create({
  baseURL: process.env.REACT_APP_API,
  
  headers: {
    "Content-Type": "application/json",
  },
});
console.log("API BASE URL:", process.env.REACT_APP_API);

// ✅ Add token automatically if exists
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Auto logout when token is expired OR backend sends 401
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url;
    if (error.response?.status === 401 && !url?.includes("/auth/login")) {
      // Token expired or invalid on protected APIs
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default instance;
