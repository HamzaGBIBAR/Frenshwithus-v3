import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AnimatedEye from '../components/AnimatedEye';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      const path = data.user.role === 'ADMIN' ? '/admin' : data.user.role === 'PROFESSOR' ? '/professor' : data.user.role === 'STUDENT' ? '/student' : '/';
      // Redirection complète pour garantir cookies + auth state corrects
      window.location.href = path;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 sm:px-6 py-20 sm:py-0 transition-colors duration-500 relative">
      <div className="absolute top-4 sm:top-6 end-4 sm:end-6 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[min(100%,28rem)] animate-fade-in">
        <Link to="/" className="block text-center mb-8 hover:opacity-90 transition-opacity" dir="ltr">
          <span className="inline-flex flex-wrap items-baseline justify-center gap-1 text-xl sm:text-2xl font-semibold">
            <span className="font-bold text-text dark:text-[#f5f5f5]">French</span>
            <span className="text-base font-light text-text/50 dark:text-[#f5f5f5]/60 lowercase">with</span>
            <span className="inline-flex">
              <AnimatedEye variant="hero" />
            </span>
          </span>
        </Link>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-pink-soft dark:shadow-lg border border-pink-soft/50 dark:border-white/10 w-full transition-colors duration-500">
          <h1 className="text-2xl font-semibold text-text dark:text-[#f5f5f5] mb-6">{t('login.title')}</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-800/50">{error}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text dark:text-[#f5f5f5] mb-1">{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-pink-soft dark:border-white/20 dark:bg-white/5 dark:text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:border-pink-primary dark:focus:border-pink-400 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text dark:text-[#f5f5f5] mb-1">{t('login.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-12 border border-pink-soft dark:border-white/20 dark:bg-white/5 dark:text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:border-pink-primary dark:focus:border-pink-400 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-text/50 dark:text-[#f5f5f5]/50 hover:text-pink-primary dark:hover:text-pink-400 hover:bg-pink-soft/30 dark:hover:bg-white/10 transition-all duration-300 active:scale-95"
                >
                  <svg
                    className={`w-5 h-5 transition-all duration-300 ${showPassword ? 'opacity-100 scale-100' : 'opacity-70'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full py-3 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 disabled:opacity-50 transition-all duration-300 btn-glow"
          >
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-text/60 dark:text-[#f5f5f5]/60">
          <Link to="/" className="text-pink-primary dark:text-pink-400 hover:underline font-medium">{t('login.backHome')}</Link>
        </p>
      </div>
    </div>
  );
}
