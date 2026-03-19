import { useState, useEffect } from 'react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import CountryPhoneInput from '../components/CountryPhoneInput';
import COUNTRIES from '../utils/countries';

const PACK_IDS = ['individuel', 'groups', 'preparation'];

function BenefitIcon({ type }) {
  const className = 'w-5 h-5 text-pink-primary dark:text-pink-400 shrink-0';
  if (type === 'sparkle')
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    );
  if (type === 'calendar')
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  if (type === 'search')
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    );
  if (type === 'heart')
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  return null;
}

export default function Reservation() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const packParam = searchParams.get('pack') || '';
  const audienceParam = searchParams.get('audience') || '';
  const audience = audienceParam === 'adults' || audienceParam === 'children' ? audienceParam : null;

  if (!audience) return <Navigate to="/reservation" replace />;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountry: 'MA',
    phoneNumber: '',
    country: '',
    age: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);

  const packId = PACK_IDS.includes(packParam) ? packParam : null;

  useEffect(() => {
    setVisible(true);
  }, []);

  const packLabel = packId
    ? t(`reservation.pack${packId.charAt(0).toUpperCase() + packId.slice(1)}`)
    : t('reservation.packNone');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/reservation', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneCountry: form.phoneCountry,
        phoneNumber: form.phoneNumber,
        country: form.country || null,
        age: form.age.trim() || null,
        pack: packId || null,
        audience,
      });
      setSuccess(true);
      setForm({ firstName: '', lastName: '', email: '', phoneCountry: 'MA', phoneNumber: '', country: '', age: '' });
    } catch (err) {
      setError(err.response?.data?.error || t('reservation.sendError'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-[#252525] text-text dark:text-[#f5f5f5] placeholder:text-text/40 dark:placeholder:text-[#f5f5f5]/40 focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:border-pink-primary dark:focus:border-pink-400 transition-all duration-200';
  const labelClass = 'block text-xs font-semibold text-white/80 dark:text-[#f5f5f5]/80 uppercase tracking-wider mb-1.5';

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          to="/reservation"
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 text-sm font-medium transition-all duration-300 mb-8 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
          style={{ transition: 'opacity 0.5s ease, transform 0.5s ease' }}
        >
          <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('reservation.back')}
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Info & benefits – appears left in LTR, right in RTL (Arabic) */}
          <div
            className={`space-y-6 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '0.1s' }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-pink-primary/20 dark:bg-pink-400/20 text-pink-primary dark:text-pink-400 text-xs font-bold tracking-wider">
              {t('reservation.badge')}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              {t(audience === 'adults' ? 'reservation.titleAdults' : 'reservation.title')}
            </h1>
            <p className="text-white/70 dark:text-[#f5f5f5]/70 text-sm sm:text-base">
              {t(audience === 'adults' ? 'reservation.introAdults' : 'reservation.intro')}
            </p>

            <div
              className="rounded-2xl border border-pink-primary/30 dark:border-pink-400/30 bg-white/5 dark:bg-black/20 p-6 space-y-4 transition-all duration-700 ease-out"
              style={{ transitionDelay: '0.2s' }}
            >
              <h2 className="font-semibold text-white dark:text-[#f5f5f5] text-sm">
                {t(audience === 'adults' ? 'reservation.benefitsTitleAdults' : 'reservation.benefitsTitle')}
              </h2>
              <ul className="space-y-3">
                {[
                  { key: audience === 'adults' ? 'benefit1Adults' : 'benefit1', icon: 'sparkle' },
                  { key: audience === 'adults' ? 'benefit2Adults' : 'benefit2', icon: 'calendar' },
                  { key: audience === 'adults' ? 'benefit3Adults' : 'benefit3', icon: 'search' },
                  { key: audience === 'adults' ? 'benefit4Adults' : 'benefit4', icon: 'heart' },
                ].map(({ key, icon }, i) => (
                  <li
                    key={key}
                    className="flex items-start gap-3 text-sm text-white/85 dark:text-[#f5f5f5]/85"
                    style={{
                      transition: 'opacity 0.5s ease, transform 0.5s ease',
                      transitionDelay: `${0.25 + i * 0.05}s`,
                    }}
                  >
                    <BenefitIcon type={icon} />
                    <span>{t(`reservation.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-white/50 dark:text-[#f5f5f5]/50 max-w-md">
              {t(audience === 'adults' ? 'reservation.disclaimerAdults' : 'reservation.disclaimer')}
            </p>
          </div>

          {/* Right column – form */}
          <div
            className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '0.2s' }}
          >
            <div className="rounded-2xl border border-pink-primary/30 dark:border-pink-400/30 bg-white/5 dark:bg-black/20 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white dark:text-[#f5f5f5] mb-1">
                {t('reservation.formTitle')}
              </h2>
              <p className="text-sm text-white/70 dark:text-[#f5f5f5]/70 mb-6">
                {t('reservation.formIntro')}
              </p>

              {success && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/20 dark:bg-green-500/20 border border-green-500/40 text-green-800 dark:text-green-200 text-sm">
                  {t('reservation.successMessage')}
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>{t('reservation.firstName')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('reservation.placeholderFirst')}
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('reservation.lastName')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('reservation.placeholderLast')}
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('reservation.email')}</label>
                  <input
                    type="email"
                    required
                    placeholder={t('reservation.placeholderEmail')}
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    {t('reservation.emailHint')}
                  </p>
                </div>
                <CountryPhoneInput
                  countryCode={form.phoneCountry}
                  onCountryChange={(code) => setForm((f) => ({ ...f, phoneCountry: code }))}
                  phoneNumber={form.phoneNumber}
                  onPhoneChange={(value) => setForm((f) => ({ ...f, phoneNumber: value }))}
                  placeholder={t('reservation.placeholderPhone')}
                  label={t('reservation.phone')}
                  labelClassName={labelClass}
                  required
                />
                <div>
                  <label className={labelClass}>{t('reservation.country')}</label>
                  <select
                    required
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">{t('reservation.placeholderCountry')}</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
<label className={labelClass}>{t(audience === 'adults' ? 'reservation.ageAdults' : 'reservation.age')}</label>
                    <input
                    type="text"
                    inputMode="numeric"
                    placeholder={t(audience === 'adults' ? 'reservation.placeholderAgeAdults' : 'reservation.placeholderAge')}
                    value={form.age}
                    onChange={(e) => setForm((f) => ({ ...f, age: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                    className={inputClass}
                  />
                </div>
                {packId && (
                  <div>
                    <label className={labelClass}>{t('reservation.pack')}</label>
                    <div className="px-4 py-3 rounded-xl bg-pink-primary/15 dark:bg-pink-400/15 border border-pink-primary/30 dark:border-pink-400/30 text-pink-primary dark:text-pink-400 font-medium text-sm">
                      {packLabel}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-6 py-4 rounded-xl bg-pink-primary dark:bg-pink-400 hover:bg-pink-dark dark:hover:bg-pink-500 text-white font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed btn-glow"
                >
                  {submitting ? t('reservation.submitting') : t('reservation.submit')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
