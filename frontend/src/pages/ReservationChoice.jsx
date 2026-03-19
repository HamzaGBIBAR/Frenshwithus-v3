import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ReservationChoice() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const packParam = searchParams.get('pack') || '';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const toAdults = `/reservation/form?audience=adults${packParam ? `&pack=${encodeURIComponent(packParam)}` : ''}`;
  const toChildren = `/reservation/form?audience=children${packParam ? `&pack=${encodeURIComponent(packParam)}` : ''}`;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Link
          to="/"
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 text-sm font-medium transition-all duration-300 mb-8 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
          style={{ transition: 'opacity 0.5s ease, transform 0.5s ease' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('reservation.back')}
        </Link>

        <div
          className={`text-center mb-10 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '0.1s' }}
        >
          <span className="inline-block px-3 py-1 rounded-full bg-pink-primary/20 dark:bg-pink-400/20 text-pink-primary dark:text-pink-400 text-xs font-bold tracking-wider mb-4">
            {t('reservation.badge')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white dark:text-[#f5f5f5] mb-3">
            {t('reservationChoice.title')}
          </h1>
          <p className="text-white/70 dark:text-[#f5f5f5]/70 text-sm sm:text-base max-w-xl mx-auto">
            {t('reservationChoice.subtitle')}
          </p>
        </div>

        <div
          className={`grid sm:grid-cols-2 gap-6 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '0.2s' }}
        >
          <Link
            to={toAdults}
            className="group flex flex-col items-center p-8 rounded-2xl border-2 border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 hover:border-pink-primary dark:hover:border-pink-400 hover:bg-pink-primary/10 dark:hover:bg-pink-400/10 transition-all duration-300 text-center"
          >
            <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-primary/20 dark:bg-pink-400/20 text-pink-primary dark:text-pink-400 mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <h2 className="text-xl font-bold text-white dark:text-[#f5f5f5] mb-2">
              {t('reservationChoice.adults')}
            </h2>
            <p className="text-sm text-white/70 dark:text-[#f5f5f5]/70">
              {t('reservationChoice.adultsDesc')}
            </p>
          </Link>

          <Link
            to={toChildren}
            className="group flex flex-col items-center p-8 rounded-2xl border-2 border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 hover:border-pink-primary dark:hover:border-pink-400 hover:bg-pink-primary/10 dark:hover:bg-pink-400/10 transition-all duration-300 text-center"
          >
            <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-primary/20 dark:bg-pink-400/20 text-pink-primary dark:text-pink-400 mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <h2 className="text-xl font-bold text-white dark:text-[#f5f5f5] mb-2">
              {t('reservationChoice.children')}
            </h2>
            <p className="text-sm text-white/70 dark:text-[#f5f5f5]/70">
              {t('reservationChoice.childrenDesc')}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
