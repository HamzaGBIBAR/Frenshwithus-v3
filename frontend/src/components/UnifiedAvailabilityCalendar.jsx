import React, { useMemo, useState } from 'react';

const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7]; // Mon=1..Sun=7

const PROF_PALETTE = [
  { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', dot: '#6366f1', label: '#a5b4fc' },
  { bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.4)', dot: '#ec4899', label: '#f9a8d4' },
  { bg: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.4)', dot: '#0ea5e9', label: '#7dd3fc' },
  { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)', dot: '#a855f7', label: '#d8b4fe' },
  { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.4)', dot: '#14b8a6', label: '#5eead4' },
];

function Avatar({ user, size = 22 }) {
  const initials = (user.name || '?').charAt(0).toUpperCase();
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.2)' }}
        title={user.name}
      />
    );
  }
  return (
    <div
      title={user.name}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(244,114,182,0.25)',
        border: '1.5px solid rgba(244,114,182,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#f9a8d4',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function AvatarStack({ users, limit = 2 }) {
  if (!users || users.length === 0) return null;
  const visible = users.slice(0, limit);
  const extra = users.length - limit;
  return (
    <div style={{ display: 'flex', marginLeft: 2 }}>
      {visible.map((u, i) => (
        <div key={u.id} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 10 - i }}>
          <Avatar user={u} size={20} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -6,
          width: 20, height: 20, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700,
          zIndex: 1,
        }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

export default function UnifiedAvailabilityCalendar({
  professors = [],
  students = [],
  dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  timeSlots = [],
  onOverlapClick,
  filterProf = 'ALL',
  filterStudent = 'ALL',
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const profColorMap = useMemo(() => {
    const map = {};
    professors.forEach((p, i) => { map[p.id] = PROF_PALETTE[i % PROF_PALETTE.length]; });
    return map;
  }, [professors]);

  const grid = useMemo(() => {
    const g = {};
    DAY_NUMBERS.forEach((d) => {
      g[d] = {};
      timeSlots.forEach((t) => { g[d][t] = { profs: [], studs: [] }; });
    });

    const activeProfs = filterProf === 'ALL' ? professors : professors.filter(p => p.id === filterProf);
    const activeStudents = filterStudent === 'ALL' ? students : students.filter(s => s.id === filterStudent);

    activeProfs.forEach((p) => {
      // professors use `availability` key
      (p.availability || []).forEach((slot) => {
        const dayKey = slot.refDayOfWeek || slot.dayOfWeek;
        const start = slot.refStartTime || slot.startTime;
        const end = slot.refEndTime || slot.endTime;
        if (!dayKey || !start || !end) return;
        timeSlots.forEach(tStr => {
          if (tStr >= start && tStr < end) {
            if (g[dayKey]?.[tStr]) g[dayKey][tStr].profs.push(p);
          }
        });
      });
    });

    activeStudents.forEach((s) => {
      // students use `studentAvailability` key
      const slots = s.studentAvailability || s.availability || [];
      slots.forEach((slot) => {
        const dayKey = slot.refDayOfWeek || slot.dayOfWeek;
        const start = slot.refStartTime || slot.startTime;
        const end = slot.refEndTime || slot.endTime;
        if (!dayKey || !start || !end) return;
        timeSlots.forEach(tStr => {
          if (tStr >= start && tStr < end) {
            if (g[dayKey]?.[tStr]) g[dayKey][tStr].studs.push(s);
          }
        });
      });
    });

    return g;
  }, [professors, students, timeSlots, filterProf, filterStudent]);

  // Compute legend counts
  const totalOverlaps = useMemo(() => {
    let count = 0;
    DAY_NUMBERS.forEach(d => {
      timeSlots.forEach(t => {
        const cell = grid[d]?.[t];
        if (cell?.profs.length > 0 && cell?.studs.length > 0) count++;
      });
    });
    return count;
  }, [grid, timeSlots]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Legend Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', paddingBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(99,102,241,0.2)', border: '1.5px solid rgba(99,102,241,0.5)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Professeur disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16,185,129,0.2)', border: '1.5px solid rgba(16,185,129,0.5)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Élève disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.25)', border: '1.5px solid rgba(245,158,11,0.7)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Créneau commun (cliquer pour créer)</span>
        </div>
        {totalOverlaps > 0 && (
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#fbbf24', fontWeight: 600, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '2px 10px' }}>
            {totalOverlaps} créneau{totalOverlaps > 1 ? 'x' : ''} en commun
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: '#111' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{
                position: 'sticky', left: 0, zIndex: 20,
                background: '#111', borderBottom: '1px solid rgba(255,255,255,0.08)',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                width: 64, padding: '10px 8px',
                fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
                textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                TIME
              </th>
              {DAY_NUMBERS.map((d, i) => (
                <th key={d} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  padding: '10px 4px',
                  fontSize: 12, fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  textAlign: 'center',
                }}>
                  {dayLabels[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time, rowIdx) => (
              <tr key={time} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{
                  position: 'sticky', left: 0, zIndex: 10,
                  background: '#111',
                  borderRight: '1px solid rgba(255,255,255,0.08)',
                  padding: '2px 6px',
                  textAlign: 'center',
                  fontSize: 10, fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.3)',
                  height: 52,
                  verticalAlign: 'middle',
                }}>
                  {time}
                </td>
                {DAY_NUMBERS.map((d) => {
                  const cell = grid[d]?.[time] || { profs: [], studs: [] };
                  const profs = cell.profs;
                  const studs = cell.studs;
                  const isOverlap = profs.length > 0 && studs.length > 0;
                  const hasProf = profs.length > 0;
                  const hasStud = studs.length > 0;
                  const cellKey = `${d}-${time}`;
                  const isHovered = hoveredCell === cellKey;

                  let bg = 'transparent';
                  let border = '1px solid transparent';
                  let cursor = 'default';

                  if (isOverlap) {
                    bg = isHovered
                      ? 'rgba(245,158,11,0.3)'
                      : 'rgba(245,158,11,0.15)';
                    border = '1px solid rgba(245,158,11,0.5)';
                    cursor = 'pointer';
                  } else if (hasProf) {
                    bg = 'rgba(99,102,241,0.1)';
                    border = '1px solid rgba(99,102,241,0.25)';
                  } else if (hasStud) {
                    bg = 'rgba(16,185,129,0.1)';
                    border = '1px solid rgba(16,185,129,0.25)';
                  }

                  return (
                    <td
                      key={d}
                      style={{
                        padding: '3px 4px',
                        height: 52,
                        verticalAlign: 'top',
                        background: bg,
                        border: border,
                        cursor,
                        transition: 'background 0.15s ease, box-shadow 0.15s ease',
                        boxShadow: isOverlap && isHovered ? 'inset 0 0 0 1px rgba(245,158,11,0.4)' : 'none',
                        position: 'relative',
                      }}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        if (isOverlap && onOverlapClick) {
                          onOverlapClick({ dayOfWeek: d, time, professors: profs, students: studs });
                        }
                      }}
                    >
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        {/* Professors at top */}
                        {hasProf && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 4px rgba(99,102,241,0.8)', flexShrink: 0 }} />
                            <AvatarStack users={profs} limit={2} />
                          </div>
                        )}
                        {/* Students at bottom */}
                        {hasStud && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                            <AvatarStack users={studs} limit={2} />
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 4px rgba(16,185,129,0.8)', flexShrink: 0 }} />
                          </div>
                        )}
                      </div>
                      {/* Overlap badge */}
                      {isOverlap && isHovered && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          pointerEvents: 'none',
                        }}>
                          <div style={{
                            background: '#f59e0b',
                            color: '#fff',
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            padding: '2px 6px',
                            borderRadius: 20,
                            boxShadow: '0 2px 8px rgba(245,158,11,0.5)',
                            textTransform: 'uppercase',
                          }}>
                            Créer cours
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {timeSlots.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          Aucun créneau disponible. Les professeurs et élèves doivent d'abord saisir leurs disponibilités.
        </div>
      )}
    </div>
  );
}
