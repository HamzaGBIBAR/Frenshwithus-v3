/**
 * Icons.jsx — Centralized SVG icon set for FrenshWithUs admin
 * All icons use currentColor so they inherit text-color from parent.
 * Standard stroke-width: 1.75 for a clean, modern "outlined" feel.
 * Usage: <IconTeacher className="w-5 h-5 text-indigo-500" />
 */

const defaultProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' };

export function IconTeacher({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      {/* Graduation cap */}
      <path d="M12 3L2 8l10 5 10-5-10-5z" />
      <path d="M2 8v6" />
      <path d="M6 10.5v5a6 6 0 0012 0v-5" />
    </svg>
  );
}

export function IconStudent({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      {/* Person with book */}
      <circle cx="12" cy="7" r="3" />
      <path d="M6 21v-2a6 6 0 0112 0v2" />
      <path d="M9 14h6M9 17h4" />
    </svg>
  );
}

export function IconMatch({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps} strokeWidth={2}>
      {/* Lightning bolt */}
      <path d="M13 2L4.09 12.96A1 1 0 005 14.5h6.5L10 22l9.09-10.96A1 1 0 0018.5 9.5H12L13 2z" />
    </svg>
  );
}

export function IconCalendarCheck({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M9 16l2 2 4-4" />
    </svg>
  );
}

export function IconVideo({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M15 10l4.55-2.07A1 1 0 0121 8.87v6.26a1 1 0 01-1.45.9L15 14" />
      <rect x="3" y="8" width="12" height="10" rx="2" />
    </svg>
  );
}

export function IconClock({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function IconCheck({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps} strokeWidth={2.5}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function IconX({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps} strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconPlus({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps} strokeWidth={2}>
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}

export function IconSearch({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M21 21l-5-5" />
    </svg>
  );
}

export function IconChevronDown({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps} strokeWidth={2}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconArrowRight({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps} strokeWidth={2}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function IconEdit({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function IconTrash({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

export function IconRefresh({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M1 4v6h6" />
      <path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  );
}

export function IconInfo({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M12 12v4" />
    </svg>
  );
}

export function IconWarning({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function IconBolt({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps} strokeWidth={2}>
      <path d="M13 2L4.09 12.96A1 1 0 005 14.5h6.5L10 22l9.09-10.96A1 1 0 0018.5 9.5H12L13 2z" />
    </svg>
  );
}

export function IconCalendar({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function IconUsers({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a5 5 0 0110 0v2" />
      <circle cx="19" cy="7" r="2" />
      <path d="M15 21v-1a3 3 0 016 0v1" />
    </svg>
  );
}

export function IconCopy({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export function IconExternalLink({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function IconStar({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps} strokeWidth={1.75} fill="currentColor" stroke="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function IconFilter({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
