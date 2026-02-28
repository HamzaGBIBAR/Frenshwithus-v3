import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ThemeToggle from './ThemeToggle';
import { useToast } from './Toast';
import { CALENDAR_STYLES, getCalendarStyle, setCalendarStyle } from '../utils/calendarStyles';

const TABS = ['personal', 'appearance', 'password'];

function formatMemberSince(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const PASSWORD_RULES = [
  { key: 'length', test: (p) => p.length >= 8 },
  { key: 'uppercase', test: (p) => /[A-Z]/.test(p) },
  { key: 'lowercase', test: (p) => /[a-z]/.test(p) },
  { key: 'number', test: (p) => /[0-9]/.test(p) },
  { key: 'special', test: (p) => /[!@#$%^&*]/.test(p) },
  { key: 'different', test: (p, current) => !current || p !== current },
];

function getPasswordRuleResults(newPassword, currentPassword) {
  return PASSWORD_RULES.map((r) => ({
    ...r,
    met: r.key === 'different' ? r.test(newPassword, currentPassword) : r.test(newPassword),
  }));
}

function resizeImageToDataUrl(file, maxSize = 200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Invalid image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function ProfessorProfileModal({ professorId = null, onClose }) {
  const { t } = useTranslation();
  const { user: authUser, refreshUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [form, setForm] = useState({ name: '', email: '', avatarUrl: null });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [calendarStyle, setCalendarStyleState] = useState(getCalendarStyle);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handler = () => setCalendarStyleState(getCalendarStyle());
    window.addEventListener('calendarStyleChanged', handler);
    return () => window.removeEventListener('calendarStyleChanged', handler);
  }, []);

  const isOwnProfile = !professorId;
  const isAdminView = !!professorId;

  useEffect(() => {
    if (isOwnProfile && authUser) {
      api
        .get('/professor/profile')
        .then((r) => {
          setProfile(r.data);
          setForm({ name: r.data.name, email: r.data.email, avatarUrl: r.data.avatarUrl });
        })
        .catch(() => toast(t('profile.errorLoad')))
        .finally(() => setLoading(false));
      return;
    }
    if (professorId) {
      api
        .get(`/admin/professors/${professorId}`)
        .then((r) => {
          setProfile(r.data);
          setForm({ name: r.data.name, email: r.data.email, avatarUrl: r.data.avatarUrl });
        })
        .catch(() => toast(t('profile.errorLoad')))
        .finally(() => setLoading(false));
    }
  }, [professorId, authUser, isOwnProfile, t, toast]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    setSaving(true);
    try {
      const r = await api.put('/professor/profile', { name: form.name, avatarUrl: form.avatarUrl || null });
      setProfile(r.data);
      refreshUser?.();
      toast(t('profile.saved'));
    } catch (err) {
      toast(err.response?.data?.error || t('profile.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const saveAvatar = async (avatarUrl) => {
    if (!isOwnProfile) return;
    try {
      const r = await api.put('/professor/profile', { avatarUrl });
      setProfile(r.data);
      setForm((f) => ({ ...f, avatarUrl: r.data.avatarUrl }));
      refreshUser?.();
      toast(t('profile.saved'));
    } catch {
      toast(t('profile.errorSave'));
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast(t('profile.invalidImage'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast(t('profile.imageTooLarge'));
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 150, 0.8);
      setForm((f) => ({ ...f, avatarUrl: dataUrl }));
      setProfile((p) => (p ? { ...p, avatarUrl: dataUrl } : null));
      await saveAvatar(dataUrl);
    } catch {
      toast(t('profile.invalidImage'));
    }
    e.target.value = '';
  };

  const handleAvatarRemove = async () => {
    setForm((f) => ({ ...f, avatarUrl: null }));
    setProfile((p) => (p ? { ...p, avatarUrl: null } : null));
    await saveAvatar(null);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const rules = getPasswordRuleResults(passwordForm.newPassword, passwordForm.currentPassword);
    const allMet = rules.every((r) => r.met);
    if (!allMet) {
      toast(t('profile.passwordRequirementsNotMet'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast(t('profile.passwordMismatch'));
      return;
    }
    setSaving(true);
    try {
      await api.put('/professor/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast(t('profile.passwordChanged'));
    } catch (err) {
      toast(err.response?.data?.error || t('profile.errorPassword'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="w-10 h-10 border-2 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-2xl animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-pink-soft/50 dark:border-white/10 bg-white dark:bg-[#1a1a1a] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-primary to-pink-dark dark:from-pink-400 dark:to-pink-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg flex-shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(profile.name)
              )}
            </div>
            <div>
              <h2 className="font-heading font-semibold text-lg text-text dark:text-[#f5f5f5]">{t('profile.title')}</h2>
              <p className="text-xs text-text/60 dark:text-[#f5f5f5]/70">{t('profile.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-pink-soft/50 dark:hover:bg-white/10 text-pink-primary dark:text-pink-400 transition"
            aria-label={t('profile.close')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-pink-soft/50 dark:border-white/10 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'text-pink-dark dark:text-pink-400 border-b-2 border-pink-primary dark:border-pink-400 bg-pink-soft/30 dark:bg-pink-500/10'
                  : 'text-text/60 dark:text-[#f5f5f5]/60 hover:text-text dark:hover:text-[#f5f5f5] hover:bg-pink-soft/20 dark:hover:bg-white/5'
              }`}
            >
              {t(`profile.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'personal' && (
            <div className="animate-fade-in space-y-5">
              {/* Avatar section */}
              <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl bg-pink-soft/20 dark:bg-white/5 border border-pink-soft/40 dark:border-white/10">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-pink-primary to-pink-dark dark:from-pink-400 dark:to-pink-600 flex items-center justify-center text-white font-semibold text-xl shadow-lg flex-shrink-0">
                    {(profile.avatarUrl || form.avatarUrl) ? (
                      <img src={profile.avatarUrl || form.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(profile.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text dark:text-[#f5f5f5]">{t('profile.photoTitle')}</p>
                    <p className="text-xs text-text/60 dark:text-[#f5f5f5]/70 mt-0.5">{t('profile.photoDesc')}</p>
                  </div>
                </div>
                {isOwnProfile && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/80 dark:bg-white/10 border border-pink-soft/60 dark:border-white/20 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/40 dark:hover:bg-white/20 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {t('profile.replace')}
                    </button>
                    <button
                      type="button"
                      onClick={handleAvatarRemove}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('profile.remove')}
                    </button>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text dark:text-[#f5f5f5] mb-1.5">{t('profile.name')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text/50 dark:text-[#f5f5f5]/50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      disabled={isAdminView}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-soft/60 dark:border-white/20 bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] focus:ring-2 focus:ring-pink-primary/50 focus:border-pink-primary disabled:opacity-60"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-[#f5f5f5] mb-1.5">
                    {t('profile.email')} <span className="text-xs font-normal text-text/50 dark:text-[#f5f5f5]/50">({t('profile.emailAdminOnly')})</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text/50 dark:text-[#f5f5f5]/50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={form.email}
                      readOnly
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-soft/60 dark:border-white/20 bg-pink-soft/20 dark:bg-white/5 text-text dark:text-[#f5f5f5] cursor-default"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-[#f5f5f5] mb-1.5">{t('profile.memberSince')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text/50 dark:text-[#f5f5f5]/50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={formatMemberSince(profile.createdAt)}
                      readOnly
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-soft/60 dark:border-white/20 bg-pink-soft/20 dark:bg-white/5 text-text dark:text-[#f5f5f5] cursor-default"
                    />
                  </div>
                </div>
                {isOwnProfile && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-pink-primary dark:bg-pink-400 text-white font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition disabled:opacity-60"
                  >
                    {saving ? t('profile.saving') : t('profile.save')}
                  </button>
                )}
              </form>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="animate-fade-in space-y-6">
              <p className="text-sm text-text/70 dark:text-[#f5f5f5]/80">{t('profile.appearanceDesc')}</p>
              <div className="p-4 rounded-xl bg-pink-soft/20 dark:bg-white/5 border border-pink-soft/40 dark:border-white/10">
                <ThemeToggle className="w-full justify-between" />
              </div>
              {isOwnProfile && (
                <div>
                  <h3 className="text-sm font-medium text-text dark:text-[#f5f5f5] mb-2">{t('profile.calendarCardStyle')}</h3>
                  <p className="text-xs text-text/60 dark:text-[#f5f5f5]/70 mb-3">{t('profile.calendarCardStyleDesc')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {CALENDAR_STYLES.map((style) => {
                      const selected = calendarStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => { setCalendarStyle(style.id); setCalendarStyleState(style.id); }}
                          className={`p-3 rounded-xl border-2 text-left transition-all duration-300 ${
                            selected
                              ? 'border-pink-primary dark:border-pink-400 bg-pink-soft/30 dark:bg-pink-500/20'
                              : 'border-pink-soft/40 dark:border-white/10 hover:border-pink-soft/70 dark:hover:border-white/20 bg-white/50 dark:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`w-2 h-2 rounded-full ${selected ? 'bg-pink-primary dark:bg-pink-400' : 'bg-pink-soft dark:bg-white/30'}`} />
                            <span className="text-sm font-medium text-text dark:text-[#f5f5f5]">{t(`profile.calendarStyle.${style.key}`)}</span>
                          </div>
                          <p className="text-xs text-text/60 dark:text-[#f5f5f5]/70">{t(`profile.calendarStyleDesc.${style.key}`)}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="animate-fade-in">
              {isAdminView ? (
                <p className="text-sm text-text/60 dark:text-[#f5f5f5]/70">{t('profile.adminNoPassword')}</p>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text dark:text-[#f5f5f5] mb-1.5">{t('profile.currentPassword')}</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-pink-soft/60 dark:border-white/20 bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] focus:ring-2 focus:ring-pink-primary/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text dark:text-[#f5f5f5] mb-1.5">{t('profile.newPassword')}</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-pink-soft/60 dark:border-white/20 bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] focus:ring-2 focus:ring-pink-primary/50"
                      minLength={8}
                      required
                    />
                    <div className="mt-3 p-4 rounded-xl bg-pink-soft/10 dark:bg-white/5 border border-pink-soft/30 dark:border-white/10 animate-fade-in">
                      <p className="text-sm font-medium text-text dark:text-[#f5f5f5] mb-2">{t('profile.passwordRequirements')}</p>
                      <ul className="space-y-1.5">
                        {getPasswordRuleResults(passwordForm.newPassword, passwordForm.currentPassword).map((rule, i) => (
                          <li
                            key={rule.key}
                            className={`flex items-center gap-2 text-sm transition-all duration-300 ease-out ${
                              rule.met
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {rule.met ? (
                              <svg className="w-4 h-4 flex-shrink-0 text-emerald-500 dark:text-emerald-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 flex-shrink-0 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span>{t(`profile.passwordRule.${rule.key}`)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text dark:text-[#f5f5f5] mb-1.5">{t('profile.confirmPassword')}</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-pink-soft/60 dark:border-white/20 bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] focus:ring-2 focus:ring-pink-primary/50"
                      minLength={8}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-pink-primary dark:bg-pink-400 text-white font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition disabled:opacity-60"
                  >
                    {saving ? t('profile.saving') : t('profile.changePassword')}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
