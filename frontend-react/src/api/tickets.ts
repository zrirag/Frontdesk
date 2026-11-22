import { api } from './client';
import {
  SupportAgent,
  TicketDetail,
  TicketListResult,
  TicketPriority,
} from '../types';

export const ticketsApi = {
  async list(scope: string, filter: string = 'all', before?: number | null): Promise<TicketListResult> {
    const params: Record<string, string> = { scope };
    if (filter !== 'all') params.filter = filter;
    if (before) params.before = String(before);

    return api.get<TicketListResult>('/api/tickets', { params });
  },

  async getDetail(id: number): Promise<TicketDetail> {
    return api.get<TicketDetail>(`/api/tickets/${id}`);
  },

  async create(data: {
    subject: string;
    description: string;
    customer_blocked: boolean;
    attachments?: File[];
  }): Promise<{ id: number }> {
    if (!data.attachments || data.attachments.length === 0) {
      return api.post<{ id: number }>('/api/tickets', {
        subject: data.subject,
        description: data.description,
        customer_blocked: data.customer_blocked,
      });
    }

    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('description', data.description);
    formData.append('customer_blocked', String(data.customer_blocked));
    for (const file of data.attachments) {
      formData.append('attachments', file, file.name);
    }

    return api.postForm<{ id: number }>('/api/tickets', formData);
  },

  async getAgents(): Promise<SupportAgent[]> {
    const res = await api.get<{ agents: SupportAgent[] }>('/api/tickets/agents');
    return res.agents;
  },

  async claim(ticketId: number, ownershipVersion: number): Promise<{ id: number }> {
    return api.post<{ id: number }>(`/api/tickets/${ticketId}/claim`, {
      ownership_version: ownershipVersion,
    });
  },

  async transfer(
    ticketId: number,
    agentId: number,
    ownershipVersion: number,
    reason: string
  ): Promise<{ id: number }> {
    return api.post<{ id: number }>(`/api/tickets/${ticketId}/transfer`, {
      agent_id: agentId,
      ownership_version: ownershipVersion,
      reason,
    });
  },

  async changePriority(
    ticketId: number,
    priority: TicketPriority,
    expectedPriority: TicketPriority
  ): Promise<{ id: number }> {
    return api.post<{ id: number }>(`/api/tickets/${ticketId}/priority`, {
      priority,
      expected_priority: expectedPriority,
    });
  },

  async waitForCustomer(ticketId: number, ownershipVersion: number): Promise<{ id: number }> {
    return api.post<{ id: number }>(`/api/tickets/${ticketId}/wait`, {
      ownership_version: ownershipVersion,
    });
  },

  async resolve(ticketId: number, ownershipVersion: number): Promise<{ id: number }> {
    return api.post<{ id: number }>(`/api/tickets/${ticketId}/resolve`, {
      ownership_version: ownershipVersion,
    });
  },

  async reopen(ticketId: number): Promise<{ id: number }> {
    return api.post<{ id: number }>(`/api/tickets/${ticketId}/reopen`, {});
  },

  async reply(
    ticketId: number,
    body: string,
    files: File[] = [],
    waitForCustomer: boolean = false,
    ownershipVersion?: number
  ): Promise<{ id: number }> {
    if (files.length === 0) {
      const payload: Record<string, any> = { body };
      if (waitForCustomer) payload.wait_for_customer = true;
      if (ownershipVersion !== undefined) payload.ownership_version = ownershipVersion;
      return api.post<{ id: number }>(`/api/tickets/${ticketId}/replies`, payload);
    }

    const formData = new FormData();
    formData.append('body', body);
    if (waitForCustomer) formData.append('wait_for_customer', 'true');
    if (ownershipVersion !== undefined) formData.append('ownership_version', String(ownershipVersion));
    for (const file of files) {
      formData.append('attachments', file, file.name);
    }
    return api.postForm<{ id: number }>(`/api/tickets/${ticketId}/replies`, formData);
  },

  async addNote(ticketId: number, body: string, files: File[] = []): Promise<{ id: number }> {
    if (files.length === 0) {
      return api.post<{ id: number }>(`/api/tickets/${ticketId}/notes`, { body });
    }

    const formData = new FormData();
    formData.append('body', body);
    for (const file of files) {
      formData.append('attachments', file, file.name);
    }
    return api.postForm<{ id: number }>(`/api/tickets/${ticketId}/notes`, formData);
  },

  getAttachmentUrl(ticketId: number, attachmentId: number): string {
    return `/api/tickets/${ticketId}/attachments/${attachmentId}`;
  },
};
