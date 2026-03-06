/**
 * Availability and lesson timezone handling.
 *
 * RULES:
 * - Database: all availability and lesson times are stored in UTC.
 *   - ProfessorAvailability / StudentAvailability: dayOfWeek (1=Mon..7=Sun) + startTime/endTime as HH:mm in UTC.
 *   - Course: startUtc (DateTime), plus date/time in Morocco for admin display.
 *
 * - Input:
 *   - Teachers/students enter availability in their LOCAL timezone; we convert to UTC before saving.
 *   - Admin enters lesson date/time in Africa/Casablanca; we convert to UTC (startUtc) when creating/updating.
 *
 * - Display:
 *   - Admin: all availability and lessons shown in Africa/Casablanca.
 *   - Teacher/student: availability and lessons shown in their timezone (user.timezone or derived from user.country).
 *
 * User timezone: set by admin when creating/updating user with country (see getTimezoneFromCountry).
 */

const MOROCCO_TZ = 'Africa/Casablanca';

/** Country code (ISO or app code) -> IANA timezone. Used to auto-set user timezone when admin sets country. */
const COUNTRY_TZ = {
  MA: 'Africa/Casablanca', FR: 'Europe/Paris', US: 'America/New_York', 'US-C': 'America/Chicago', 'US-W': 'America/Los_Angeles',
  GB: 'Europe/London', DE: 'Europe/Berlin', ES: 'Europe/Madrid', IT: 'Europe/Rome', BE: 'Europe/Brussels', CH: 'Europe/Zurich',
  DZ: 'Africa/Algiers', TN: 'Africa/Tunis', EG: 'Africa/Cairo', CA: 'America/Toronto', 'CA-W': 'America/Vancouver',
  SA: 'Asia/Riyadh', AE: 'Asia/Dubai', QA: 'Asia/Qatar', KW: 'Asia/Kuwait', LB: 'Asia/Beirut', JO: 'Asia/Amman',
  TR: 'Europe/Istanbul', CN: 'Asia/Shanghai', JP: 'Asia/Tokyo', KR: 'Asia/Seoul', IN: 'Asia/Kolkata',
  BR: 'America/Sao_Paulo', MX: 'America/Mexico_City', AU: 'Australia/Sydney', NZ: 'Pacific/Auckland',
  SN: 'Africa/Dakar', CI: 'Africa/Abidjan', CM: 'Africa/Douala', CD: 'Africa/Kinshasa', NG: 'Africa/Lagos', GH: 'Africa/Accra',
};

function getUserTz(timezone, country) {
  return timezone || (country && COUNTRY_TZ[country]) || MOROCCO_TZ;
}

/** Get IANA timezone from country code. Used when admin creates/updates user with country. */
function getTimezoneFromCountry(country) {
  if (!country || typeof country !== 'string') return MOROCCO_TZ;
  const code = country.trim().toUpperCase();
  return COUNTRY_TZ[code] || MOROCCO_TZ;
}

// Reference Monday for "week template" conversions (any Monday works)
function refDateForDay(dayOfWeek) {
  const d = 5 + Number(dayOfWeek);
  return `2025-01-${String(d).padStart(2, '0')}`;
}

function getZonedParts(date, tz) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const map = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

function zonedDateTimeToUtc(dateStr, timeStr, timeZone) {
  const [year, month, day] = (dateStr || '').split('-').map(Number);
  const [hour, minute] = (timeStr || '').split(':').map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 4; i++) {
    const parts = getZonedParts(new Date(utcMs), timeZone);
    const rendered = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
    const diff = Date.UTC(year, month - 1, day, hour, minute, 0) - rendered;
    utcMs += diff;
    if (Math.abs(diff) < 1000) break;
  }
  return new Date(utcMs);
}

function utcToZonedParts(utcDate, tz) {
  return getZonedParts(utcDate, tz);
}

/**
 * Convert a weekly slot from user's local timezone to UTC (for saving to DB).
 * @returns {{ dayOfWeek: number, startTime: string, endTime: string } | null}
 */
function localSlotToUtc(dayOfWeek, startTime, endTime, fromTz) {
  const refDate = refDateForDay(dayOfWeek);
  const startUtc = zonedDateTimeToUtc(refDate, startTime, fromTz);
  const endUtc = zonedDateTimeToUtc(refDate, endTime || startTime, fromTz);
  if (!startUtc || !endUtc) return null;
  const sp = utcToZonedParts(startUtc, 'UTC');
  const ep = utcToZonedParts(endUtc, 'UTC');
  const jsDow = new Date(Date.UTC(sp.year, sp.month - 1, sp.day)).getUTCDay();
  const dayUtc = jsDow === 0 ? 7 : jsDow;
  return {
    dayOfWeek: dayUtc,
    startTime: `${String(sp.hour).padStart(2, '0')}:${String(sp.minute).padStart(2, '0')}`,
    endTime: `${String(ep.hour).padStart(2, '0')}:${String(ep.minute).padStart(2, '0')}`,
  };
}

/**
 * Convert a weekly slot from Morocco to UTC (for admin adding slot in Morocco time).
 */
function moroccoSlotToUtc(dayOfWeek, startTime, endTime) {
  return localSlotToUtc(dayOfWeek, startTime, endTime, MOROCCO_TZ);
}

/**
 * Convert a weekly slot from UTC (DB) to a target timezone (for display).
 * @returns {{ dayOfWeek: number, startTime: string, endTime: string } | null}
 */
function utcSlotToZoned(dayOfWeek, startTime, endTime, toTz) {
  const refDate = refDateForDay(dayOfWeek);
  const startUtc = new Date(`${refDate}T${startTime}Z`);
  const endUtc = new Date(`${refDate}T${(endTime || startTime).slice(0, 5)}Z`);
  if (isNaN(startUtc.getTime()) || isNaN(endUtc.getTime())) return null;
  const sp = utcToZonedParts(startUtc, toTz);
  const ep = utcToZonedParts(endUtc, toTz);
  const jsDow = new Date(Date.UTC(sp.year, sp.month - 1, sp.day)).getUTCDay();
  const dayZoned = jsDow === 0 ? 7 : jsDow;
  return {
    dayOfWeek: dayZoned,
    startTime: `${String(sp.hour).padStart(2, '0')}:${String(sp.minute).padStart(2, '0')}`,
    endTime: `${String(ep.hour).padStart(2, '0')}:${String(ep.minute).padStart(2, '0')}`,
  };
}

/**
 * Given a UTC weekly slot (dayOfWeek, timeUtc) and a week start (Monday YYYY-MM-DD),
 * return the course (date, time) in Morocco for that week.
 */
function utcSlotToMoroccoDateAndTime(dayOfWeek, timeUtc, weekStartMonday) {
  const [y, m, d] = weekStartMonday.split('-').map(Number);
  const [hh, mm] = (timeUtc || '00:00').split(':').map(Number);
  const dayOffset = dayOfWeek - 1;
  const utcDate = new Date(Date.UTC(y, m - 1, d + dayOffset, hh, mm || 0, 0));
  const parts = getZonedParts(utcDate, MOROCCO_TZ);
  const date = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  const time = `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
  return { date, time };
}

/**
 * Compare two HH:mm strings. Returns -1 if a < b, 0 if a === b, 1 if a > b.
 */
function compareTime(a, b) {
  if (!a || !b) return 0;
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  const av = (ah || 0) * 60 + (am || 0);
  const bv = (bh || 0) * 60 + (bm || 0);
  if (av < bv) return -1;
  if (av > bv) return 1;
  return 0;
}

/**
 * Overlap of two slots on the same day: [max(s1,s2), min(e1,e2)]. Returns null if no overlap.
 */
function overlapSameDay(s1, e1, s2, e2) {
  const start = compareTime(s1, s2) >= 0 ? s1 : s2;
  const end = compareTime(e1, e2) <= 0 ? e1 : e2;
  if (compareTime(start, end) < 0) return { start, end };
  return null;
}

/**
 * Convert admin input (date + time in Morocco) to UTC Date for lesson storage.
 * DATABASE = UTC.
 */
function moroccoDateTimeToUtc(dateStr, timeStr) {
  return zonedDateTimeToUtc(dateStr, timeStr, MOROCCO_TZ);
}

/**
 * Convert UTC Date to Morocco date + time (for admin display).
 */
function utcToMoroccoDateTime(utcDate) {
  if (!utcDate || isNaN(new Date(utcDate).getTime())) return null;
  const d = new Date(utcDate);
  const parts = getZonedParts(d, MOROCCO_TZ);
  return {
    date: `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`,
    time: `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`,
  };
}

/**
 * Convert UTC Date to a target timezone (for student/teacher display).
 * Returns { date, time, displayDate, displayTime }.
 */
function utcToZonedDateTime(utcDate, toTz, locale = 'fr') {
  if (!utcDate || isNaN(new Date(utcDate).getTime())) return null;
  const d = new Date(utcDate);
  const parts = getZonedParts(d, toTz);
  const date = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  const time = `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
  const displayDate = d.toLocaleDateString(locale, { timeZone: toTz, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const displayTime = d.toLocaleTimeString(locale, { timeZone: toTz, hour: '2-digit', minute: '2-digit' });
  return { date, time, displayDate, displayTime };
}

/**
 * Find overlapping slots between professor and student (both in UTC: dayOfWeek, startTime, endTime).
 * Returns array of { dayOfWeek, startUtc, endUtc }.
 */
function findOverlaps(profSlots, studentSlots) {
  const result = [];
  for (const p of profSlots || []) {
    for (const s of studentSlots || []) {
      if (p.dayOfWeek !== s.dayOfWeek) continue;
      const ov = overlapSameDay(p.startTime, p.endTime, s.startTime, s.endTime);
      if (ov) result.push({ dayOfWeek: p.dayOfWeek, startUtc: ov.start, endUtc: ov.end });
    }
  }
  return result;
}

export {
  MOROCCO_TZ,
  COUNTRY_TZ,
  getUserTz,
  getTimezoneFromCountry,
  localSlotToUtc,
  moroccoSlotToUtc,
  utcSlotToZoned,
  utcSlotToMoroccoDateAndTime,
  moroccoDateTimeToUtc,
  utcToMoroccoDateTime,
  utcToZonedDateTime,
  refDateForDay,
  compareTime,
  overlapSameDay,
  findOverlaps,
};
