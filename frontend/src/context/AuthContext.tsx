import React, { createContext, useContext, useState, useEffect } from 'react';
import { LoyaltyAPI } from '../services/api';

export type UserRole = 'OPERATIONS_MANAGER' | 'STORE_OPERATOR' | 'ANALYST' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  customer_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('yottaflex_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('yottaflex_access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('yottaflex_access_token');
      if (storedToken) {
        try {
          const userData = await LoyaltyAPI.getMe();
          setUser(userData);
          localStorage.setItem('yottaflex_user', JSON.stringify(userData));
        } catch {
          localStorage.removeItem('yottaflex_access_token');
          localStorage.removeItem('yottaflex_refresh_token');
          localStorage.removeItem('yottaflex_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await LoyaltyAPI.login({ email, password });
    localStorage.setItem('yottaflex_access_token', res.access_token);
    if (res.refresh_token) {
      localStorage.setItem('yottaflex_refresh_token', res.refresh_token);
    }
    localStorage.setItem('yottaflex_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await LoyaltyAPI.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('yottaflex_access_token');
      localStorage.removeItem('yottaflex_refresh_token');
      localStorage.removeItem('yottaflex_user');
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

