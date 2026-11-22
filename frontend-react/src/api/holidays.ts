import { api } from './client';
import { HolidaySchedule } from '../types';

export const holidaysApi = {
  async list(): Promise<HolidaySchedule> {
    return api.get<HolidaySchedule>('/api/holidays');
  },

  async add(date: string, name: string): Promise<{ date: string; deadlines_updated: number }> {
    return api.post<{ date: string; deadlines_updated: number }>('/api/holidays', { date, name });
  },

  async remove(date: string): Promise<{ date: string; deadlines_updated: number }> {
    return api.post<{ date: string; deadlines_updated: number }>(`/api/holidays/${date}/remove`, {});
  },
};
