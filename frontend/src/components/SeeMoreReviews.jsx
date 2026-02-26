import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * See More Rave Reviews – expandable section with paginated/carousel reviews.
 * Matches testimonials styling, accessible, responsive, swipe-friendly.
 */
export default function SeeMoreReviews() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const extraItems = t('testimonials.extraItems', { returnObjects: true });
  const isValidItems = Array.isArray(extraItems) && extraItems.length > 0;

  const reviewsPerPage = 3;
  const totalPages = Math.ceil((isValidItems ? extraItems.length : 0) / reviewsPerPage);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
    if (!isExpanded) setCurrentPage(0);
  }, [isExpanded]);

  const goPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!isExpanded) return;
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    },
    [isExpanded, goPrev, goNext]
  );

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isValidItems) return null;

  const startIdx = currentPage * reviewsPerPage;
  const visibleReviews = extraItems.slice(startIdx, startIdx + reviewsPerPage);

  return (
    <div className="mt-8 sm:mt-10">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="see-more-reviews-panel"
        id="see-more-reviews-btn"
        className="w-full sm:w-auto px-6 py-3 sm:py-3.5 bg-white dark:bg-[#1a1a1a] border-2 border-pink-soft dark:border-white/20 text-pink-dark dark:text-pink-400 rounded-xl hover:bg-pink-soft/50 dark:hover:bg-white/10 transition-all duration-300 btn-hover text-center font-medium text-sm sm:text-base min-h-[48px] flex items-center justify-center gap-2 mx-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary dark:focus-visible:ring-pink-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111111] shadow-pink-soft dark:shadow-lg"
      >
        <span>{isExpanded ? t('testimonials.seeLess') : t('testimonials.seeMore')}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        id="see-more-reviews-panel"
        role="region"
        aria-labelledby="see-more-reviews-btn"
        aria-hidden={!isExpanded}
        className={`overflow-hidden transition-all duration-400 ease-out ${
          isExpanded ? 'max-h-[2000px] opacity-100 mt-6 sm:mt-8' : 'max-h-0 opacity-0 mt-0'
        }`}
        style={{
          transitionProperty: 'max-height, opacity, margin-top',
        }}
      >
        <div
          ref={scrollRef}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          {visibleReviews.map((item, index) => (
            <blockquote
              key={`${item.name}-${index}`}
              className="group bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-pink-soft dark:shadow-lg border border-pink-soft/50 dark:border-white/10 border-s-4 border-s-pink-primary dark:border-s-pink-400 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(231,84,128,0.2)] dark:hover:shadow-[0_12px_40px_rgba(231,84,128,0.15)] hover:scale-[1.02] animate-fade-in"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-pink-soft dark:bg-pink-400/20 flex items-center justify-center flex-shrink-0 text-pink-primary dark:text-pink-400 font-semibold text-sm">
                  {item.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1" aria-label={`${item.rating || 5} out of 5 stars`}>
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <span key={i} className="text-gold text-sm" aria-hidden>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="font-medium text-text dark:text-[#f5f5f5] text-sm">{item.name}</p>
                  {item.date && (
                    <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50">{item.date}</p>
                  )}
                  {item.role && (
                    <p className="text-xs text-text/50 dark:text-[#f5f5f5]/50">{item.role}</p>
                  )}
                </div>
              </div>
              <p className="text-text/80 dark:text-[#f5f5f5]/80 italic text-sm leading-relaxed">
                &quot;{item.quote}&quot;
              </p>
            </blockquote>
          ))}
        </div>

        {totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-4 mt-6 sm:mt-8"
            aria-label={t('testimonials.paginationLabel')}
          >
            <button
              type="button"
              onClick={goPrev}
              disabled={currentPage === 0}
              aria-label={t('testimonials.prevReviews')}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/20 flex items-center justify-center text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary dark:focus-visible:ring-pink-400 focus-visible:ring-offset-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-text/70 dark:text-[#f5f5f5]/70" aria-live="polite">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={currentPage >= totalPages - 1}
              aria-label={t('testimonials.nextReviews')}
              className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/20 flex items-center justify-center text-pink-primary dark:text-pink-400 hover:bg-pink-soft/50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary dark:focus-visible:ring-pink-400 focus-visible:ring-offset-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
