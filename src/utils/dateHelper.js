// src/utils/dateHelper.js
export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return new Date(dateStr).toLocaleDateString("en-GB", options); // e.g., 08 Dec 2025
};
