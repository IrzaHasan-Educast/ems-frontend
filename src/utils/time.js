export const toPakistanDate = (date) => {
  if (!date) return null;

  return new Date(
    new Date(date).toLocaleString("en-US", {
      timeZone: "Asia/Karachi",
    })
  );
};

export const formatTimeAMPM = (date) => {
  if (!date) return "--";
  const d = toPakistanDate(date);

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours}:${minutes}:${seconds} ${ampm}`;
};
