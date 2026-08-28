import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, removeToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'admin-001',
    email: 'admin@bhu-id.gov.in',
    full_name: 'BHU-ID Administrator',
    role: 'ADMIN'
  });
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      let token = getToken();
      if (!token) {
        // Auto-initialize dev session for instant hackathon demonstration
        try {
          const res = await api.auth.login('admin@bhu-id.local', 'admin123');
          if (res && res.user) {
            setUser(res.user);
          }
        } catch (e) {
          console.warn('Auto login notice:', e);
        }
      } else {
        try {
          const currentUser = await api.auth.getMe();
          if (currentUser) setUser(currentUser);
        } catch (err) {
          console.warn('Auth check error:', err);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);


  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    if (res.success) {
      setUser(res.user);
      setIsAuthModalOpen(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  const switchRole = (role) => {
    if (role === 'ADMIN') {
      setUser({
        id: 'admin-001',
        email: 'admin@bhu-id.gov.in',
        full_name: 'BHU-ID Administrator',
        role: 'ADMIN'
      });
    } else {
      setUser({
        id: 'user-001',
        email: 'surveyor@bhu-id.gov.in',
        full_name: 'Alex (Field Surveyor)',
        role: 'USER'
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
        switchRole,
        isAuthModalOpen,
        setIsAuthModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
