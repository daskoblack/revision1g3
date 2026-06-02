import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem('mm_token'));
  const [user, setUser]     = useState(() => {
    const raw = localStorage.getItem('mm_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [quota, setQuota]   = useState({ quota: 30, used: 0, remaining: 30 });

  // Synchroniser l'en-tête axios à chaque changement de token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Charger le quota dès que le token est disponible
  useEffect(() => {
    if (token) fetchQuota();
  }, [token]); // eslint-disable-line

  const fetchQuota = useCallback(async () => {
    try {
      const res = await axios.get('/api/chat/quota');
      setQuota(res.data);
    } catch (err) {
      // Token expiré → déconnexion silencieuse
      if (err.response?.status === 401) logout();
    }
  }, []); // eslint-disable-line

  const login = (newToken, username, classe) => {
    localStorage.setItem('mm_token', newToken);
    localStorage.setItem('mm_user', JSON.stringify({ username, classe }));
    setToken(newToken);
    setUser({ username, classe });
  };

  const logout = () => {
    localStorage.removeItem('mm_token');
    localStorage.removeItem('mm_user');
    setToken(null);
    setUser(null);
    setQuota({ quota: 30, used: 0, remaining: 30 });
  };

  return (
    <AuthContext.Provider value={{ user, token, quota, login, logout, fetchQuota }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
