import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = () => {
    return api
      .get('/auth/me')
      .then((r) => setUser(r.data))
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
