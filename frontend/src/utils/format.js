/**
 * Format "HH:mm" (24h) to "h:mm AM/PM"
 */
export function formatTimeAMPM(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const hour = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Format Date or ISO string to "h:mm AM/PM"
 */
export function formatDateToAMPM(dateOrISO) {
  if (!dateOrISO) return '';
  const d = dateOrISO instanceof Date ? dateOrISO : new Date(dateOrISO);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
