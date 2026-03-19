import { useMemo } from 'react';

function getEventStyleByCardStyle(evt, style, base) {
  const isPast = evt.isPast;
  const past = isPast;
  const upcoming = !isPast;

  switch (style) {
    case 'gradient':
      return past
        ? `bg-gradient-to-r from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-700 text-white ${base}`
        : `bg-gradient-to-r from-pink-400 to-pink-600 dark:from-pink-500 dark:to-pink-600 text-white ${base}`;
    case 'status':
      return past
        ? `bg-slate-500/90 dark:bg-slate-600/90 text-white border border-slate-400/30 ${base}`
        : `bg-pink-primary/90 dark:bg-pink-400/90 text-white border border-pink-300/30 ${base}`;
    case 'compact':
      return past
        ? `bg-slate-100/50 dark:bg-slate-800/30 border-l-4 border-slate-500 pl-2 py-1 text-slate-700 dark:text-slate-300 ${base}`
        : `bg-pink-soft/40 dark:bg-pink-500/15 border-l-4 border-pink-primary dark:border-pink-400 pl-2 py-1 text-pink-dark dark:text-pink-300 ${base}`;
    case 'minimal':
      return past
        ? `bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 ${base}`
        : `bg-pink-soft/60 dark:bg-pink-500/20 text-pink-dark dark:text-pink-200 border border-pink-200 dark:border-pink-500/40 ${base}`;
    case 'border':
      return past
        ? `bg-white/50 dark:bg-slate-800/30 border-2 border-slate-400 dark:border-slate-500 text-slate-700 dark:text-slate-300 ${base}`
        : `bg-white/50 dark:bg-pink-500/10 border-2 border-pink-primary dark:border-pink-400 text-pink-dark dark:text-pink-300 ${base}`;
    default:
      return past
        ? `bg-slate-500/80 dark:bg-slate-600/90 text-white border border-slate-400/30 ${base}`
        : `bg-pink-primary/90 dark:bg-pink-400/90 text-white border border-pink-300/30 ${base}`;
  }
}

function getWeekDates(weekStartStr) {
  const [y, m, d] = weekStartStr.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function StudentWeekView({ events, weekStart, onWeekChange, onSelectEvent, calendarStyle, dayNames, t }) {
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const today = toDateStr(new Date());

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const d of weekDates) {
      map[toDateStr(d)] = [];
    }
    for (const evt of events || []) {
      const ds = evt.date;
      if (map[ds]) map[ds].push(evt);
    }
    for (const ds of Object.keys(map)) {
      map[ds].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    }
    return map;
  }, [events, weekDates]);

  const prevWeek = () => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    onWeekChange(toDateStr(d));
  };

  const nextWeek = () => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    onWeekChange(toDateStr(d));
  };

  const goToCurrentWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    onWeekChange(toDateStr(d));
  };

  const weekLabel = `${weekDates[0].getDate()} ${t('calendar.months', { returnObjects: true })[weekDates[0].getMonth()]} – ${weekDates[6].getDate()} ${t('calendar.months', { returnObjects: true })[weekDates[6].getMonth()]} ${weekDates[0].getFullYear()}`;

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-2 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 rounded-xl transition font-medium"
            aria-label="Previous week"
          >
            ←
          </button>
          <h3 className="font-semibold text-text dark:text-[#f5f5f5] min-w-[200px] text-center">
            {weekLabel}
          </h3>
          <button
            onClick={nextWeek}
            className="p-2 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 rounded-xl transition font-medium"
            aria-label="Next week"
          >
            →
          </button>
        </div>
        <button
          onClick={goToCurrentWeek}
          className="px-3 py-2 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 rounded-xl transition font-medium text-sm"
        >
          {t('calendar.today')}
        </button>
      </div>

      <div className="space-y-4">
        {weekDates.map((date, i) => {
          const ds = toDateStr(date);
          const dayEvts = eventsByDate[ds] || [];
          const isToday = ds === today;
          const dayName = dayNames[i] || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i];

          return (
            <div
              key={ds}
              className={`rounded-xl border overflow-hidden transition-all ${
                isToday
                  ? 'ring-2 ring-pink-primary dark:ring-pink-400 border-pink-primary/40 dark:border-pink-400/40'
                  : 'border-pink-soft/50 dark:border-white/10'
              }`}
            >
              <div className="px-4 py-2 bg-pink-soft/30 dark:bg-white/5 border-b border-pink-soft/50 dark:border-white/10 flex items-center justify-between">
                <span className="font-medium text-text dark:text-[#f5f5f5]">
                  {dayName} {date.getDate()} {t('calendar.months', { returnObjects: true })[date.getMonth()]}
                </span>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-lg bg-pink-primary/20 dark:bg-pink-400/20 text-pink-primary dark:text-pink-400 text-xs font-medium">
                    {t('calendar.today')}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2 min-h-[60px]">
                {dayEvts.length === 0 ? (
                  <p className="text-sm text-text/40 dark:text-[#f5f5f5]/40 py-2">{t('calendar.noClasses')}</p>
                ) : (
                  dayEvts.map((evt) => {
                    const styleClass = getEventStyleByCardStyle(evt, calendarStyle, 'rounded-lg px-3 py-2 text-sm cursor-pointer hover:opacity-95 transition');
                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => onSelectEvent?.(evt)}
                        className={`w-full text-start ${styleClass}`}
                      >
                        <span className="font-medium block truncate">{evt.title}</span>
                        <span className="text-xs opacity-90">{evt.time}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
