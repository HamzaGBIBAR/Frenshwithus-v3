/**
 * Visual week grid for selecting availability.
 * - Rows = hours (default 8–20), columns = Mon–Sun
 * - Click and drag on a day column to select a time range → creates one slot
 * - Existing slots shown as colored bars; click slot to remove (or use delete button)
 * - Animated, responsive, works for professor and student
 */
import { useState, useCallback, useRef, useEffect } from 'react';

const HOUR_START = 8;
const HOUR_END = 21; // 8h to 21h (21 = end of 20h slot)
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

function timeFromHour(h) {
  return `${String(h).padStart(2, '0')}:00`;
}

function hourFromTime(t) {
  if (!t) return null;
  const h = parseInt(t.slice(0, 2), 10);
  return Number.isNaN(h) ? null : h;
}

export default function AvailabilityGrid({
  slots = [],
  dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  onAdd,
  onRemove,
  disabled = false,
  addLabel = 'Add',
  removeLabel = 'Remove',
  emptyMessage = 'Click and drag on a day to add availability.',
}) {
  const [drag, setDrag] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const gridRef = useRef(null);

  const getSlotAt = useCallback((dayOfWeek, hour) => {
    return slots.find((s) => {
      const startH = hourFromTime(s.startTime);
      const endH = hourFromTime(s.endTime);
      if (s.dayOfWeek !== dayOfWeek || startH == null) return false;
      const endHour = endH ?? startH + 1;
      return hour >= startH && hour < endHour;
    });
  }, [slots]);

  const handleMouseDown = useCallback((dayOfWeek, hour) => {
    if (disabled) return;
    setDrag({ dayOfWeek, startHour: hour, endHour: hour });
  }, [disabled]);

  const handleMouseEnter = useCallback((dayOfWeek, hour) => {
    if (!drag || drag.dayOfWeek !== dayOfWeek) return;
    setDrag((d) => ({ ...d, endHour: hour }));
  }, [drag]);

  const handleMouseUp = useCallback(() => {
    if (!drag || !onAdd) {
      setDrag(null);
      return;
    }
    const minH = Math.min(drag.startHour, drag.endHour);
    const maxH = Math.max(drag.startHour, drag.endHour);
    const startTime = timeFromHour(minH);
    const endTime = timeFromHour(maxH + 1);
    if (minH !== maxH || true) {
      onAdd({ dayOfWeek: drag.dayOfWeek, startTime, endTime });
    }
    setDrag(null);
  }, [drag, onAdd]);

  const handleRemoveSlot = useCallback(async (e, slot) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onRemove || !slot?.id || deletingId) return;
    setDeletingId(slot.id);
    try {
      const result = onRemove(slot.id);
      if (result && typeof result.then === 'function') await result;
    } catch (_) {
      // let parent handle error
    } finally {
      setDeletingId(null);
    }
  }, [onRemove, deletingId]);

  useEffect(() => {
    const up = () => setDrag(null);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const isCellInDrag = (dayOfWeek, hour) => {
    if (!drag || drag.dayOfWeek !== dayOfWeek) return false;
    const lo = Math.min(drag.startHour, drag.endHour);
    const hi = Math.max(drag.startHour, drag.endHour);
    return hour >= lo && hour <= hi;
  };

  return (
    <div className="availability-grid-container">
      <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mb-3">{emptyMessage}</p>
      <div
        ref={gridRef}
        className="border border-pink-soft/50 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-pink-soft/30 dark:shadow-lg"
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDrag(null)}
      >
        <table className="w-full border-collapse select-none" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-pink-soft/20 dark:bg-white/5">
              <th className="w-12 sm:w-14 py-2 text-xs font-semibold text-text/70 dark:text-[#f5f5f5]/70 border-b border-r border-pink-soft/30 dark:border-white/10">
                —
              </th>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <th
                  key={d}
                  className="py-2 px-1 text-center text-xs font-semibold text-text dark:text-[#f5f5f5] border-b border-r border-pink-soft/30 dark:border-white/10 last:border-r-0"
                >
                  {dayLabels[d - 1] || d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour} className="group">
                <td className="py-0.5 px-2 text-[10px] sm:text-xs font-mono text-text/50 dark:text-[#f5f5f5]/50 border-b border-r border-pink-soft/20 dark:border-white/5 align-top pt-1">
                  {hour}h
                </td>
                {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
                  const slot = getSlotAt(dayOfWeek, hour);
                  const isFirstOfSlot = slot && hourFromTime(slot.startTime) === hour;
                  const inDrag = isCellInDrag(dayOfWeek, hour);

                  return (
                    <td
                      key={dayOfWeek}
                      className="relative p-0.5 border-b border-r border-pink-soft/20 dark:border-white/5 last:border-r-0 align-top"
                      onMouseDown={(e) => { e.preventDefault(); handleMouseDown(dayOfWeek, hour); }}
                      onMouseEnter={() => handleMouseEnter(dayOfWeek, hour)}
                    >
                      <div
                        className={`relative min-h-[28px] sm:min-h-[32px] rounded-md transition-all duration-200 ${
                          inDrag
                            ? 'bg-pink-400/40 dark:bg-pink-400/50 ring-1 ring-pink-400/60'
                            : slot && isFirstOfSlot
                              ? 'bg-pink-500/90 dark:bg-pink-400/90 text-white'
                              : 'bg-pink-soft/10 dark:bg-white/5 hover:bg-pink-soft/25 dark:hover:bg-white/10'
                        } ${disabled ? 'pointer-events-none opacity-70' : 'cursor-pointer'}`}
                      >
                        {slot && isFirstOfSlot && (
                          <div className="absolute inset-0 flex items-center justify-between gap-1 px-1.5 sm:px-2 rounded-md">
                            <span className="text-[10px] sm:text-xs font-medium truncate">
                              {slot.startTime.slice(0, 5)} – {slot.endTime?.slice(0, 5) || ''}
                            </span>
                            <button
                              type="button"
                              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                              onClick={(e) => handleRemoveSlot(e, slot)}
                              disabled={deletingId === slot.id}
                              className="flex-shrink-0 w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-white/20 hover:bg-red-500/90 flex items-center justify-center text-white transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none touch-manipulation"
                              title={removeLabel}
                              aria-label={removeLabel}
                            >
                              {deletingId === slot.id ? (
                                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                        {slot && !isFirstOfSlot && (
                          <div className="absolute inset-0 bg-pink-500/90 dark:bg-pink-400/90 rounded-none pointer-events-none" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
