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
