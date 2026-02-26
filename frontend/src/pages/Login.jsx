import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      if (data.user.role === 'ADMIN') navigate('/admin');
      else navigate('/');
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
        <Link to="/" className="block text-center text-xl font-semibold text-text dark:text-[#f5f5f5] mb-8 hover:text-pink-primary dark:hover:text-pink-400 transition">
          French With Us
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-pink-soft dark:border-white/20 dark:bg-white/5 dark:text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-pink-primary dark:focus:ring-pink-400 focus:border-pink-primary dark:focus:border-pink-400 transition"
                required
              />
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
