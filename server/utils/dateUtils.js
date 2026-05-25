/**
 * Returns true if a message timestamp (seconds) falls within [startMs, endMs].
 * @param {number} timestampSeconds  - message.timestamp from whatsapp-web.js
 * @param {number} startMs           - Date.getTime() start
 * @param {number} endMs             - Date.getTime() end
 */
function isInRange(timestampSeconds, startMs, endMs) {
  const ms = timestampSeconds * 1000;
  return ms >= startMs && ms <= endMs;
}

/**
 * Parse a date string (YYYY-MM-DD) and optional time string (HH:MM) into a UTC ms timestamp.
 * Falls back to start-of-day / end-of-day when time is not provided.
 * @param {string} dateStr   e.g. "2024-01-15"
 * @param {string} [timeStr] e.g. "09:30"
 * @param {'start'|'end'} position  determines default time when omitted
 * @returns {number} milliseconds since epoch
 */
function parseDatetime(dateStr, timeStr, position = 'start') {
  const [year, month, day] = dateStr.split('-').map(Number);
  let hours = 0;
  let minutes = 0;

  if (timeStr) {
    [hours, minutes] = timeStr.split(':').map(Number);
  } else if (position === 'end') {
    hours = 23;
    minutes = 59;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

/**
 * Format a Date object to a safe filename fragment: YYYY-MM-DD.
 */
function toDateSlug(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

module.exports = { isInRange, parseDatetime, toDateSlug };
