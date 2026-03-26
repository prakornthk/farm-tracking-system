import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      try {
        const parsedUser = JSON.parse(stored);
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (code, redirectUri) => {
    const res = await authAPI.lineLogin(code, redirectUri);
    const { token, user: userData } = res.data?.data || {};
    if (!token || !userData) {
      throw new Error('Invalid login response');
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isOwner = () => hasRole('owner');
  const isManager = () => hasRole('owner', 'manager');
  const isWorker = () => hasRole('owner', 'manager', 'worker');

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole, isOwner, isManager, isWorker }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
