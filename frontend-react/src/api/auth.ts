import { api } from './client';
import { Account, SessionResponse } from '../types';

export const authApi = {
  async getSession(): Promise<SessionResponse> {
    const res = await api.get<SessionResponse>('/api/auth/session');
    if (res.csrf_token) {
      api.setCsrfToken(res.csrf_token);
    }
    return res;
  },

  async login(email: string, password: string): Promise<Account> {
    const res = await api.post<SessionResponse>('/api/auth/login', { email, password });
    if (res.csrf_token) {
      api.setCsrfToken(res.csrf_token);
    }
    if (!res.user) {
      throw new Error('Sign in failed: no user returned');
    }
    return res.user;
  },

  async register(name: string, email: string): Promise<{ verification_requested: boolean }> {
    return api.post<{ verification_requested: boolean }>('/api/auth/register', { name, email });
  },

  async verifyEmail(token: string, password: string): Promise<Account> {
    const res = await api.post<SessionResponse>('/api/auth/verify-email', { token, password });
    if (res.csrf_token) {
      api.setCsrfToken(res.csrf_token);
    }
    if (!res.user) {
      throw new Error('Email verification failed: no user returned');
    }
    return res.user;
  },

  async choosePassword(password: string): Promise<Account> {
    const res = await api.post<SessionResponse>('/api/auth/password', { password });
    if (res.csrf_token) {
      api.setCsrfToken(res.csrf_token);
    }
    if (!res.user) {
      throw new Error('Password update failed: no user returned');
    }
    return res.user;
  },

  async logout(): Promise<void> {
    const res = await api.post<SessionResponse>('/api/auth/logout', {});
    if (res.csrf_token) {
      api.setCsrfToken(res.csrf_token);
    }
  },
};
