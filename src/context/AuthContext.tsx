import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { setAuthTokenGetter, setAuthErrorCallback } from '../services/api';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MEMORY_SESSION_KEY = 'gallery_admin_session_state';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store token in React memory state.
  // Optional sessionStorage backup keeps session active across soft page refreshes while avoiding persistent localStorage.
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(MEMORY_SESSION_KEY);
      if (stored) {
        const parsed: AdminUser = JSON.parse(stored);
        setAuthTokenGetter(() => parsed.token ?? null);
        return parsed;
      }
    } catch {
      // Ignore session storage errors
    }
    setAuthTokenGetter(() => null);
    return null;
  });

  const logout = () => {
    setAuthTokenGetter(() => null);
    setUser(null);
    try {
      sessionStorage.removeItem(MEMORY_SESSION_KEY);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    setAuthErrorCallback(() => {
      logout();
    });
  }, []);

  const login = (token: string, username: string) => {
    const newUser = { token, username };
    setAuthTokenGetter(() => token);
    setUser(newUser);
    try {
      sessionStorage.setItem(MEMORY_SESSION_KEY, JSON.stringify(newUser));
    } catch {
      // Memory fallback if sessionStorage is blocked
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: user?.token ?? null,
        isAuthenticated: !!user?.token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
