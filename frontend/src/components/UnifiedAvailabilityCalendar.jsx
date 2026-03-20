import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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

  const titleContent = `${user.name}${user.timezone && user.timezone !== 'Africa/Casablanca' ? ` (Heure locale: ${user.timezone})` : ''}`;

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.2)' }}
        title={titleContent}
      />
    );
  }
  return (
    <div
      title={titleContent}
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

function MatchModal({ match, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  // Esc key to close
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!match) return null;

  const prof = match.professors[0];
  const stud = match.students[0];
  if (!prof || !stud) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm({
      professorId: prof.id,
      studentId: stud.id,
      dayOfWeek: match.dayOfWeek,
      time: match.time,
    });
    setLoading(false);
    onClose();
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      padding: 16, animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div style={{
        background: '#1a1a1a', border: '1px solid rgba(244,114,182,0.3)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(244,114,182,0.15)',
        borderRadius: 24, width: '100%', maxWidth: 420, overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative'
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, rgba(244,114,182,0.15) 0%, rgba(157,23,77,0.05) 100%)', padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', width: 28, height: 28, borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            Match Parfait
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#f5f5f5' }}>
            Créer un cours
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            À <strong>{match.time}</strong> (Heure du Maroc)
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Prof Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 12, borderRadius: 16, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Avatar user={prof} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Professeur</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#f5f5f5' }}>{prof.name}</div>
              {prof.timezone && prof.timezone !== 'Africa/Casablanca' && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Local: {prof.timezone}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '-10px 0', position: 'relative', zIndex: 10 }}>
            <div style={{ background: '#1a1a1a', padding: '4px 8px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </div>
          </div>

          {/* Student Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20, padding: 12, borderRadius: 16, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <Avatar user={stud} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                Étudiant {stud.age ? `• ${stud.age} ans` : ''}
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#f5f5f5' }}>{stud.name}</div>
              {stud.timezone && stud.timezone !== 'Africa/Casablanca' && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Local: {stud.timezone}</div>
              )}
            </div>
          </div>

          {/* Action */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              width: '100%', marginTop: 28, padding: '14px 20px', borderRadius: 14,
              background: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
              color: '#fff', fontSize: 15, fontWeight: 600, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 14px 0 rgba(244,114,182,0.39)', transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={e=> {if(!loading) {e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(244,114,182,0.5)'}}}
            onMouseOut={e=> {if(!loading) {e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 14px 0 rgba(244,114,182,0.39)'}}}
          >
            {loading ? (
              <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Valider le cours (1h)
              </>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function UnifiedAvailabilityCalendar({
  professors = [],
  students = [],
  dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  timeSlots = [],
  onOverlapClick,
  onQuickCreate,
  filterProf = 'ALL',
  filterStudent = 'ALL',
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [matchModal, setMatchModal] = useState(null);

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
        const dayKey = slot.dayOfWeek;
        const start = slot.startTime;
        const end = slot.endTime;
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
        const dayKey = slot.dayOfWeek;
        const start = slot.startTime;
        const end = slot.endTime;
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
                        if (isOverlap) {
                           setMatchModal({ dayOfWeek: d, time, professors: profs, students: studs });
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

      {/* Match Modal */}
      {matchModal && (
        <MatchModal
          match={matchModal}
          onClose={() => setMatchModal(null)}
          onConfirm={async (data) => {
            if (onQuickCreate) {
              await onQuickCreate(data);
            } else if (onOverlapClick) {
              onOverlapClick({ dayOfWeek: data.dayOfWeek, time: data.time, professors: matchModal.professors, students: matchModal.students });
            }
          }}
        />
      )}
    </div>
  );
}
