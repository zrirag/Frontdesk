import { api } from './client';
import { StaffRoster } from '../types';

export const staffApi = {
  async list(): Promise<StaffRoster> {
    return api.get<StaffRoster>('/api/staff');
  },

  async add(data: {
    name: string;
    email: string;
    role: 'agent' | 'manager';
    temporary_password: string;
    manager_id?: number | null;
  }): Promise<{ id: number }> {
    return api.post<{ id: number }>('/api/staff', data);
  },

  async moveAgent(
    agentId: number,
    managerId: number,
    expectedManagerId: number | null
  ): Promise<{ id: number }> {
    return api.post<{ id: number }>(`/api/staff/${agentId}/manager`, {
      manager_id: managerId,
      expected_manager_id: expectedManagerId,
    });
  },
};
