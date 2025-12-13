// src/utils/time.js

const PK_TZ = "Asia/Karachi";

// checks if the string already contains timezone info (Z or +05:00 etc)
const hasTimeZoneInfo = (s) => /Z$|[+-]\d{2}:\d{2}$/.test(s);

// ✅ Parse backend date safely
// If backend date has TZ => normal Date()
// If backend date has NO TZ => treat it as Pakistan local time
export const parseApiDate = (value) => {
  if (!value) return null;

  // if already Date
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  let s = String(value).trim();

  // normalize "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}\s/.test(s)) {
    s = s.replace(" ", "T");
  }

  // case 1: has timezone => parse directly
  if (hasTimeZoneInfo(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // case 2: NO timezone => treat as Pakistan time (UTC+5)
  // build an actual UTC instant by subtracting +05:00
  // Example: "2025-12-13T16:00:42" PK => UTC = 11:00:42
  const match = s.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) {
    // fallback
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  const [, y, mo, d, h, mi, se] = match;
  const year = Number(y);
  const month = Number(mo) - 1;
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  const second = Number(se || 0);

  // Pakistan is UTC+5 (no DST)
  const utcMs = Date.UTC(year, month, day, hour - 5, minute, second);
  return new Date(utcMs);
};

// ✅ display time in Pakistan
export const formatTimeAMPM = (value) => {
  const d = parseApiDate(value);
  if (!d) return "--";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: PK_TZ,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
};

// ✅ display date in Pakistan
export const formatPakistanDateLabel = (value) => {
  const d = parseApiDate(value);
  if (!d) return "--";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: PK_TZ,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
};

export const getNowUTC = () => new Date();
