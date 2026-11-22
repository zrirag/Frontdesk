import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Account } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: Account | null;
  loading: boolean;
  error: string | null;
  isCustomer: boolean;
  isStaff: boolean;
  isManager: boolean;
  isAdmin: boolean;
  canManage: boolean;
  login: (email: string, password: string) => Promise<Account>;
  register: (name: string, email: string) => Promise<{ verification_requested: boolean }>;
  verifyEmail: (token: string, password: string) => Promise<Account>;
  choosePassword: (password: string) => Promise<Account>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<Account | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async (): Promise<Account | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.getSession();
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      console.warn('Session check failed or unauthenticated:', err.message);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string): Promise<Account> => {
    setError(null);
    try {
      const account = await authApi.login(email, password);
      setUser(account);
      return account;
    } catch (err: any) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setError(message);
      throw err;
    }
  };

  const register = async (name: string, email: string) => {
    setError(null);
    try {
      return await authApi.register(name, email);
    } catch (err: any) {
      const message = err.message || 'Registration failed.';
      setError(message);
      throw err;
    }
  };

  const verifyEmail = async (token: string, password: string): Promise<Account> => {
    setError(null);
    try {
      const account = await authApi.verifyEmail(token, password);
      setUser(account);
      return account;
    } catch (err: any) {
      const message = err.message || 'Verification failed.';
      setError(message);
      throw err;
    }
  };

  const choosePassword = async (password: string): Promise<Account> => {
    setError(null);
    try {
      const account = await authApi.choosePassword(password);
      setUser(account);
      return account;
    } catch (err: any) {
      const message = err.message || 'Failed to set permanent password.';
      setError(message);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const clearError = () => setError(null);

  const role = user?.role;
  const isCustomer = role === 'customer';
  const isStaff = role === 'agent' || role === 'manager' || role === 'admin';
  const isManager = role === 'manager';
  const isAdmin = role === 'admin';
  const canManage = isManager || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isCustomer,
        isStaff,
        isManager,
        isAdmin,
        canManage,
        login,
        register,
        verifyEmail,
        choosePassword,
        logout,
        refreshSession,
        clearError,
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
