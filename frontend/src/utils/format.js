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
 * Get course start as Date. Uses startUtc (UTC) when set, else parses date+time as Africa/Casablanca.
 * Dynamically resolves the Morocco UTC offset (handles Ramadan UTC+0 vs standard UTC+1).
 */
export function getCourseStartMorocco(course) {
  if (course?.startUtc) return new Date(course.startUtc);
  if (!course?.date || !course?.time) return null;
  const timePart = course.time.length <= 5 ? `${course.time}:00` : course.time;
  const isoStr = `${course.date}T${timePart}`;
  try {
    // Determine Morocco's actual UTC offset for this date using Africa/Casablanca IANA timezone
    const probe = new Date(`${isoStr}Z`); // treat as UTC to get a reference point
    const moroccoStr = probe.toLocaleString('sv-SE', { timeZone: 'Africa/Casablanca' });
    const moroccoProbeTime = new Date(`${moroccoStr.replace(' ', 'T')}Z`);
    const offsetMs = probe.getTime() - moroccoProbeTime.getTime();
    // Adjust: course local time - offset = UTC
    const courseLocal = new Date(`${isoStr}Z`);
    return new Date(courseLocal.getTime() + offsetMs);
  } catch (_) {
    // Fallback to standard Morocco offset UTC+1
    return new Date(`${isoStr}+01:00`);
  }
}

/** True only when we should show "professor absent": course has that reason AND we're past start + 15 min (Morocco). */
export function shouldShowProfessorAbsent(course) {
  if (course?.endReason !== 'professor_absent' && course?.absenceReason !== 'professor_absent') return false;
  
  // Use Morocco timezone string comparison for accuracy during Ramadan
  if (course?.date && course?.time) {
    try {
      const now = new Date();
      const moroccoNow = now.toLocaleString('sv-SE', { timeZone: 'Africa/Casablanca' });
      const moroccoDateStr = moroccoNow.slice(0, 10);
      const moroccoTimeStr = moroccoNow.slice(11, 16);
      const courseTimeShort = course.time.slice(0, 5);
      
      // If course is still in the future, don't show professor absent
      if (course.date > moroccoDateStr || (course.date === moroccoDateStr && courseTimeShort > moroccoTimeStr)) {
        return false;
      }
      
      // Check if 15 minutes have passed since course start
      if (course.date === moroccoDateStr) {
        const [ch, cm] = courseTimeShort.split(':').map(Number);
        const [nh, nm] = moroccoTimeStr.split(':').map(Number);
        const courseMinutes = ch * 60 + cm;
        const nowMinutes = nh * 60 + nm;
        return nowMinutes >= courseMinutes + 15;
      }
      
      // Course date is in the past - professor absent should show
      return true;
    } catch (_) { /* Fall through to UTC-based check */ }
  }
  
  // Fallback: UTC-based check
  const d = getCourseStartMorocco(course);
  if (!d || isNaN(d.getTime())) return false;
  const now = new Date();
  return now.getTime() >= d.getTime() + 15 * 60 * 1000;
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
