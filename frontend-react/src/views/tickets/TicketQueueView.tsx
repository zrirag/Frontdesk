import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsApi } from '../../api/tickets';
import { Ticket, TicketPriority, TicketStatus } from '../../types';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { AttachmentPicker } from '../../components/common/AttachmentPicker';
import { formatIstDateTime, formatRelativeTime } from '../../utils/date';
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Layers,
  Inbox,
  CheckCircle2,
  Hourglass,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';

export const TicketQueueView: React.FC = () => {
  const { user, isCustomer, canManage } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Current scope: 'mine' | 'queue' | 'all'
  const scope = searchParams.get('scope') || (isCustomer ? 'mine' : 'queue');
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New ticket modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBlocked, setNewBlocked] = useState<boolean>(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchTickets = useCallback(
    async (append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const before = append ? nextBefore : null;
        const result = await ticketsApi.list(scope, filter, before);

        if (append) {
          setTickets((prev) => [...prev, ...result.tickets]);
        } else {
          setTickets(result.tickets);
        }
        setNextBefore(result.next_before);
        setSummary(result.summary);
      } catch (err: any) {
        setError(err.message || 'Failed to load tickets.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [scope, filter, nextBefore]
  );

  useEffect(() => {
    fetchTickets(false);
  }, [scope, filter]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newSubject.trim()) {
      setCreateError('Please enter a ticket subject.');
      return;
    }
    if (!newDescription.trim()) {
      setCreateError('Please describe the problem.');
      return;
    }

    try {
      setCreating(true);
      const res = await ticketsApi.create({
        subject: newSubject.trim(),
        description: newDescription.trim(),
        customer_blocked: newBlocked,
        attachments: newFiles,
      });

      setNewModalOpen(false);
      setNewSubject('');
      setNewDescription('');
      setNewBlocked(false);
      setNewFiles([]);

      // Navigate to created ticket
      navigate(`/tickets/${res.id}`);
    } catch (err: any) {
      setCreateError(err.message || 'Could not submit ticket.');
    } finally {
      setCreating(false);
    }
  };

  const getScopeTitle = () => {
    if (isCustomer) return 'My Support Requests';
    switch (scope) {
      case 'queue':
        return 'Unassigned Queue';
      case 'mine':
        return 'Assigned to Me';
      case 'all':
        return 'All Organization Tickets';
      default:
        return 'Tickets';
    }
  };

  const filterCards = [
    { key: 'all', label: 'All Tickets', icon: Layers, count: summary['all'] ?? 0, color: 'text-navy' },
    { key: 'open', label: 'Open', icon: Inbox, count: summary['open'] ?? 0, color: 'text-navy-600' },
    {
      key: 'waiting',
      label: isCustomer ? 'Needs Your Reply' : 'Waiting on Customer',
      icon: Hourglass,
      count: summary['waiting'] ?? 0,
      color: 'text-amber-600',
    },
    ...(!isCustomer
      ? [{ key: 'overdue', label: 'Overdue SLA', icon: AlertTriangle, count: summary['overdue'] ?? 0, color: 'text-deepRed' }]
      : []),
    ...(scope !== 'queue'
      ? [{ key: 'closed', label: 'Closed / Resolved', icon: CheckCircle2, count: summary['closed'] ?? 0, color: 'text-slate-500' }]
      : []),
  ];

  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.id.toString().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.customer_name?.toLowerCase().includes(q) ||
      t.owner_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">{getScopeTitle()}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCustomer
              ? 'Track issues, view response deadlines, and communicate with support.'
              : 'Review queue status, meet SLA promises, and manage assignments.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTickets(false)}
            loading={loading}
            title="Refresh tickets"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {isCustomer && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setNewModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Filter Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {filterCards.map((card) => {
          const isSelected = filter === card.key;
          const IconComponent = card.icon;
          return (
            <button
              key={card.key}
              onClick={() => setFilter(card.key)}
              className={`p-4 rounded-2xl border text-left transition duration-150 relative overflow-hidden select-none ${
                isSelected
                  ? 'bg-white border-deepRed shadow-md ring-2 ring-deepRed/15'
                  : 'bg-white hover:bg-light-100 border-slate-200 shadow-2xs'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-8 h-8 bg-deepRed/10 rounded-bl-2xl flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-deepRed" />
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 truncate max-w-[110px]">
                  {card.label}
                </span>
                <IconComponent className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-2xl font-black text-navy tracking-tight">{card.count}</div>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by subject, #ID, or name…"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-light-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy text-navy placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500">
            Showing <strong className="text-navy">{filteredTickets.length}</strong> tickets
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-deepRed text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => fetchTickets(false)}>
            Try again
          </Button>
        </div>
      )}

      {/* Tickets Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading && tickets.length === 0 ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading tickets…</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-light-300 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-navy">No tickets found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {filter !== 'all'
                ? 'No tickets match the selected filter.'
                : scope === 'queue'
                ? 'All tickets are claimed! The unassigned queue is currently clear.'
                : 'No tickets in this workspace.'}
            </p>
            {filter !== 'all' && (
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setFilter('all')}>
                Show all tickets
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-light-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Status & Priority</th>
                  {!isCustomer && <th className="py-3 px-4">Customer & Assignee</th>}
                  {!isCustomer && <th className="py-3 px-4">SLA Deadline (IST)</th>}
                  <th className="py-3 px-4 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTickets.map((ticket) => {
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="hover:bg-light-50 cursor-pointer transition duration-75 group"
                    >
                      {/* Ticket Number & Subject */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono font-bold text-slate-400 group-hover:text-deepRed transition">
                            #{ticket.id}
                          </span>
                          <div>
                            <p className="font-bold text-navy group-hover:text-deepRed transition line-clamp-1">
                              {ticket.subject}
                            </p>
                            {ticket.customer_blocked && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-deepRed mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                Work Blocker Reported
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status & Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={ticket.status} isCustomer={isCustomer} />
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                      </td>

                      {/* Customer & Assignee */}
                      {!isCustomer && (
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="text-navy font-medium truncate max-w-[140px]">
                              {ticket.customer_name || 'Customer'}
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="truncate max-w-[130px]">
                                {ticket.owner_name ? ticket.owner_name : 'Unassigned'}
                              </span>
                            </p>
                          </div>
                        </td>
                      )}

                      {/* SLA Deadline (IST) */}
                      {!isCustomer && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {ticket.sla ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Resp:</span>
                                <span
                                  className={`text-xs font-semibold ${
                                    ticket.sla.first_response.status === 'overdue' ||
                                    ticket.sla.first_response.status === 'late'
                                      ? 'text-deepRed'
                                      : 'text-navy'
                                  }`}
                                >
                                  {formatIstDateTime(ticket.sla.first_response.deadline)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Reso:</span>
                                <span
                                  className={`text-xs font-semibold ${
                                    ticket.sla.resolution.status === 'overdue' ||
                                    ticket.sla.resolution.status === 'late'
                                      ? 'text-deepRed'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {formatIstDateTime(ticket.sla.resolution.deadline)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* Updated Date */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-500">
                        <span>{formatRelativeTime(ticket.created_at)}</span>
                        <ArrowRight className="w-3.5 h-3.5 inline ml-2 opacity-0 group-hover:opacity-100 text-deepRed transition" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Pagination */}
        {nextBefore && (
          <div className="p-4 bg-light-50 border-t border-slate-200 text-center">
            <Button
              variant="outline"
              size="sm"
              loading={loadingMore}
              onClick={() => fetchTickets(true)}
            >
              Load Older Tickets
            </Button>
          </div>
        )}
      </div>

      {/* New Ticket Modal (Customer Only) */}
      <Modal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Open New Support Ticket"
        description="Describe your issue with Arvo Systems. Our support engineers respond according to our SLA commitments."
        maxWidth="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewModalOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleCreateTicket} loading={creating}>
              Submit Ticket
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-deepRed text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Subject</label>
            <input
              type="text"
              required
              maxLength={180}
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. Cannot connect to Arvo gateway from Mumbai datacenter"
              className="w-full px-3.5 py-2 text-sm bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Problem Description</label>
            <textarea
              required
              rows={5}
              maxLength={8000}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Provide complete details, error codes, affected endpoints, and steps to reproduce…"
              className="w-full px-3.5 py-2 text-sm bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy placeholder:text-slate-400"
            />
          </div>

          {/* Work Blocker Question (Determines Priority) */}
          <div className="p-4 rounded-xl bg-light-200 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-navy">
              Can you continue working or is this completely blocking operations?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  !newBlocked
                    ? 'bg-white border-navy ring-1 ring-navy text-navy font-bold'
                    : 'bg-white/60 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="blocked"
                  checked={!newBlocked}
                  onChange={() => setNewBlocked(false)}
                  className="text-navy focus:ring-navy"
                />
                <span>Yes, I can work (Medium Priority)</span>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  newBlocked
                    ? 'bg-red-50 border-deepRed ring-1 ring-deepRed text-deepRed font-bold'
                    : 'bg-white/60 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="blocked"
                  checked={newBlocked}
                  onChange={() => setNewBlocked(true)}
                  className="text-deepRed focus:ring-deepRed"
                />
                <span>No, I am blocked (Urgent Priority)</span>
              </label>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs font-bold text-navy mb-1">Attachments</label>
            <AttachmentPicker files={newFiles} onChange={setNewFiles} disabled={creating} />
          </div>
        </form>
      </Modal>
    </div>
  );
};
