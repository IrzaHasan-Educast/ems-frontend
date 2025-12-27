import api from "./axios";

export const login = (username, password) =>
  api.post("/v1/auth/login", { username, password });
