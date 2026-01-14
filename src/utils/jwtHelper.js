// src/utils/jwtHelper.js
const jwtHelper = {
  getRoleFromToken: (token) => {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1])); // decode JWT payload
      return payload.role || null;
    } catch (err) {
      console.error("Invalid token:", err);
      return null;
    }
  },
};

export default jwtHelper;