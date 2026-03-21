import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconVideo, IconCheck, IconX, IconBolt, IconSearch, IconFilter, IconTeacher, IconStudent, IconUsers } from '../../components/Icons';

/* ─── Constants ─────────────────────────────────────────── */
const DAYS = [1, 2, 3, 4, 5, 6, 7]; // Mon=1..Sun=7
const DEFAULT_DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

const COUNTRY_FLAGS = {
  MA: '🇲🇦', FR: '🇫🇷', US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', ES: '🇪🇸', BE: '🇧🇪',
  CA: '🇨🇦', DZ: '🇩🇿', TN: '🇹🇳', SN: '🇸🇳', CI: '🇨🇮', GN: '🇬🇳',
  IT: '🇮🇹', PT: '🇵🇹', NL: '🇳🇱', CH: '🇨🇭', SA: '🇸🇦', AE: '🇦🇪',
};

/* ─── Mini Helpers ───────────────────────────────────────── */
function slotContainsTime(start, end, t) {
  if (!start || !end) return false;
  if (start < end) return t >= start && t < end;
  return t >= start || t < end; // cross-midnight
}

function countSlotsThisWeek(slots) {
  return Array.isArray(slots) ? slots.length : 0;
}

/* ─── Avatar ─────────────────────────────────────────────── */
function Avatar({ user, size = 36, className = '' }) {
  const [err, setErr] = useState(false);
  const initial = (user?.name || '?').charAt(0).toUpperCase();
  if (user?.avatarUrl && !err) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        onError={() => setErr(true)}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ring-2 ring-white/20 shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className={`rounded-full flex items-center justify-center font-bold ring-2 ring-white/20 shrink-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30 text-pink-200 ${className}`}
    >
      {initial}
    </div>
  );
}

/* ─── Account Card (Teacher or Student) ─────────────────── */
function AccountCard({ user, type, isActive, onClick }) {
  const slots = type === 'teacher'
    ? countSlotsThisWeek(user.availability)
    : countSlotsThisWeek(user.studentAvailability || user.availability);
  const flag = user.country ? (COUNTRY_FLAGS[user.country] || '🌍') : '';
  const tz = user.timezone || '';
  const tzShort = tz.split('/')[1] || tz;

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 min-w-[90px] max-w-[110px] text-center cursor-pointer
        ${isActive
          ? type === 'teacher'
            ? 'border-indigo-400/60 bg-indigo-500/15 shadow-lg shadow-indigo-500/10'
            : 'border-emerald-400/60 bg-emerald-500/15 shadow-lg shadow-emerald-500/10'
          : 'border-white/10 bg-white/3 hover:bg-white/8 hover:border-white/20'
        }`}
      title={`${user.name}${tz ? ` — ${tz}` : ''}`}
    >
      <div className="relative">
        <Avatar user={user} size={40} />
        {slots > 0 && (
          <span className={`absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-[9px] font-bold flex items-center justify-center leading-none
            ${type === 'teacher' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}
            style={{ width: 18, height: 18 }}
          >
            {slots}
          </span>
        )}
      </div>
      <div className="w-full">
        <p className="text-[11px] font-semibold text-white/90 truncate leading-tight">{user.name}</p>
        {(flag || tzShort) && (
          <p className="text-[10px] text-white/40 mt-0.5 truncate">{flag} {tzShort}</p>
        )}
        {slots === 0 && (
          <p className="text-[9px] text-white/30 mt-0.5">Aucun créneau</p>
        )}
      </div>
    </button>
  );
}

/* ─── Match Modal ────────────────────────────────────────── */
function MatchModal({ match, profs, studs, onClose, onConfirm, dayLabels }) {
  const [selectedProf, setSelectedProf] = useState(profs[0]?.id || '');
  const [selectedStud, setSelectedStud] = useState(studs[0]?.id || '');
  const [durationMin, setDurationMin] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const prof = profs.find(p => p.id === selectedProf) || profs[0];
  const stud = studs.find(s => s.id === selectedStud) || studs[0];

  const handleConfirm = async () => {
    if (!prof || !stud) return;
    setLoading(true);
    await onConfirm({ professorId: prof.id, studentId: stud.id, dayOfWeek: match.dayOfWeek, time: match.time, durationMin });
    setLoading(false);
    onClose();
  };

  const dayLabel = dayLabels[match.dayOfWeek - 1] || `Jour ${match.dayOfWeek}`;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(244,114,182,0.3)', boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 60px rgba(244,114,182,0.1)', borderRadius: 24, width: '100%', maxWidth: 480, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(244,114,182,0.1) 100%)', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', width: 30, height: 30, borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.25)', color: '#fbbf24', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            Match Disponible
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f5f5f5' }}>Créer un cours Jitsi</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {dayLabel} à <strong style={{ color: '#fbbf24' }}>{match.time}</strong> (Heure du Maroc)
          </p>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Prof select */}
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            {prof && <Avatar user={prof} size={44} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Professeur</div>
              {profs.length > 1 ? (
                <select value={selectedProf} onChange={e => setSelectedProf(e.target.value)}
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '6px 10px', color: '#f5f5f5', fontSize: 13, width: '100%', cursor: 'pointer' }}>
                  {profs.map(p => <option key={p.id} value={p.id} style={{ background: '#1a1a2e' }}>{p.name}</option>)}
                </select>
              ) : (
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f5' }}>{prof?.name || '—'}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>+ Élève</div>
          </div>

          {/* Student select */}
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            {stud && <Avatar user={stud} size={44} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Étudiant {stud?.age ? `• ${stud.age} ans` : ''}
              </div>
              {studs.length > 1 ? (
                <select value={selectedStud} onChange={e => setSelectedStud(e.target.value)}
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '6px 10px', color: '#f5f5f5', fontSize: 13, width: '100%', cursor: 'pointer' }}>
                  {studs.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a2e' }}>{s.name}{s.age ? ` (${s.age} ans)` : ''}</option>)}
                </select>
              ) : (
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f5' }}>{stud?.name || '—'}</div>
              )}
            </div>
          </div>

          {/* Duration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Durée :</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[30, 45, 60, 90].map(d => (
                <button key={d} onClick={() => setDurationMin(d)}
                  style={{ padding: '5px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: durationMin === d ? 'rgba(244,114,182,0.3)' : 'rgba(255,255,255,0.06)', color: durationMin === d ? '#f9a8d4' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}>
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Jitsi badge */}
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M4 8h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" /></svg>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(147,197,253,0.8)', lineHeight: 1.5 }}>
              Salle <strong>Jitsi</strong> générée automatiquement — accessible depuis le tableau de bord
            </p>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={loading || !prof || !stud}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: (loading || !prof || !stud) ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(244,114,182,0.35)', transition: 'all 0.2s',
              marginTop: 4,
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'mbSpin 1s linear infinite' }} />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                Créer le cours ({durationMin} min)
              </>
            )}
            <style>{`@keyframes mbSpin { to { transform: rotate(360deg); } }`}</style>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Main Export ────────────────────────────────────────── */
export default function AvailabilityMatchBoard({
  professors = [],
  students = [],
  dayLabels = DEFAULT_DAY_LABELS,
  onCreateCourse,
}) {
  const [search, setSearch] = useState('');
  const [filterProf, setFilterProf] = useState('ALL');
  const [filterStudent, setFilterStudent] = useState('ALL');
  const [showOnlyOverlaps, setShowOnlyOverlaps] = useState(false);
  const [activeProf, setActiveProf] = useState(null);
  const [activeStudent, setActiveStudent] = useState(null);
  const [matchModal, setMatchModal] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  /* Derived filtered lists */
  const filteredProfs = useMemo(() => {
    let list = professors;
    if (filterProf !== 'ALL') list = list.filter(p => p.id === filterProf);
    if (activeProf) list = list.filter(p => p.id === activeProf);
    if (search.trim()) list = list.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [professors, filterProf, activeProf, search]);

  const filteredStudents = useMemo(() => {
    let list = students;
    if (filterStudent !== 'ALL') list = list.filter(s => s.id === filterStudent);
    if (activeStudent) list = list.filter(s => s.id === activeStudent);
    if (search.trim()) list = list.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [students, filterStudent, activeStudent, search]);

  /* Build grid: for each [day][hour] → { profs[], studs[] } */
  const grid = useMemo(() => {
    const g = {};
    DAYS.forEach(d => {
      g[d] = {};
      TIME_SLOTS.forEach(t => { g[d][t] = { profs: [], studs: [] }; });
    });

    filteredProfs.forEach(p => {
      (p.availability || []).forEach(slot => {
        const { dayOfWeek: dow, startTime: s, endTime: e } = slot;
        if (!dow || !s || !e) return;
        TIME_SLOTS.forEach(t => {
          if (slotContainsTime(s, e, t) && g[dow]?.[t]) {
            g[dow][t].profs.push(p);
          }
        });
      });
    });

    filteredStudents.forEach(st => {
      const slots = st.studentAvailability || st.availability || [];
      slots.forEach(slot => {
        const { dayOfWeek: dow, startTime: s, endTime: e } = slot;
        if (!dow || !s || !e) return;
        TIME_SLOTS.forEach(t => {
          if (slotContainsTime(s, e, t) && g[dow]?.[t]) {
            g[dow][t].studs.push(st);
          }
        });
      });
    });

    return g;
  }, [filteredProfs, filteredStudents]);

  /* Which time rows are actually used? */
  const usedRows = useMemo(() => {
    return TIME_SLOTS.filter(t => {
      return DAYS.some(d => {
        const c = grid[d]?.[t];
        if (!c) return false;
        if (showOnlyOverlaps) return c.profs.length > 0 && c.studs.length > 0;
        return c.profs.length > 0 || c.studs.length > 0;
      });
    });
  }, [grid, showOnlyOverlaps]);

  const totalMatches = useMemo(() => {
    let count = 0;
    DAYS.forEach(d => TIME_SLOTS.forEach(t => {
      const c = grid[d]?.[t];
      if (c?.profs.length > 0 && c?.studs.length > 0) count++;
    }));
    return count;
  }, [grid]);

  const handleCellClick = useCallback((dayOfWeek, time, profs, studs) => {
    if (!profs.length || !studs.length) return;
    setMatchModal({ dayOfWeek, time, profs, studs });
  }, []);

  const handleConfirm = useCallback(async (data) => {
    if (onCreateCourse) await onCreateCourse(data);
  }, [onCreateCourse]);

  const toggleActiveProf = (id) => {
    setActiveProf(prev => prev === id ? null : id);
    setActiveStudent(null);
  };
  const toggleActiveStudent = (id) => {
    setActiveStudent(prev => prev === id ? null : id);
    setActiveProf(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Chercher prof ou élève…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-400/40"
          />
        </div>

        {/* Prof filter */}
        <select value={filterProf} onChange={e => { setFilterProf(e.target.value); setActiveProf(null); }}
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 focus:outline-none">
          <option value="ALL" style={{ background: '#1a1a2e' }}>Tous les profs</option>
          {professors.map(p => <option key={p.id} value={p.id} style={{ background: '#1a1a2e' }}>{p.name}</option>)}
        </select>

        {/* Student filter */}
        <select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); setActiveStudent(null); }}
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 focus:outline-none">
          <option value="ALL" style={{ background: '#1a1a2e' }}>Tous les élèves</option>
          {students.map(s => <option key={s.id} value={s.id} style={{ background: '#1a1a2e' }}>{s.name}</option>)}
        </select>

        {/* Overlap toggle */}
        <button
          onClick={() => setShowOnlyOverlaps(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${showOnlyOverlaps
            ? 'bg-amber-500/25 border-amber-400/50 text-amber-300 shadow-lg shadow-amber-500/10'
            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/8'
          }`}
        >
          <IconBolt className={`w-4 h-4 ${showOnlyOverlaps ? 'text-amber-400' : 'text-white/20'}`} />
          {showOnlyOverlaps ? `${totalMatches} match${totalMatches > 1 ? 's' : ''} seulement` : 'Afficher matches uniquement'}
        </button>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-indigo-500/30 border border-indigo-400/50" />
            <span className="text-[11px] text-white/40">Prof disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-400/50" />
            <span className="text-[11px] text-white/40">Élève disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-400/60" />
            <span className="text-[11px] text-amber-300/70 font-medium">⚡ Match — cliquer</span>
          </div>
        </div>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: '#0f0f1a' }}>
        {usedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-white/30 text-center">
              {showOnlyOverlaps ? 'Aucun créneau commun trouvé avec les filtres actuels' : 'Aucune disponibilité enregistrée pour le moment'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ width: 64, padding: '10px 8px', textAlign: 'center', fontSize: 10, letterSpacing: '0.06em', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', position: 'sticky', left: 0, background: '#0f0f1a', zIndex: 20, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                    Heure
                  </th>
                  {DAYS.map((d, i) => (
                    <th key={d} style={{ padding: '10px 4px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      {dayLabels[i]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usedRows.map(time => (
                  <tr key={time} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '2px 6px', textAlign: 'center', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', position: 'sticky', left: 0, background: '#0f0f1a', zIndex: 10, borderRight: '1px solid rgba(255,255,255,0.06)', height: 50, verticalAlign: 'middle' }}>
                      {time}
                    </td>
                    {DAYS.map(d => {
                      const cell = grid[d]?.[time] || { profs: [], studs: [] };
                      const { profs: cp, studs: cs } = cell;
                      const isOverlap = cp.length > 0 && cs.length > 0;
                      const hasProf = cp.length > 0;
                      const hasStud = cs.length > 0;
                      const cellKey = `${d}-${time}`;
                      const isHov = hoveredCell === cellKey;

                      let bg = 'transparent';
                      let borderC = 'transparent';
                      let cursor = 'default';

                      if (isOverlap) {
                        bg = isHov ? 'rgba(245,158,11,0.30)' : 'rgba(245,158,11,0.18)';
                        borderC = 'rgba(245,158,11,0.60)';
                        cursor = 'pointer';
                      } else if (hasProf) {
                        bg = 'rgba(99,102,241,0.12)';
                        borderC = 'rgba(99,102,241,0.25)';
                      } else if (hasStud) {
                        bg = 'rgba(16,185,129,0.12)';
                        borderC = 'rgba(16,185,129,0.25)';
                      }

                      return (
                        <td
                          key={d}
                          style={{ padding: '3px 4px', height: 50, verticalAlign: 'middle', background: bg, border: `1px solid ${borderC}`, cursor, transition: 'background 0.15s', position: 'relative' }}
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => isOverlap && handleCellClick(d, time, cp, cs)}
                        >
                          {/* Prof avatars */}
                          {hasProf && (
                            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', marginBottom: hasStud ? 2 : 0 }}>
                              {cp.slice(0, 2).map(p => (
                                <div key={p.id} title={p.name} style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(99,102,241,0.4)', border: '1.5px solid rgba(99,102,241,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#a5b4fc', flexShrink: 0, overflow: 'hidden' }}>
                                  {p.avatarUrl ? <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.name || '?').charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {cp.length > 2 && <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#a5b4fc' }}>+{cp.length - 2}</div>}
                            </div>
                          )}
                          {/* Student avatars */}
                          {hasStud && (
                            <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                              {cs.slice(0, 2).map(s => (
                                <div key={s.id} title={s.name} style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(16,185,129,0.4)', border: '1.5px solid rgba(16,185,129,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#6ee7b7', flexShrink: 0, overflow: 'hidden' }}>
                                  {s.avatarUrl ? <img src={s.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (s.name || '?').charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {cs.length > 2 && <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#6ee7b7' }}>+{cs.length - 2}</div>}
                            </div>
                          )}
                          {/* Hover badge on overlap */}
                          {isOverlap && isHov && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                              <div style={{ background: '#f59e0b', color: '#fff', fontSize: 8, fontWeight: 800, letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 20, boxShadow: '0 2px 10px rgba(245,158,11,0.5)', textTransform: 'uppercase' }}>
                                ⚡ Créer
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
        )}
      </div>

      {/* ── Account Card Rails ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Teachers Rail */}
        <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-indigo-400/15">
            <div className="flex items-center gap-2">
              <IconTeacher className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-300">Professeurs</span>
              <span className="text-xs text-indigo-400/60 bg-indigo-400/10 px-2 py-0.5 rounded-full">{professors.length}</span>
            </div>
            {activeProf && (
              <button onClick={() => setActiveProf(null)} className="text-xs text-indigo-400/60 hover:text-indigo-300 transition">
                Réinitialiser
              </button>
            )}
          </div>
          {professors.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/30">Aucun professeur</div>
          ) : (
            <div className="flex gap-3 overflow-x-auto p-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {professors.map(p => (
                <AccountCard key={p.id} user={p} type="teacher" isActive={activeProf === p.id} onClick={() => toggleActiveProf(p.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Students Rail */}
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-400/15">
            <div className="flex items-center gap-2">
              <IconStudent className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">Élèves</span>
              <span className="text-xs text-emerald-400/60 bg-emerald-400/10 px-2 py-0.5 rounded-full">{students.length}</span>
            </div>
            {activeStudent && (
              <button onClick={() => setActiveStudent(null)} className="text-xs text-emerald-400/60 hover:text-emerald-300 transition">
                Réinitialiser
              </button>
            )}
          </div>
          {students.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/30">Aucun élève</div>
          ) : (
            <div className="flex gap-3 overflow-x-auto p-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {students.map(s => (
                <AccountCard key={s.id} user={s} type="student" isActive={activeStudent === s.id} onClick={() => toggleActiveStudent(s.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Match Modal ── */}
      {matchModal && (
        <MatchModal
          match={matchModal}
          profs={matchModal.profs}
          studs={matchModal.studs}
          dayLabels={dayLabels}
          onClose={() => setMatchModal(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
