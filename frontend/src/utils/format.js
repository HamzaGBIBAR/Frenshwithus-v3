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
 * Compute end time from start "HH:mm" and duration in minutes. Returns "HH:mm" (same day).
 */
export function getEndTime(startTimeStr, durationMin) {
  if (!startTimeStr) return '';
  const [h, m] = startTimeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '';
  const dur = Number(durationMin) || 0;
  const start = new Date(2000, 0, 1, h, m, 0);
  const end = new Date(start.getTime() + dur * 60 * 1000);
  return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
}

/**
 * Format course time range: "10:00 AM – 11:00 AM" from start (HH:mm) and duration (min).
 */
export function formatTimeRange(startTimeStr, durationMin) {
  if (!startTimeStr) return '';
  const end = getEndTime(startTimeStr, durationMin);
  if (!end) return formatTimeAMPM(startTimeStr);
  return `${formatTimeAMPM(startTimeStr)} – ${formatTimeAMPM(end)}`;
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

/**
 * Format professor name professionally: "Prof. Anas" instead of "anas"
 */
export function formatProfessorName(name) {
  if (!name) return '';
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return `Prof. ${capitalized}`;
}

/**
 * Format student name professionally: "Élève Amin" (prefix from i18n)
 */
export function formatStudentName(name, studentLabel = 'Élève') {
  if (!name) return '';
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return `${studentLabel} ${capitalized}`;
}
