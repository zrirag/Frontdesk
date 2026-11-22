import { api } from './client';
import { AuditEvent, SlaReport, TicketHistoryEvent } from '../types';

export const reportsApi = {
  async getSlaReport(params?: {
    from?: string;
    to?: string;
    milestone?: string;
    offset?: number;
  }): Promise<SlaReport> {
    return api.get<SlaReport>('/api/reports/sla', { params });
  },

  async getTicketHistory(ticketId: number, before?: number): Promise<{ events: TicketHistoryEvent[]; next_before: number | null }> {
    const params: Record<string, string> = {};
    if (before) params.before = String(before);
    return api.get<{ events: TicketHistoryEvent[]; next_before: number | null }>(`/api/reports/tickets/${ticketId}/history`, { params });
  },

  async getRecentAudit(): Promise<{ events: AuditEvent[] }> {
    return api.get<{ events: AuditEvent[] }>('/api/audit');
  },
};
