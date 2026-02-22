import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Calendar from './Calendar';
import LiveLessonDemo from './LiveLessonDemo';
import { useAuth } from '../context/AuthContext';

const TAB_IDS = ['schedule', 'live', 'upcoming', 'path'];

function TabIcon({ id, className }) {
  const icons = {
    schedule: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    live: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    upcoming: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    path: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  };
  return icons[id] || null;
}

export default function PlanningSection({ events = [], selectedDate, onSelectDate, viewMode, onViewModeChange }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'PROFESSOR') return '/professor';
    return '/student';
  };

  const upcomingEvents = events
    .filter((e) => e.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  return (
    <section className="w-full mb-20">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-pink-soft/50 dark:border-white/10 shadow-pink-soft dark:shadow-lg overflow-hidden transition-colors duration-500">
        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-pink-soft/50 dark:border-white/10 scrollbar-hide">
          <div className="flex min-w-0">
            {TAB_IDS.map((id) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-250 ${
                  activeTab === id
                    ? 'bg-pink-primary dark:bg-pink-400 text-white border-b-2 border-pink-primary dark:border-pink-400'
                    : 'text-text/70 dark:text-[#f5f5f5]/70 hover:bg-pink-soft/30 dark:hover:bg-white/5 hover:text-pink-primary dark:hover:text-pink-400'
                }`}
              >
                <TabIcon id={id} className="w-5 h-5 flex-shrink-0" />
                {t(`planning.tabs.${id}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="min-h-[320px]">
          {activeTab === 'schedule' && (
            <div className="animate-fade-in">
              <Calendar
                events={events}
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
                viewMode={viewMode || 'mois'}
                onViewModeChange={onViewModeChange}
                embedded
              />
            </div>
          )}

          {activeTab === 'live' && (
            <div className="animate-fade-in">
              <LiveLessonDemo />
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className="p-6 lg:p-8 animate-fade-in">
              <h3 className="text-lg font-semibold text-text dark:text-[#f5f5f5] mb-4">
                {t('planning.upcomingTitle')}
              </h3>
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-pink-soft/50 dark:bg-white/10 flex items-center justify-center mb-4">
                    <TabIcon id="upcoming" className="w-8 h-8 text-pink-primary dark:text-pink-400" />
                  </div>
                  <p className="text-text/60 dark:text-[#f5f5f5]/60 text-sm mb-6 max-w-sm">
                    {t('planning.upcomingEmpty')}
                  </p>
                  <Link
                    to={getDashboardLink()}
                    className="px-5 py-2.5 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition-all duration-250 btn-glow btn-hover font-medium text-sm"
                  >
                    {user ? t('nav.dashboard') : t('pricing.freeSession')}
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {upcomingEvents.map((evt) => (
                    <li
                      key={evt.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-pink-soft/30 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10 hover:bg-pink-soft/50 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-pink-primary/15 dark:bg-pink-400/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-pink-primary dark:text-pink-400 font-semibold text-sm">
                          {evt.date.slice(8, 10)}/{evt.date.slice(5, 7)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text dark:text-[#f5f5f5]">{evt.title}</p>
                        <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">{evt.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'path' && (
            <div className="p-6 lg:p-8 animate-fade-in">
              <h3 className="text-lg font-semibold text-text dark:text-[#f5f5f5] mb-2">
                {t('planning.pathTitle')}
              </h3>
              <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mb-8">
                {t('planning.pathDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 p-6 rounded-2xl bg-pink-soft/30 dark:bg-white/5 border border-pink-soft/50 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-primary/20 dark:bg-pink-400/20 flex items-center justify-center">
                      <span className="text-pink-primary dark:text-pink-400 font-bold">A1</span>
                    </div>
                    <span className="font-medium text-text dark:text-[#f5f5f5]">Débutant</span>
                  </div>
                  <div className="h-2 rounded-full bg-pink-soft/50 dark:bg-white/10 overflow-hidden">
                    <div className="h-full w-full rounded-full bg-pink-primary/40 dark:bg-pink-400/40" />
                  </div>
                </div>
                <div className="flex-1 p-6 rounded-2xl bg-pink-soft/20 dark:bg-white/5 border border-pink-soft/30 dark:border-white/5 opacity-75">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-soft/50 dark:bg-white/10 flex items-center justify-center">
                      <span className="text-text/50 dark:text-[#f5f5f5]/50 font-bold">A2</span>
                    </div>
                    <span className="font-medium text-text/60 dark:text-[#f5f5f5]/60">Élémentaire</span>
                  </div>
                  <div className="h-2 rounded-full bg-pink-soft/30 dark:bg-white/5 overflow-hidden">
                    <div className="h-full w-0 rounded-full bg-pink-primary/30" />
                  </div>
                </div>
                <div className="flex-1 p-6 rounded-2xl bg-pink-soft/20 dark:bg-white/5 border border-pink-soft/30 dark:border-white/5 opacity-60">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-soft/30 dark:bg-white/5 flex items-center justify-center">
                      <span className="text-text/40 dark:text-[#f5f5f5]/40 font-bold">B1</span>
                    </div>
                    <span className="font-medium text-text/50 dark:text-[#f5f5f5]/50">Intermédiaire</span>
                  </div>
                  <div className="h-2 rounded-full bg-pink-soft/20 dark:bg-white/5" />
                </div>
              </div>
              <Link
                to={getDashboardLink()}
                className="inline-flex items-center gap-2 mt-6 text-pink-primary dark:text-pink-400 font-medium text-sm hover:underline"
              >
                {t('approach.french.link')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
