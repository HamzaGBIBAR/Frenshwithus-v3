const COUNTRIES = [
  { code: 'MA', name: 'Maroc', tz: 'Africa/Casablanca' },
  { code: 'FR', name: 'France', tz: 'Europe/Paris' },
  { code: 'US', name: 'États-Unis (Est)', tz: 'America/New_York' },
  { code: 'US-C', name: 'États-Unis (Centre)', tz: 'America/Chicago' },
  { code: 'US-W', name: 'États-Unis (Ouest)', tz: 'America/Los_Angeles' },
  { code: 'GB', name: 'Royaume-Uni', tz: 'Europe/London' },
  { code: 'CA', name: 'Canada (Est)', tz: 'America/Toronto' },
  { code: 'CA-W', name: 'Canada (Ouest)', tz: 'America/Vancouver' },
  { code: 'DE', name: 'Allemagne', tz: 'Europe/Berlin' },
  { code: 'ES', name: 'Espagne', tz: 'Europe/Madrid' },
  { code: 'IT', name: 'Italie', tz: 'Europe/Rome' },
  { code: 'BE', name: 'Belgique', tz: 'Europe/Brussels' },
  { code: 'CH', name: 'Suisse', tz: 'Europe/Zurich' },
  { code: 'DZ', name: 'Algérie', tz: 'Africa/Algiers' },
  { code: 'TN', name: 'Tunisie', tz: 'Africa/Tunis' },
  { code: 'EG', name: 'Égypte', tz: 'Africa/Cairo' },
  { code: 'SA', name: 'Arabie Saoudite', tz: 'Asia/Riyadh' },
  { code: 'AE', name: 'Émirats arabes unis', tz: 'Asia/Dubai' },
  { code: 'QA', name: 'Qatar', tz: 'Asia/Qatar' },
  { code: 'KW', name: 'Koweït', tz: 'Asia/Kuwait' },
  { code: 'LB', name: 'Liban', tz: 'Asia/Beirut' },
  { code: 'JO', name: 'Jordanie', tz: 'Asia/Amman' },
  { code: 'TR', name: 'Turquie', tz: 'Europe/Istanbul' },
  { code: 'CN', name: 'Chine', tz: 'Asia/Shanghai' },
  { code: 'JP', name: 'Japon', tz: 'Asia/Tokyo' },
  { code: 'KR', name: 'Corée du Sud', tz: 'Asia/Seoul' },
  { code: 'IN', name: 'Inde', tz: 'Asia/Kolkata' },
  { code: 'BR', name: 'Brésil', tz: 'America/Sao_Paulo' },
  { code: 'MX', name: 'Mexique', tz: 'America/Mexico_City' },
  { code: 'AU', name: 'Australie (Est)', tz: 'Australia/Sydney' },
  { code: 'NZ', name: 'Nouvelle-Zélande', tz: 'Pacific/Auckland' },
  { code: 'SN', name: 'Sénégal', tz: 'Africa/Dakar' },
  { code: 'CI', name: "Côte d'Ivoire", tz: 'Africa/Abidjan' },
  { code: 'CM', name: 'Cameroun', tz: 'Africa/Douala' },
  { code: 'CD', name: 'RD Congo', tz: 'Africa/Kinshasa' },
  { code: 'NG', name: 'Nigeria', tz: 'Africa/Lagos' },
  { code: 'GH', name: 'Ghana', tz: 'Africa/Accra' },
];

// Unique IANA timezones for user profile (value, label)
export const TIMEZONE_OPTIONS = [
  ...new Map(COUNTRIES.map((c) => [c.tz, { value: c.tz, label: `${c.name} (${c.tz})` }])).values(),
];

export default COUNTRIES;

export function getTimezoneByCountry(countryCode) {
  const c = COUNTRIES.find((x) => x.code === countryCode);
  return c?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getLocalDateTime(countryCode, locale = 'fr') {
  const tz = getTimezoneByCountry(countryCode);
  const now = new Date();
  const date = now.toLocaleDateString(locale, {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = now.toLocaleTimeString(locale, {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return { date, time, tz };
}

/**
 * Convert a date+time stored in Morocco timezone to a student's local timezone.
 * Returns { date: 'YYYY-MM-DD', time: 'HH:mm', display: 'formatted string' }
 */
export function convertMoroccoToLocal(dateStr, timeStr, studentCountryCode, locale = 'fr') {
  const moroccoTz = 'Africa/Casablanca';
  const studentTz = getTimezoneByCountry(studentCountryCode);
  const utcDate = zonedDateTimeToUtc(dateStr, timeStr, moroccoTz);
  if (!utcDate) {
    return { date: dateStr, time: timeStr, displayDate: dateStr, displayTime: timeStr };
  }

  const localDate = utcDate.toLocaleDateString(locale, {
    timeZone: studentTz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const localTime = utcDate.toLocaleTimeString(locale, {
    timeZone: studentTz,
    hour: '2-digit',
    minute: '2-digit',
  });

  const parts = getZonedParts(utcDate, studentTz);
  const yyyy = String(parts.year);
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  const hh = String(parts.hour).padStart(2, '0');
  const min = String(parts.minute).padStart(2, '0');

  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}`, displayDate: localDate, displayTime: localTime };
}

/**
 * Convert a wall-clock datetime from one timezone to another.
 * Returns { date: 'YYYY-MM-DD', time: 'HH:mm', dayOfWeek: 1..7 (Mon..Sun), displayDate, displayTime }.
 */
export function convertTimeBetweenTimezones(dateStr, timeStr, fromTz, toTz, locale = 'fr') {
  const utcDate = zonedDateTimeToUtc(dateStr, timeStr, fromTz);
  if (!utcDate) return null;

  const parts = getZonedParts(utcDate, toTz);
  const yyyy = String(parts.year);
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  const hh = String(parts.hour).padStart(2, '0');
  const min = String(parts.minute).padStart(2, '0');

  const jsDow = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const dayOfWeek = jsDow === 0 ? 7 : jsDow;

  const displayDate = utcDate.toLocaleDateString(locale, {
    timeZone: toTz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const displayTime = utcDate.toLocaleTimeString(locale, {
    timeZone: toTz,
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
    dayOfWeek,
    displayDate,
    displayTime,
  };
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
    second: Number(map.second || 0),
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

  const desiredWallClockMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcMs = desiredWallClockMs;

  // Iterate to account for timezone offset and DST rules.
  for (let i = 0; i < 4; i += 1) {
    const parts = getZonedParts(new Date(utcMs), timeZone);
    const renderedWallClockMs = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second || 0
    );
    const diff = desiredWallClockMs - renderedWallClockMs;
    utcMs += diff;
    if (Math.abs(diff) < 1000) break;
  }

  return new Date(utcMs);
}

const MOROCCO_TZ = 'Africa/Casablanca';
// Reference Monday = 2025-01-06 (day 1)
function refDateForDay(dayOfWeek) {
  const d = 5 + Number(dayOfWeek); // Mon=6, Tue=7, ... Sun=12
  return `2025-01-${String(d).padStart(2, '0')}`;
}

/**
 * Convert a weekly slot from Morocco to a target timezone (for display).
 * Returns { dayOfWeek, startTime, endTime, displayDay, displayStart, displayEnd } in target TZ.
 */
export function moroccoSlotToLocal(dayOfWeek, startTime, endTime, toTz, locale = 'fr') {
  const refDate = refDateForDay(dayOfWeek);
  const startOut = convertTimeBetweenTimezones(refDate, startTime, MOROCCO_TZ, toTz, locale);
  const endOut = convertTimeBetweenTimezones(refDate, endTime || startTime, MOROCCO_TZ, toTz, locale);
  if (!startOut || !endOut) return null;
  return {
    dayOfWeek: startOut.dayOfWeek,
    startTime: startOut.time,
    endTime: endOut.time,
    displayDay: startOut.displayDate,
    displayStart: startOut.displayTime,
    displayEnd: endOut.displayTime,
  };
}

/**
 * Convert a weekly slot from user's timezone to Morocco (for saving).
 * Returns { dayOfWeek, startTime, endTime } in Morocco.
 */
export function localSlotToMorocco(dayOfWeek, startTime, endTime, fromTz) {
  const refDate = refDateForDay(dayOfWeek);
  const startOut = convertTimeBetweenTimezones(refDate, startTime, fromTz, MOROCCO_TZ);
  const endOut = convertTimeBetweenTimezones(refDate, endTime || startTime, fromTz, MOROCCO_TZ);
  if (!startOut || !endOut) return null;
  return {
    dayOfWeek: startOut.dayOfWeek,
    startTime: startOut.time,
    endTime: endOut.time,
  };
}
