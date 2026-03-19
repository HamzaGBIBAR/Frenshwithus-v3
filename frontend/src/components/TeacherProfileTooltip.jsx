import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatProfessorName } from '../utils/format';

/**
 * Hover tooltip showing teacher profile (avatar, name, email).
 * Rendered via portal to avoid z-index/overflow issues with parent panels.
 */
export default function TeacherProfileTooltip({ teacher, children, className = '' }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, bottom: undefined, left: 0, placement: 'bottom' });
  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!visible || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow < 180 ? 'top' : 'bottom';
    const top = placement === 'bottom' ? rect.bottom + 8 : undefined;
    const bottom = placement === 'top' ? window.innerHeight - rect.top + 8 : undefined;
    const left = rect.left + rect.width / 2;
    setCoords({ top, bottom, left, placement });
  }, [visible]);

  if (!teacher?.name) return children;

  const hasValidCoords = coords.top > 0 || (coords.bottom != null && coords.bottom > 0);
  const tooltipContent = visible && hasValidCoords && (
    <div
      className="fixed z-[9999] min-w-[200px] max-w-[260px] animate-fade-in -translate-x-1/2"
      style={{
        top: coords.top,
        bottom: coords.bottom,
        left: coords.left,
      }}
      role="tooltip"
    >
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg dark:shadow-xl border border-pink-soft/50 dark:border-white/10 overflow-hidden">
        <div className="p-4 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-pink-soft/30 dark:bg-white/10 mb-2 ring-2 ring-pink-soft/50 dark:ring-white/10">
            {teacher.avatarUrl ? (
              <img src={teacher.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-pink-primary dark:text-pink-400 text-2xl font-bold">
                {teacher.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="font-semibold text-text dark:text-[#f5f5f5] text-sm">
            {formatProfessorName(teacher.name)}
          </p>
          {teacher.email && (
            <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mt-0.5 truncate max-w-full">
              {teacher.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <span
        ref={wrapperRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </span>
      {typeof document !== 'undefined' && createPortal(tooltipContent || null, document.body)}
    </>
  );
}
