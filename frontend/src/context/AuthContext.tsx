import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { User, UserRole } from '../types';
import { AuthContext } from './auth-context-def';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = api.getToken();
      if (savedToken) {
        try {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
            setToken(savedToken);
          } else {
            api.setToken(null);
            setToken(null);
            setUser(null);
          }
        } catch {
          api.setToken(null);
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      api.setToken(res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
      setIsLoading(false);
      return res.user;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore errors on logout
    }
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const hasRole = (allowedRoles?: UserRole[]): boolean => {
    if (!user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;

    const userRoleLower = String(user.role).toLowerCase();
    return allowedRoles.some((r) => {
      const allowedLower = String(r).toLowerCase();
      return userRoleLower === allowedLower || userRoleLower === 'admin';
    });
  };

  const switchDemoRole = (role: 'Admin' | 'PM' | 'Developer') => {
    const roleMapping: Record<string, { name: string; email: string; role: UserRole }> = {
      Admin: { name: 'Sarah Connor (Admin)', email: 'admin@pulsestudio.io', role: 'ADMIN' },
      PM: { name: 'Alex Mercer (PM)', email: 'pm@pulsestudio.io', role: 'PM' },
      Developer: { name: 'Elena Rostova (Dev)', email: 'dev@pulsestudio.io', role: 'DEVELOPER' },
    };

    const target = roleMapping[role];
    if (target) {
      setUser((prev) => ({
        ...prev,
        ...target,
        id: prev?.id || 'usr-demo',
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
