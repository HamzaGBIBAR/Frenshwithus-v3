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
