import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import AnimatedEye from './AnimatedEye';

export default function Sidebar({ items, open = false, onClose, onProfileClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose?.();
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          w-[min(85vw,20rem)] md:w-56 lg:w-60
          min-h-screen
          bg-white dark:bg-[#1a1a1a] border-r border-pink-soft/50 dark:border-white/10
          flex flex-col shadow-pink-soft dark:shadow-lg transition-colors duration-500
          transform md:transform-none transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 md:p-5 border-b border-pink-soft/50 dark:border-white/10">
          <Link to="/" className="flex items-baseline gap-1 font-semibold text-text dark:text-[#f5f5f5] text-base hover:opacity-90 transition-opacity" dir="ltr">
            <span className="font-bold">French</span>
            <span className="font-light text-text/60 dark:text-[#f5f5f5]/70 lowercase">with</span>
            <AnimatedEye variant="navbar" className="ml-0.5" />
          </Link>
          <p
            className={`text-xs md:text-sm text-text/60 dark:text-[#f5f5f5]/80 mt-1 truncate ${onProfileClick && user?.role === 'PROFESSOR' ? 'cursor-pointer hover:text-pink-primary dark:hover:text-pink-400 transition' : ''}`}
            onClick={onProfileClick && user?.role === 'PROFESSOR' ? () => { onProfileClick(); onClose?.(); } : undefined}
            role={onProfileClick && user?.role === 'PROFESSOR' ? 'button' : undefined}
          >
            {user?.name}
          </p>
        </div>
        <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
          {items.map((item) =>
            item.action === 'profile' && onProfileClick ? (
              <button
                key="profile"
                type="button"
                onClick={() => { onProfileClick(); onClose?.(); }}
                className="block w-full text-left px-3 md:px-4 py-2.5 md:py-2.5 rounded-xl transition-all duration-200 text-sm md:text-base text-text/70 dark:text-[#f5f5f5]/70 hover:bg-pink-soft/40 dark:hover:bg-white/5 hover:text-text dark:hover:text-[#f5f5f5]"
              >
                {item.label}
              </button>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `block px-3 md:px-4 py-2.5 md:py-2.5 rounded-xl transition-all duration-200 text-sm md:text-base ${
                    isActive
                      ? 'bg-pink-soft/80 dark:bg-white/10 text-pink-dark dark:text-pink-400 font-medium border-l-4 border-pink-primary dark:border-pink-400'
                      : 'text-text/70 dark:text-[#f5f5f5]/70 hover:bg-pink-soft/40 dark:hover:bg-white/5 hover:text-text dark:hover:text-[#f5f5f5]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="p-3 md:p-4 border-t border-pink-soft/50 dark:border-white/10 space-y-2">
          <LanguageSwitcher className="w-full justify-center" />
          <ThemeToggle className="w-full justify-center" />
          <button
            onClick={handleLogout}
            className="w-full px-3 md:px-4 py-2.5 text-left rounded-xl hover:bg-pink-soft/40 dark:hover:bg-white/5 text-text/70 dark:text-[#f5f5f5]/70 hover:text-pink-dark dark:hover:text-pink-400 transition text-sm md:text-base"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
