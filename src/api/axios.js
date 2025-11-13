// src/api/axios.js
import axios from "axios";

// ✅ Base Axios instance
const instance = axios.create({
  baseURL: "http://localhost:8080", // no /api here
  headers: {
    "Content-Type": "application/json",
  },
});

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

export default instance;
