export type UserRole = 'customer' | 'agent' | 'manager' | 'admin';

export interface Account {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  must_change_password?: boolean;
}

export interface SessionResponse {
  user: Account | null;
  csrf_token: string;
}

export type TicketPriority = 'low' | 'medium' | 'urgent';

export type TicketStatus = 'open' | 'waiting_on_customer' | 'resolved' | 'closed_inactivity';

export interface SlaMilestone {
  deadline: string; // ISO UTC
  completed_at?: string | null;
  status: 'met' | 'late' | 'overdue' | 'paused' | 'not_applicable' | 'pending';
}

export interface TicketTiming {
  cycle_number: number;
  closure_status?: string | null;
  started_at?: string;
  first_response: SlaMilestone;
  resolution: SlaMilestone;
  previous_cycles: TicketTiming[];
}

export interface TicketAttachment {
  id: number;
  filename: string;
  size_bytes?: number;
}

export interface TicketMessage {
  id: number;
  author_name: string;
  visibility: 'public' | 'private';
  body: string;
  created_at: string;
  attachments: TicketAttachment[];
}

export interface TicketActions {
  claim: boolean;
  transfer: boolean;
  reply: boolean;
  note: boolean;
  priority: boolean;
  wait: boolean;
  reply_and_wait: boolean;
  resolve: boolean;
  reopen: boolean;
}

export interface Ticket {
  id: number;
  subject: string;
  priority: TicketPriority;
  customer_blocked: boolean;
  status: TicketStatus;
  created_at: string;
  closed_at?: string;
  reopen_until?: string;
  customer_name?: string;
  owner_id?: number | null;
  owner_name?: string | null;
  ownership_version?: number;
  waiting_until?: string;
  sla?: TicketTiming;
}

export interface TicketDetail {
  ticket: Ticket;
  messages: TicketMessage[];
  actions: TicketActions;
}

export interface TicketListResult {
  tickets: Ticket[];
  next_before: number | null;
  summary: Record<string, number>;
}

export interface SupportAgent {
  id: number;
  name: string;
  email: string;
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  manager_id?: number | null;
  manager_name?: string | null;
  manager_active?: boolean | null;
}

export interface StaffRoster {
  managers: StaffMember[];
  agents: StaffMember[];
}

export interface HolidayEntry {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface HolidaySchedule {
  today: string;
  holidays: HolidayEntry[];
}

export interface ClosureBucket {
  from: string;
  to: string;
  resolved: number;
  closed_inactivity: number;
}

export interface ResolverTotal {
  staff_id: number;
  name: string;
  resolved: number;
  on_time: number;
}

export interface MissedDeadline {
  ticket_id: number;
  subject: string;
  cycle_number: number;
  milestone: 'first_response' | 'resolution';
  closure_status?: string | null;
  deadline_at: string;
  completed_at?: string | null;
  missed_at: string;
}

export interface SlaReport {
  period: {
    from: string;
    to: string;
    today: string;
  };
  misses: {
    first_response: number;
    resolution: number;
  };
  closures: {
    resolved: { count: number; reopened: number };
    closed_inactivity: { count: number; reopened: number };
  };
  closure_activity: {
    interval_days: number;
    buckets: ClosureBucket[];
  };
  leaderboard: ResolverTotal[];
  notifications: {
    queued: number;
    sent: number;
    failed: number;
    delivery_configured: boolean;
  };
  tickets: MissedDeadline[];
  next_offset: number | null;
}

export interface TicketHistoryEvent {
  id: number;
  occurred_at: string;
  action: string;
  actor_name: string | null;
  details: Record<string, any>;
}

export interface AuditEvent {
  id: number;
  occurred_at: string;
  actor_account_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number;
  details: Record<string, any>;
}
