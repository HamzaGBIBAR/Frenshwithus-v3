import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getCalendarStyle } from '../utils/calendarStyles';

const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7]; // Mon=1..Sun=7

const bgColors = [
  'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
  'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30',
];

export default function UnifiedAvailabilityCalendar({
  professors = [],
  students = [],
  dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  timeSlots = [],
  onOverlapClick,
  filterProf = 'ALL',
  filterStudent = 'ALL',
}) {
  const { t } = useTranslation();

  // Create lookup for colors
  const profColors = useMemo(() => {
    const map = {};
    professors.forEach((p, i) => {
      map[p.id] = bgColors[i % bgColors.length];
    });
    return map;
  }, [professors]);

  // Pre-calculate grid
  // grid[dayOfWeek][time] = { profs: [], students: [] }
  const grid = useMemo(() => {
    const g = {};
    DAY_NUMBERS.forEach((d) => {
      g[d] = {};
      timeSlots.forEach((t) => {
        g[d][t] = { profs: [], students: [] };
      });
    });

    const activeProfs = filterProf === 'ALL' ? professors : professors.filter(p => p.id === filterProf);
    const activeStudents = filterStudent === 'ALL' ? students : students.filter(s => s.id === filterStudent);

    activeProfs.forEach((p) => {
      p.availability?.forEach((slot) => {
        if (slot.refDayOfWeek && slot.refStartTime && slot.refEndTime) {
          // Simplification: we mark all timeSlots between startTime and endTime
          timeSlots.forEach(tStr => {
            if (tStr >= slot.refStartTime && tStr < slot.refEndTime) {
              if (g[slot.refDayOfWeek] && g[slot.refDayOfWeek][tStr]) {
                 g[slot.refDayOfWeek][tStr].profs.push(p);
              }
            }
          });
        }
      });
    });

    activeStudents.forEach((s) => {
      s.availability?.forEach((slot) => {
        if (slot.refDayOfWeek && slot.refStartTime && slot.refEndTime) {
          timeSlots.forEach(tStr => {
            if (tStr >= slot.refStartTime && tStr < slot.refEndTime) {
              if (g[slot.refDayOfWeek] && g[slot.refDayOfWeek][tStr]) {
                 g[slot.refDayOfWeek][tStr].students.push(s);
              }
            }
          });
        }
      });
    });

    return g;
  }, [professors, students, timeSlots, filterProf, filterStudent]);


  // Helper component to render avatars
  const AvatarStack = ({ users, limit = 2 }) => {
    if (!users || users.length === 0) return null;
    const visible = users.slice(0, limit);
    const extra = users.length - limit;
    return (
      <div className="flex -space-x-2">
        {visible.map((u, i) => (
          <div key={u.id} className="w-6 h-6 rounded-full border border-white dark:border-gray-800 bg-gray-200 overflow-hidden shrink-0 z-10" style={{ zIndex: 10 - i }} title={u.name}>
            {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">{u.name.charAt(0).toUpperCase()}</div>}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-6 h-6 rounded-full border border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium z-0" title={`+${extra} plus`}>
            +{extra}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto w-full smooth-scrollbar border border-pink-soft/30 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a1a]">
      <table className="w-full text-sm border-collapse table-fixed min-w-[800px]">
        <thead>
          <tr className="bg-pink-soft/10 dark:bg-white/5">
            <th className="sticky left-0 z-20 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur border-b border-r border-pink-soft/30 dark:border-white/10 w-20 px-2 py-3 text-xs font-semibold text-text/60 dark:text-[#f5f5f5]/60 uppercase tracking-wider text-center">
              Time
            </th>
            {DAY_NUMBERS.map((d, i) => (
              <th key={d} className="border-b border-pink-soft/30 dark:border-white/10 px-2 py-3 text-center w-[14.28%]">
                <div className="font-semibold text-text dark:text-[#f5f5f5]">{dayLabels[i]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time) => (
            <tr key={time} className="group border-b border-pink-soft/10 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <td className="sticky left-0 z-10 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur border-r border-pink-soft/30 dark:border-white/10 px-2 py-4 text-xs font-mono text-text/50 dark:text-[#f5f5f5]/50 text-center">
                {time}
              </td>
              {DAY_NUMBERS.map((d) => {
                const cell = grid[d][time];
                const profs = cell.profs;
                const studs = cell.students;
                const isOverlap = profs.length > 0 && studs.length > 0;
                
                let cellClasses = "p-1.5 h-[72px] align-top transition-all duration-300 relative ";
                
                if (isOverlap) {
                   cellClasses += "bg-amber-100/50 dark:bg-amber-500/20 hover:bg-amber-200/50 dark:hover:bg-amber-500/30 cursor-pointer border border-amber-300 dark:border-amber-500/50 shadow-inner";
                } else if (profs.length > 0) {
                   cellClasses += "bg-blue-50/50 dark:bg-blue-500/10 hover:bg-blue-100/50 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30";
                } else if (studs.length > 0) {
                   cellClasses += "bg-emerald-50/50 dark:bg-emerald-500/10 hover:bg-emerald-100/50 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30";
                } else {
                   cellClasses += "border border-transparent";
                }

                return (
                  <td 
                    key={d} 
                    className={cellClasses}
                    onClick={() => {
                       if (isOverlap && onOverlapClick) {
                          onOverlapClick({
                             dayOfWeek: d,
                             time,
                             professors: profs,
                             students: studs
                          });
                       }
                    }}
                  >
                     <div className="w-full h-full flex flex-col justify-between">
                        {/* Top: Professors (Blue/Purple side) */}
                        <div className="flex justify-start min-h-[24px]">
                           {profs.length > 0 && (
                             <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
                                <AvatarStack users={profs} limit={2} />
                             </div>
                           )}
                        </div>

                        {/* Bottom: Students (Green side) */}
                        <div className="flex justify-end min-h-[24px]">
                           {studs.length > 0 && (
                             <div className="flex items-center gap-1">
                                <AvatarStack users={studs} limit={2} />
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
                             </div>
                           )}
                        </div>
                        
                        {/* Overlap Indicator */}
                        {isOverlap && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                MATCH
                             </div>
                          </div>
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
  );
}
