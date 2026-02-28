/**
 * Calendar card styles for professor planning.
 * Stored in localStorage as professorCalendarStyle.
 */
export const CALENDAR_STYLE_KEY = 'professorCalendarStyle';

export const CALENDAR_STYLES = [
  { id: 'default', key: 'default' },
  { id: 'gradient', key: 'gradient' },
  { id: 'status', key: 'status' },
  { id: 'compact', key: 'compact' },
  { id: 'minimal', key: 'minimal' },
  { id: 'border', key: 'border' },
];

export function getCalendarStyle() {
  try {
    const s = localStorage.getItem(CALENDAR_STYLE_KEY);
    return CALENDAR_STYLES.some((x) => x.id === s) ? s : 'default';
  } catch {
    return 'default';
  }
}

export function setCalendarStyle(style) {
  try {
    localStorage.setItem(CALENDAR_STYLE_KEY, style);
    window.dispatchEvent(new CustomEvent('calendarStyleChanged', { detail: style }));
  } catch (_) {}
}

/** Week view course card classes by calendarStyle and status (completed|live|upcoming) */
export function getWeekCourseCardClass(calendarStyle, status) {
  const base = 'rounded-xl p-3 card-hover transition-all duration-200';
  const completed = status === 'completed';
  const live = status === 'live';
  const upcoming = status === 'upcoming';

  if (live) {
    return `${base} bg-emerald-500/20 dark:bg-emerald-500/15 border-2 border-emerald-500/50 dark:border-emerald-400/50`;
  }

  switch (calendarStyle) {
    case 'gradient':
      return completed
        ? `${base} bg-gradient-to-r from-slate-500/90 to-slate-600/90 dark:from-slate-600 dark:to-slate-700 text-white border border-slate-400/30`
        : `${base} bg-gradient-to-r from-pink-400/90 to-pink-600/90 dark:from-pink-500 dark:to-pink-600 text-white border border-pink-300/30`;
    case 'status':
      return completed
        ? `${base} bg-slate-500/80 dark:bg-slate-600/80 text-white border-2 border-slate-400/50`
        : `${base} bg-pink-primary/90 dark:bg-pink-400/90 text-white border-2 border-pink-300/50`;
    case 'compact':
      return completed
        ? `${base} bg-slate-100/80 dark:bg-slate-800/50 border-l-4 border-slate-500 text-slate-700 dark:text-slate-300`
        : `${base} bg-pink-soft/50 dark:bg-pink-500/20 border-l-4 border-pink-primary dark:border-pink-400 text-pink-dark dark:text-pink-300`;
    case 'minimal':
      return completed
        ? `${base} bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600`
        : `${base} bg-pink-soft/60 dark:bg-pink-500/20 text-pink-dark dark:text-pink-200 border border-pink-200 dark:border-pink-500/40`;
    case 'border':
      return completed
        ? `${base} bg-white/80 dark:bg-slate-800/50 border-2 border-slate-400 dark:border-slate-500 text-slate-700 dark:text-slate-300`
        : `${base} bg-white/80 dark:bg-pink-500/10 border-2 border-pink-primary dark:border-pink-400 text-pink-dark dark:text-pink-300`;
    default:
      return completed
        ? `${base} bg-slate-500/80 dark:bg-slate-600/90 text-white border border-slate-400/30`
        : `${base} bg-gradient-to-r from-pink-soft/50 to-transparent dark:from-white/5 dark:to-transparent border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg`;
  }
}
