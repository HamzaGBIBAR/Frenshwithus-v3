import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = () => {
    return api
      .get('/auth/me')
      .then((r) => {
        const u = r.data;
        setUser(u);
        if (u && !u.timezone && typeof Intl !== 'undefined' && Intl.DateTimeFormat?.().resolvedOptions?.()?.timeZone) {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          api.patch('/auth/me', { timezone: tz }).then((patched) => setUser((prev) => (prev ? { ...prev, timezone: patched.data?.timezone ?? tz } : null))).catch(() => {});
        }
      })
      .catch(() => setUser(null));
  };

  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, []);

  const login = (data) => {
    setUser(data.user);
    setLoading(false);
  };

  const refreshUser = () => fetchUser();

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
