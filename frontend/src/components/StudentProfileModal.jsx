import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ThemeToggle from './ThemeToggle';
import { useToast } from './Toast';
import { CALENDAR_STYLES, getStudentCalendarStyle, setStudentCalendarStyle } from '../utils/calendarStyles';
import CalendarStylePreviewCard from './CalendarStylePreviewCard';

const TABS = ['personal', 'appearance', 'password'];

function formatMemberSince(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2);
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

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_SIZE = 500 * 1024; // 500KB (for Base64 storage)
const PREVIEW_SIZE = 200;

async function applyTransformAndGetBlob(file, zoom = 1, rotation = 0) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = PREVIEW_SIZE;
      canvas.height = PREVIEW_SIZE;
      const ctx = canvas.getContext('2d');
      const rad = (rotation * Math.PI) / 180;
      const scale = Math.min(PREVIEW_SIZE / img.width, PREVIEW_SIZE / img.height) * zoom;
      ctx.translate(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2);
      ctx.rotate(rad);
      ctx.scale(scale, scale);
      ctx.translate(-img.width / 2, -img.height / 2);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(img.src);
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      }, 'image/jpeg', 0.9);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Image load failed'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function StudentProfileModal({ onClose }) {
  const { t } = useTranslation();
  const { user: authUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [form, setForm] = useState({ name: '', email: '', avatarUrl: null });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [calendarStyle, setCalendarStyleState] = useState(getStudentCalendarStyle);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarRotation, setAvatarRotation] = useState(0);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const handler = () => setCalendarStyleState(getStudentCalendarStyle());
    window.addEventListener('studentCalendarStyleChanged', handler);
    return () => window.removeEventListener('studentCalendarStyleChanged', handler);
  }, []);

  useEffect(() => {
    refreshUser?.();
  }, []);

  useEffect(() => {
    api
      .get('/student/profile')
      .then((r) => {
        setProfile(r.data);
        setForm({ name: r.data.name, email: r.data.email, avatarUrl: r.data.avatarUrl });
      })
      .catch(() => showToast(t('profile.errorLoad')))
      .finally(() => setLoading(false));
  }, [t, showToast]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/student/profile', { name: form.name });
      setProfile(r.data);
      setForm((f) => ({ ...f, name: r.data.name }));
      refreshUser?.();
      showToast(t('profile.saved'));
    } catch (err) {
      console.error('Profile save error:', err);
      showToast(err.response?.data?.error || t('profile.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast(t('profile.invalidImage'));
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      showToast(t('profile.imageTooLarge'));
      return;
    }
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
      setAvatarFile(file);
      setAvatarZoom(1);
      setAvatarRotation(0);
    };
    reader.onerror = () => showToast(t('profile.errorLoad'));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const doUpload = async (fileToUpload) => {
    const formData = new FormData();
    formData.append('avatar', fileToUpload);
    const r = await api.post('/student/profile/avatar', formData);
    setProfile(r.data);
    setForm((f) => ({ ...f, avatarUrl: r.data.avatarUrl }));
    refreshUser?.();
    showToast(t('profile.saved'));
  };

  const confirmAvatarPreview = async () => {
    if (!avatarPreview || !avatarFile) {
      showToast(t('profile.selectImageFirst'));
      return;
    }
    setAvatarLoading(true);
    let lastError = null;
    try {
      if (avatarZoom === 1 && avatarRotation === 0) {
        await doUpload(avatarFile);
      } else {
        const blob = await applyTransformAndGetBlob(avatarFile, avatarZoom, avatarRotation);
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        await doUpload(file);
      }
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarFile(null);
    } catch (err) {
      console.error('Avatar upload error:', err);
      lastError = err;
      if (avatarZoom !== 1 || avatarRotation !== 0) {
        try {
          await doUpload(avatarFile);
          if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
          setAvatarPreview(null);
          setAvatarFile(null);
          lastError = null;
        } catch (retryErr) {
          console.error('Avatar retry error:', retryErr);
          lastError = retryErr;
        }
      }
    } finally {
      setAvatarLoading(false);
      if (lastError) {
        const msg = lastError.response?.data?.error || lastError.response?.data?.message || lastError.message;
        showToast(msg || t('profile.errorSave'));
      }
    }
  };

  const cancelAvatarPreview = () => {
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarZoom(1);
    setAvatarRotation(0);
    fileInputRef.current?.click();
  };

  const handleAvatarRemove = async () => {
    setAvatarLoading(true);
    try {
      const r = await api.delete('/student/profile/avatar');
      setProfile(r.data);
      setForm((f) => ({ ...f, avatarUrl: null }));
      refreshUser?.();
      showToast(t('profile.saved'));
    } catch (err) {
      console.error('Avatar remove error:', err);
      showToast(err.response?.data?.error || t('profile.errorSave'));
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const rules = getPasswordRuleResults(passwordForm.newPassword, passwordForm.currentPassword);
    const allMet = rules.every((r) => r.met);
    if (!allMet) {
      showToast(t('profile.passwordRequirementsNotMet'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(t('profile.passwordMismatch'));
      return;
    }
    setSaving(true);
    try {
      await api.put('/student/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast(t('profile.passwordChanged'));
    } catch (err) {
      showToast(err.response?.data?.error || t('profile.errorPassword'));
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
    <>
      {avatarPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-2xl p-5 animate-modal-in">
            <p className="font-medium text-text dark:text-[#f5f5f5] mb-3">{t('profile.previewAvatar')}</p>
            <div className="flex justify-center mb-4">
              <div className="relative w-40 h-40 rounded-full overflow-hidden ring-2 ring-pink-primary/50 dark:ring-pink-400/50 bg-pink-soft/30 dark:bg-white/10 shrink-0 flex items-center justify-center">
                <img
                  key={avatarPreview}
                  src={avatarPreview}
                  alt=""
                  className="max-w-none max-h-none transition-transform duration-150"
                  style={{
                    transform: `scale(${avatarZoom}) rotate(${avatarRotation}deg)`,
                    width: 200,
                    height: 200,
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs text-text/70 dark:text-[#f5f5f5]/70 mb-1">{t('profile.zoom')}</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setAvatarZoom((z) => Math.max(0.5, z - 0.25))} className="w-8 h-8 rounded-lg bg-pink-soft/50 dark:bg-white/10 flex items-center justify-center text-pink-primary dark:text-pink-400 font-bold">−</button>
                  <input type="range" min="0.5" max="2" step="0.1" value={avatarZoom} onChange={(e) => setAvatarZoom(parseFloat(e.target.value))} className="flex-1 h-2 rounded-full accent-pink-primary" />
                  <button type="button" onClick={() => setAvatarZoom((z) => Math.min(2, z + 0.25))} className="w-8 h-8 rounded-lg bg-pink-soft/50 dark:bg-white/10 flex items-center justify-center text-pink-primary dark:text-pink-400 font-bold">+</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text/70 dark:text-[#f5f5f5]/70 mb-1">{t('profile.rotation')}</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setAvatarRotation((r) => (r - 90 + 360) % 360)} className="px-3 py-1.5 rounded-lg bg-pink-soft/50 dark:bg-white/10 text-sm text-pink-primary dark:text-pink-400">↺ −90°</button>
                  <button type="button" onClick={() => setAvatarRotation((r) => (r + 90) % 360)} className="px-3 py-1.5 rounded-lg bg-pink-soft/50 dark:bg-white/10 text-sm text-pink-primary dark:text-pink-400">↻ +90°</button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelAvatarPreview}
                className="flex-1 py-2.5 rounded-xl border border-pink-soft/60 dark:border-white/20 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/30 dark:hover:bg-white/10 transition"
              >
                {t('profile.chooseAnother')}
              </button>
              <button
                type="button"
                onClick={confirmAvatarPreview}
                disabled={avatarLoading}
                className="flex-1 py-2.5 rounded-xl bg-pink-primary dark:bg-pink-400 text-white font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition disabled:opacity-60"
              >
                {avatarLoading ? t('profile.saving') : t('profile.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <div
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#1a1a1a] border border-pink-soft/50 dark:border-white/10 shadow-2xl animate-modal-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-pink-soft/50 dark:border-white/10 bg-white dark:bg-[#1a1a1a] rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-primary to-pink-dark dark:from-pink-400 dark:to-pink-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg flex-shrink-0">
                {(profile.avatarUrl || form.avatarUrl) ? (
                  <img src={profile.avatarUrl || form.avatarUrl} alt="" className="w-full h-full object-cover" />
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

          <div className="p-5">
            {activeTab === 'personal' && (
              <div className="animate-fade-in space-y-5">
                <div className="p-4 rounded-xl bg-pink-soft/20 dark:bg-white/5 border border-pink-soft/40 dark:border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-pink-primary to-pink-dark dark:from-pink-400 dark:to-pink-600 flex items-center justify-center text-white font-semibold text-xl shadow-lg flex-shrink-0">
                      {(profile.avatarUrl || form.avatarUrl) ? (
                        <img src={profile.avatarUrl || form.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(profile.name)
                      )}
                    </div>
                    <div className="flex-1 w-full min-w-0 sm:min-w-[200px]">
                      <p className="font-medium text-text dark:text-[#f5f5f5]">{t('profile.photoTitle')}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <button
                        type="button"
                        onClick={handleAvatarRemove}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {t('profile.remove')}
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-pink-primary dark:bg-pink-400 text-white hover:bg-pink-dark dark:hover:bg-pink-500 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('profile.takePhoto')}
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/80 dark:bg-white/10 border border-pink-soft/60 dark:border-white/20 text-text dark:text-[#f5f5f5] hover:bg-pink-soft/40 dark:hover:bg-white/20 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {t('profile.chooseImage')}
                      </button>
                    </div>
                  </div>
                  <div className="w-full">
                    <p className="text-sm text-text/80 dark:text-[#f5f5f5]/80 leading-relaxed">{t('profile.photoDesc')}</p>
                    <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60 mt-2">{t('profile.photoConditions')}</p>
                  </div>
                </div>

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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-soft/60 dark:border-white/20 bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] focus:ring-2 focus:ring-pink-primary/50 focus:border-pink-primary"
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
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-pink-primary dark:bg-pink-400 text-white font-medium hover:bg-pink-dark dark:hover:bg-pink-500 transition disabled:opacity-60"
                  >
                    {saving ? t('profile.saving') : t('profile.save')}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="animate-fade-in space-y-6">
                <p className="text-sm text-text/70 dark:text-[#f5f5f5]/80">{t('profile.appearanceDesc')}</p>
                <div className="p-4 rounded-xl bg-pink-soft/20 dark:bg-white/5 border border-pink-soft/40 dark:border-white/10">
                  <ThemeToggle className="w-full justify-between" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text dark:text-[#f5f5f5] mb-1">{t('profile.calendarCardStyle')}</h3>
                  <p className="text-xs text-text/60 dark:text-[#f5f5f5]/70 mb-4">{t('profile.calendarStyleDesc')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CALENDAR_STYLES.map((style, i) => {
                      const selected = calendarStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => {
                            setStudentCalendarStyle(style.id);
                            setCalendarStyleState(style.id);
                            showToast(t('profile.calendarStyleUpdated'));
                          }}
                          className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-300 ease-out overflow-hidden animate-fade-in
                            ${selected
                              ? 'border-pink-primary dark:border-pink-400 bg-pink-soft/25 dark:bg-pink-500/15 shadow-pink-soft dark:shadow-lg scale-[1.02] ring-2 ring-pink-primary/20 dark:ring-pink-400/20'
                              : 'border-pink-soft/40 dark:border-white/10 hover:border-pink-soft/60 dark:hover:border-white/20 bg-white/60 dark:bg-white/5 hover:scale-[1.02] hover:shadow-md'
                            }`}
                          style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                        >
                          {selected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-primary dark:bg-pink-400 flex items-center justify-center text-white animate-fade-in">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <CalendarStylePreviewCard styleId={style.id} />
                          <p className="mt-2 text-xs font-medium text-text/80 dark:text-[#f5f5f5]/80">{t(`profile.calendarStyle.${style.id}`)}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="animate-fade-in space-y-4">
                <p className="text-sm text-text/70 dark:text-[#f5f5f5]/80">{t('profile.changePassword')}</p>
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
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text dark:text-[#f5f5f5] mb-1.5">{t('profile.confirmPassword')}</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-soft/60 dark:border-white/20 bg-white dark:bg-[#2a2a2a] text-text dark:text-[#f5f5f5] focus:ring-2 focus:ring-pink-primary/50"
                    required
                  />
                </div>
                <div className="p-3 rounded-xl bg-pink-soft/20 dark:bg-white/5 border border-pink-soft/40 dark:border-white/10">
                  <p className="text-xs font-medium text-text dark:text-[#f5f5f5] mb-2">{t('profile.passwordRequirements')}</p>
                  <ul className="space-y-1 text-xs text-text/70 dark:text-[#f5f5f5]/70">
                    {getPasswordRuleResults(passwordForm.newPassword, passwordForm.currentPassword).map((r) => (
                      <li key={r.key} className={r.met ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                        {r.met ? '✓ ' : '○ '}{t(`profile.passwordRule.${r.key}`)}
                      </li>
                    ))}
                  </ul>
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
        </div>
      </div>
    </>
  );
}
