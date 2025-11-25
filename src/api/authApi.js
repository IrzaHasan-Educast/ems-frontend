// src/api/authApi.js
import axios from "./axios";

export const login = (username, password) =>
  axios.post("/api/v1/auth/login", { username, password });
