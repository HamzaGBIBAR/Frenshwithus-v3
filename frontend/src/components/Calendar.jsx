import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function getMonthWeeks(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const mondayOffset = startDay === 0 ? 6 : startDay - 1;
  const startDate = new Date(first);
  startDate.setDate(startDate.getDate() - mondayOffset);

  const weeks = [];
  let current = new Date(startDate);

  while (weeks.length < 6) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current.getMonth() > month && current.getDate() === 1) break;
  }

  return weeks;
}

export default function Calendar({ events = [], selectedDate, onSelectDate, viewMode = 'mois', onViewModeChange, embedded }) {
  const { t } = useTranslation();
  const days = t('calendar.days', { returnObjects: true });
  const months = t('calendar.months', { returnObjects: true });

  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const weeks = useMemo(
    () => getMonthWeeks(current.year, current.month),
    [current.year, current.month]
  );

  const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = toDateStr(new Date());
  const isCurrentMonth = (date) => date.getMonth() === current.month;

  const prevMonth = () => {
    setCurrent((c) => {
      if (c.month === 0) return { year: c.year - 1, month: 11 };
      return { year: c.year, month: c.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrent((c) => {
      if (c.month === 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: c.month + 1 };
    });
  };

  const goToToday = () => {
    const d = new Date();
    setCurrent({ year: d.getFullYear(), month: d.getMonth() });
    onSelectDate?.(today);
  };

  const getEventsForDate = (date) => {
    const ds = toDateStr(date);
    return events.filter((e) => e.date === ds);
  };

  const getEventStyle = (evt) => {
    const type = evt.type || 'course';
    if (type === 'my-availability') return 'bg-emerald-500/90 dark:bg-emerald-500/90 text-white';
    if (type === 'other-availability') return 'bg-slate-300/90 dark:bg-slate-600/90 text-slate-800 dark:text-slate-200';
    return 'bg-pink-primary/90 dark:bg-pink-400/90 text-white';
  };

  if (viewMode !== 'mois') return null;

  const wrapperClass = embedded
    ? ''
    : 'bg-white dark:bg-[#1a1a1a] rounded-2xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-colors duration-500';

  return (
    <div className={wrapperClass}>
      <div className="p-4 border-b border-pink-soft/50 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <button
            onClick={prevMonth}
            className="p-2 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 rounded-xl transition font-medium"
            aria-label="Previous month"
          >
            ←
          </button>
          <h2 className="font-semibold text-text dark:text-[#f5f5f5] min-w-[160px] text-center">
            {months[current.month]} {current.year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 rounded-xl transition font-medium"
            aria-label="Next month"
          >
            →
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-2 text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 rounded-xl transition font-medium text-sm"
            aria-label="Go to today"
          >
            {t('calendar.today')}
          </button>
        </div>
        {!embedded && onViewModeChange && (
          <div className="flex gap-2">
            <button
              onClick={() => onViewModeChange('mois')}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-primary dark:bg-pink-400 text-white"
            >
              {t('calendar.month')}
            </button>
            <button
              onClick={() => onViewModeChange('semaine')}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-soft/50 dark:bg-white/10 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/70 dark:hover:bg-white/20 transition"
            >
              {t('calendar.week')}
            </button>
            <button
              onClick={() => onViewModeChange('jour')}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-pink-soft/50 dark:bg-white/10 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/70 dark:hover:bg-white/20 transition"
            >
              {t('calendar.day')}
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
        <div className="min-w-[320px] p-4">
          {/* Desktop/Tablet: 7-column grid */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-text/70 dark:text-[#f5f5f5]/70 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weeks.flatMap((week) =>
                week.map((date) => {
                const dateKey = toDateStr(date);
                const dayEvents = getEventsForDate(date);
                const isToday = dateKey === today;
                const isSelected = selectedDate === dateKey;
                const isOtherMonth = !isCurrentMonth(date);

                return (
                  <div
                    key={dateKey}
                    onClick={() => onSelectDate?.(dateKey)}
                    className={`min-h-[110px] sm:min-h-[130px] p-3 rounded-xl border transition cursor-pointer
                      ${isOtherMonth ? 'bg-pink-soft/20 dark:bg-white/5 text-text/50 dark:text-[#f5f5f5]/50' : 'bg-white dark:bg-[#111111]'}
                      ${isToday ? 'calendar-today-cell bg-pink-primary/15 dark:bg-pink-400/20 border-pink-primary/50 dark:border-pink-400/50 font-semibold' : ''}
                      ${isSelected && !isToday ? 'ring-2 ring-pink-primary dark:ring-pink-400 bg-pink-soft/40 dark:bg-white/10' : ''}
                      ${!isToday ? (isSelected ? 'ring-2 ring-pink-primary dark:ring-pink-400 bg-pink-soft/40 dark:bg-white/10' : 'border-pink-soft/50 dark:border-white/10 hover:bg-pink-soft/40 dark:hover:bg-white/5') : ''}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-pink-primary dark:text-pink-400 text-base font-bold' : 'text-text dark:text-[#f5f5f5]'}`}>{date.getDate()}</div>
                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <div
                          key={evt.id}
                          className={`text-xs rounded-xl px-2 py-1 truncate transition ${getEventStyle(evt)}`}
                          title={`${evt.title} - ${evt.time}`}
                        >
                          <span className="font-medium">{evt.time}</span> {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-text/60 dark:text-[#f5f5f5]/60">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* Mobile: vertical stacked days */}
          <div className="md:hidden space-y-4">
            {(() => {
              const monthDates = [];
              const first = new Date(current.year, current.month, 1);
              const last = new Date(current.year, current.month + 1, 0);
              for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
                monthDates.push(new Date(d));
              }
              return monthDates.map((date) => {
                const dateKey = toDateStr(date);
                const dayEvents = getEventsForDate(date);
                const isToday = dateKey === today;
                const isSelected = selectedDate === dateKey;

                return (
                  <div
                    key={dateKey}
                    onClick={() => onSelectDate?.(dateKey)}
                    className={`p-4 rounded-2xl border transition ${
                      isToday ? 'calendar-today-cell bg-pink-primary/15 dark:bg-pink-400/20 border-pink-primary/50 dark:border-pink-400/50' : ''
                    } ${isSelected && !isToday ? 'ring-2 ring-pink-primary dark:ring-pink-400 bg-pink-soft/40 dark:bg-white/10' : ''} ${!isToday ? 'border-pink-soft/50 dark:border-white/10 bg-white dark:bg-[#111111]' : ''}`}
                  >
                    <div className={`font-medium mb-2 ${isToday ? 'text-pink-primary dark:text-pink-400 font-bold' : 'text-text dark:text-[#f5f5f5]'}`}>
                      {days[date.getDay() === 0 ? 6 : date.getDay() - 1]} {date.getDate()} {months[date.getMonth()]}
                    </div>
                    <div className="space-y-2">
                      {dayEvents.length === 0 ? (
                        <p className="text-sm text-text/40 dark:text-[#f5f5f5]/40">{t('calendar.noClasses')}</p>
                      ) : (
                        dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className={`rounded-xl px-3 py-2 text-sm ${getEventStyle(evt)}`}
                          >
                            <span className="font-medium">{evt.time}</span> {evt.title}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
