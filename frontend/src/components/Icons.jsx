/**
 * Icons.jsx — Centralized SVG icon set for FrenshWithUs admin
 * Updated to use professional lucide-react icons with interactive effects.
 * Standard stroke-width: 1.75 for a clean, modern "outlined" feel.
 */
import React from 'react';
import {
  GraduationCap,
  User,
  Zap,
  CalendarCheck,
  Video,
  Clock,
  Check,
  X,
  Plus,
  Search,
  ChevronDown,
  ArrowRight,
  Pencil,
  Trash2,
  RefreshCw,
  Info,
  AlertTriangle,
  Calendar,
  Users,
  Copy,
  ExternalLink,
  Star,
  Filter
} from 'lucide-react';

// Base icon wrapper to apply standard sizing and effects
const BaseIcon = ({ Icon, className = 'w-5 h-5', fill = 'none', strokeWidth = 1.75, ...props }) => {
  // We use transition-all duration-300 to allow smooth animations.
  // We add a subtle hover glow (drop-shadow) and scale effect by default, 
  // but we can merge this with incoming classes using standard string concatenation.
  const baseClasses = "transition-all duration-300 hover:drop-shadow-md hover:scale-110";
  const finalClassName = `${baseClasses} ${className}`.trim();

  return <Icon className={finalClassName} strokeWidth={strokeWidth} fill={fill} {...props} />;
};

export const IconTeacher = (props) => <BaseIcon Icon={GraduationCap} {...props} />;
export const IconStudent = (props) => <BaseIcon Icon={User} {...props} />;
export const IconMatch = (props) => <BaseIcon Icon={Zap} {...props} />;
export const IconCalendarCheck = (props) => <BaseIcon Icon={CalendarCheck} {...props} />;
export const IconVideo = (props) => <BaseIcon Icon={Video} {...props} />;
export const IconClock = (props) => <BaseIcon Icon={Clock} {...props} />;
export const IconCheck = (props) => <BaseIcon Icon={Check} strokeWidth={2.5} {...props} />;
export const IconX = (props) => <BaseIcon Icon={X} strokeWidth={2} {...props} />;
export const IconPlus = (props) => <BaseIcon Icon={Plus} strokeWidth={2} {...props} />;
export const IconSearch = (props) => <BaseIcon Icon={Search} {...props} />;
export const IconChevronDown = (props) => <BaseIcon Icon={ChevronDown} strokeWidth={2} {...props} />;
export const IconArrowRight = (props) => <BaseIcon Icon={ArrowRight} strokeWidth={2} {...props} />;
export const IconEdit = (props) => <BaseIcon Icon={Pencil} {...props} />;
export const IconTrash = (props) => <BaseIcon Icon={Trash2} {...props} />;
export const IconRefresh = (props) => <BaseIcon Icon={RefreshCw} {...props} />;
export const IconInfo = (props) => <BaseIcon Icon={Info} {...props} />;
export const IconWarning = (props) => <BaseIcon Icon={AlertTriangle} {...props} />;
export const IconBolt = (props) => <BaseIcon Icon={Zap} strokeWidth={2} {...props} />;
export const IconCalendar = (props) => <BaseIcon Icon={Calendar} {...props} />;
export const IconUsers = (props) => <BaseIcon Icon={Users} {...props} />;
export const IconCopy = (props) => <BaseIcon Icon={Copy} {...props} />;
export const IconExternalLink = (props) => <BaseIcon Icon={ExternalLink} {...props} />;
export const IconStar = (props) => <BaseIcon Icon={Star} fill="currentColor" strokeWidth={0} {...props} />;
export const IconFilter = (props) => <BaseIcon Icon={Filter} {...props} />;
