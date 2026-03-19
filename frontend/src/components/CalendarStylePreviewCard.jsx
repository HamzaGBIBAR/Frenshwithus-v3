/**
 * Mini preview of a calendar card style for the Apparence selector.
 * Shows upcoming (pink) and completed (gray) variants.
 */
export default function CalendarStylePreviewCard({ styleId }) {
  const base = 'rounded-lg p-2 text-[10px] transition-all duration-200';
  const previewUpcoming = getPreviewClass(styleId, 'upcoming', base);
  const previewCompleted = getPreviewClass(styleId, 'completed', base);

  const dotUpcoming = ['gradient', 'status'].includes(styleId) ? 'bg-white/90' : 'bg-pink-primary/80 dark:bg-pink-400/80';
  const dotCompleted = ['gradient', 'status', 'default'].includes(styleId) ? 'bg-white/70' : 'bg-slate-500/70';

  return (
    <div className="space-y-1.5">
      <div className={`${previewUpcoming} flex items-center gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotUpcoming}`} />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">Cours de français</p>
          <p className="opacity-85 text-[9px]">10:00 - 1 élève</p>
        </div>
      </div>
      <div className={`${previewCompleted} flex items-center gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCompleted}`} />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate opacity-90">Session terminée</p>
          <p className="opacity-70 text-[9px]">09:00 - 1 élève</p>
        </div>
      </div>
    </div>
  );
}

function getPreviewClass(styleId, status, base) {
  const upcoming = status === 'upcoming';
  const completed = status === 'completed';

  switch (styleId) {
    case 'gradient':
      return upcoming
        ? `${base} bg-gradient-to-r from-pink-400 to-pink-600 text-white`
        : `${base} bg-gradient-to-r from-slate-500 to-slate-600 text-white`;
    case 'status':
      return upcoming
        ? `${base} bg-pink-primary/95 text-white`
        : `${base} bg-slate-500/90 text-white`;
    case 'compact':
      return upcoming
        ? `${base} bg-pink-soft/60 dark:bg-pink-500/25 border-l-4 border-pink-primary text-pink-dark dark:text-pink-200`
        : `${base} bg-slate-100/90 dark:bg-slate-800/60 border-l-4 border-slate-500 text-slate-700 dark:text-slate-300`;
    case 'minimal':
      return upcoming
        ? `${base} bg-pink-soft/70 dark:bg-pink-500/20 border border-pink-200 dark:border-pink-500/40 text-pink-dark dark:text-pink-200`
        : `${base} bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300`;
    case 'border':
      return upcoming
        ? `${base} bg-white/90 dark:bg-pink-500/10 border-2 border-pink-primary text-pink-dark dark:text-pink-300`
        : `${base} bg-white/80 dark:bg-slate-800/50 border-2 border-slate-400 text-slate-700 dark:text-slate-300`;
    default:
      return upcoming
        ? `${base} bg-gradient-to-r from-pink-soft/60 to-pink-soft/30 dark:from-white/10 dark:to-transparent border border-pink-soft/60 dark:border-white/20 text-pink-dark dark:text-pink-200`
        : `${base} bg-slate-500/85 dark:bg-slate-600/90 text-white border border-slate-400/30`;
  }
}
