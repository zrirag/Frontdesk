import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketsApi } from '../../api/tickets';
import {
  TicketDetail,
  TicketPriority,
  SupportAgent,
  TicketMessage,
} from '../../types';
import { PriorityBadge, StatusBadge, MilestoneBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { AttachmentPicker } from '../../components/common/AttachmentPicker';
import { formatIstDateTime, formatRelativeTime, isDateInPast } from '../../utils/date';
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  AlertTriangle,
  User,
  CheckCircle,
  FileText,
  Lock,
  MessageSquare,
  Send,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
} from 'lucide-react';

export const TicketDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = parseInt(id || '0', 10);
  const { user, isCustomer, isStaff, canManage } = useAuth();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SLA History expanded state
  const [showHistoryCycles, setShowHistoryCycles] = useState(false);

  // Composer state
  const [composerMode, setComposerMode] = useState<'public' | 'private'>('public');
  const [messageBody, setMessageBody] = useState('');
  const [composerFiles, setComposerFiles] = useState<File[]>([]);
  const [waitForReply, setWaitForReply] = useState(false);
  const [sending, setSending] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // Modals state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);

  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [newPriority, setNewPriority] = useState<TicketPriority>('medium');
  const [changingPriority, setChangingPriority] = useState(false);

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolving, setResolving] = useState(false);

  const [reopening, setReopening] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ticketsApi.getDetail(ticketId);
      setDetail(res);
      setNewPriority(res.ticket.priority);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Load agents for transfer modal
  const openTransferModal = async () => {
    try {
      setTransferModalOpen(true);
      const res = await ticketsApi.getAgents();
      setAgents(res);
      if (res.length > 0) {
        setSelectedAgentId(res[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load agents.');
    }
  };

  const handleClaim = async () => {
    if (!detail) return;
    try {
      setClaiming(true);
      await ticketsApi.claim(ticketId, detail.ticket.ownership_version || 0);
      setClaimModalOpen(false);
      await fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to claim ticket.');
    } finally {
      setClaiming(false);
    }
  };

  const handleTransfer = async () => {
    if (!detail || !selectedAgentId) return;
    try {
      setTransferring(true);
      await ticketsApi.transfer(
        ticketId,
        selectedAgentId,
        detail.ticket.ownership_version || 0,
        transferReason.trim()
      );
      setTransferModalOpen(false);
      setTransferReason('');
      await fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to transfer ticket.');
    } finally {
      setTransferring(false);
    }
  };

  const handleChangePriority = async () => {
    if (!detail) return;
    try {
      setChangingPriority(true);
      await ticketsApi.changePriority(ticketId, newPriority, detail.ticket.priority);
      setPriorityModalOpen(false);
      await fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to change priority.');
    } finally {
      setChangingPriority(false);
    }
  };

  const handleWaitForCustomer = async () => {
    if (!detail) return;
    try {
      setLoading(true);
      await ticketsApi.waitForCustomer(ticketId, detail.ticket.ownership_version || 0);
      await fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to mark waiting.');
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!detail) return;
    try {
      setResolving(true);
      await ticketsApi.resolve(ticketId, detail.ticket.ownership_version || 0);
      setResolveModalOpen(false);
      await fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve ticket.');
    } finally {
      setResolving(false);
    }
  };

  const handleReopen = async () => {
    try {
      setReopening(true);
      await ticketsApi.reopen(ticketId);
      await fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to reopen ticket.');
    } finally {
      setReopening(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    setComposerError(null);

    const body = messageBody.trim();
    if (!body && composerFiles.length === 0) {
      setComposerError('Please write a message or attach a file.');
      return;
    }

    try {
      setSending(true);
      if (composerMode === 'private') {
        await ticketsApi.addNote(ticketId, body, composerFiles);
      } else {
        await ticketsApi.reply(
          ticketId,
          body,
          composerFiles,
          waitForReply,
          detail.ticket.ownership_version
        );
      }

      setMessageBody('');
      setComposerFiles([]);
      setWaitForReply(false);
      await fetchDetail();
    } catch (err: any) {
      setComposerError(err.message || 'Failed to dispatch message.');
    } finally {
      setSending(false);
    }
  };

  if (loading && !detail) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading ticket #{ticketId}…</p>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-deepRed flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-navy">Ticket Not Found or Access Denied</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
        <Button size="sm" variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Workspace</span>
        </Button>
      </div>
    );
  }

  if (!detail) return null;

  const { ticket, messages, actions } = detail;
  const canSendMessages = actions.reply || actions.note || actions.reopen;
  const mayWaitOption = actions.reply_and_wait && composerMode === 'public';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Back & Actions Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-400">#{ticket.id}</span>
            <span className="text-slate-300">·</span>
            <StatusBadge status={ticket.status} isCustomer={isCustomer} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={fetchDetail} loading={loading} title="Refresh details">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>

          {/* Dynamic Actions */}
          {actions.claim && (
            <Button size="sm" variant="primary" onClick={() => setClaimModalOpen(true)}>
              Claim Ticket
            </Button>
          )}

          {actions.transfer && (
            <Button size="sm" variant="secondary" onClick={openTransferModal}>
              <Share2 className="w-3.5 h-3.5" />
              <span>{ticket.owner_id ? 'Transfer' : 'Assign'}</span>
            </Button>
          )}

          {actions.priority && (
            <Button size="sm" variant="secondary" onClick={() => setPriorityModalOpen(true)}>
              Change Priority
            </Button>
          )}

          {actions.wait && (
            <Button size="sm" variant="secondary" onClick={handleWaitForCustomer}>
              Wait for Customer
            </Button>
          )}

          {actions.resolve && (
            <Button size="sm" variant="danger" onClick={() => setResolveModalOpen(true)}>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark Resolved</span>
            </Button>
          )}

          {actions.reopen && (
            <Button size="sm" variant="danger" onClick={handleReopen} loading={reopening}>
              Reopen Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Global Error Notice if any */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-deepRed text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Ticket Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2 text-xs text-slate-500">
            <span>
              Opened on <strong className="text-navy">{formatIstDateTime(ticket.created_at)}</strong>
            </span>
            <span>·</span>
            <span>
              Reporter: <strong className="text-navy">{ticket.customer_name || 'Customer'}</strong>
            </span>
            <span>·</span>
            <span>
              Assignee:{' '}
              <strong className={ticket.owner_name ? 'text-navy' : 'text-slate-400 italic'}>
                {ticket.owner_name || 'Unassigned'}
              </strong>
            </span>
          </div>

          {ticket.customer_blocked && (
            <div className="mt-3 p-3 rounded-xl bg-deepRed/10 border border-deepRed/25 text-deepRed text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Customer reported complete blocker on operations (Escalated to Urgent Priority).</span>
            </div>
          )}

          {/* Inactivity warning */}
          {ticket.waiting_until && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                Ticket is waiting on customer reply. Closes automatically for inactivity on{' '}
                <strong>{formatIstDateTime(ticket.waiting_until)}</strong> (45 working hours).
              </span>
            </div>
          )}

          {/* Reopening period notice */}
          {ticket.reopen_until && (
            <div className="mt-3 p-3 rounded-xl bg-light-200 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  {isDateInPast(ticket.reopen_until) ? (
                    'The seven-day reopening window has ended. Please open a new ticket for further assistance.'
                  ) : (
                    <>
                      Can be reopened by customer until{' '}
                      <strong>{formatIstDateTime(ticket.reopen_until)}</strong>.
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* SLA Commitments Panel (Staff View) */}
        {ticket.sla && (
          <div className="pt-4 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-light-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-deepRed" />
                  <span>SLA Commitments (IST)</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Cycle #{ticket.sla.cycle_number}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* First Response */}
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-600">First Public Response</span>
                    <MilestoneBadge status={ticket.sla.first_response.status} />
                  </div>
                  <p className="text-xs font-bold text-navy">
                    Due: {formatIstDateTime(ticket.sla.first_response.deadline)}
                  </p>
                  {ticket.sla.first_response.completed_at && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Completed: {formatIstDateTime(ticket.sla.first_response.completed_at)}
                    </p>
                  )}
                </div>

                {/* Resolution */}
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-600">Resolution</span>
                    <MilestoneBadge status={ticket.sla.resolution.status} />
                  </div>
                  <p className="text-xs font-bold text-navy">
                    Due: {formatIstDateTime(ticket.sla.resolution.deadline)}
                  </p>
                  {ticket.sla.resolution.completed_at && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Completed: {formatIstDateTime(ticket.sla.resolution.completed_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* Historical SLA cycles if present */}
              {ticket.sla.previous_cycles && ticket.sla.previous_cycles.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHistoryCycles(!showHistoryCycles)}
                    className="flex items-center gap-1.5 text-xs font-bold text-deepRed hover:underline"
                  >
                    <span>
                      {showHistoryCycles ? 'Hide' : 'View'} {ticket.sla.previous_cycles.length} Previous SLA
                      Cycle(s)
                    </span>
                    {showHistoryCycles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showHistoryCycles && (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {ticket.sla.previous_cycles.map((cycle, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-white/70 border border-slate-200 text-xs">
                          <p className="font-bold text-navy">
                            Cycle #{cycle.cycle_number} ·{' '}
                            {cycle.closure_status === 'resolved' ? 'Resolved' : 'Closed for Inactivity'}
                          </p>
                          <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] text-slate-500">
                            <div>First response: {cycle.first_response.status}</div>
                            <div>Resolution: {cycle.resolution.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Conversation & Updates</span>
            <span className="text-xs font-normal text-slate-400">({messages.length})</span>
          </h2>
        </div>

        <div className="space-y-3">
          {messages.map((msg: TicketMessage) => {
            const isPrivate = msg.visibility === 'private';
            return (
              <div
                key={msg.id}
                className={`p-5 rounded-2xl border transition duration-150 ${
                  isPrivate
                    ? 'bg-amber-50/80 border-amber-200 shadow-2xs'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isPrivate ? 'bg-amber-600 text-white' : 'bg-navy text-white'
                      }`}
                    >
                      {msg.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-navy">{msg.author_name}</span>
                        {isPrivate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200/60 text-amber-900 border border-amber-300">
                            <Lock className="w-2.5 h-2.5" />
                            Internal Private Note
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-light-300 text-slate-600">
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400" title={formatIstDateTime(msg.created_at)}>
                    {formatRelativeTime(msg.created_at)}
                  </span>
                </div>

                {/* Body Text */}
                <div className="text-xs leading-relaxed text-navy whitespace-pre-wrap">{msg.body}</div>

                {/* Message Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    {msg.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={ticketsApi.getAttachmentUrl(ticket.id, att.id)}
                        download={att.filename}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-light hover:bg-light-300 border border-slate-200 text-navy transition shadow-2xs font-medium"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>{att.filename}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Composer */}
      {canSendMessages ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 space-y-4">
          {composerError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-deepRed text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{composerError}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* Tab switch between Public and Private for staff */}
            {isStaff && actions.note ? (
              <div className="flex items-center p-1 bg-light-200 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setComposerMode('public')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    composerMode === 'public'
                      ? 'bg-white text-navy shadow-xs'
                      : 'text-slate-500 hover:text-navy'
                  }`}
                >
                  Public Staff Reply
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode('private')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                    composerMode === 'private'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-amber-800'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Private Team Note</span>
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold text-navy">Your Reply to Support</span>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="space-y-3">
            <textarea
              rows={4}
              maxLength={8000}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder={
                composerMode === 'private'
                  ? 'Add internal investigation notes, debug logs, or colleague instructions (never visible to customer)…'
                  : 'Type your message to the customer or support team…'
              }
              className={`w-full p-3.5 text-xs rounded-xl border focus:ring-2 focus:outline-none transition ${
                composerMode === 'private'
                  ? 'bg-amber-50/50 border-amber-300 focus:ring-amber-500 text-navy'
                  : 'bg-light-50 border-slate-300 focus:ring-navy text-navy'
              }`}
            />

            {/* Optional "Send reply and wait for customer" checkbox */}
            {mayWaitOption && (
              <label className="flex items-center gap-2 text-xs font-semibold text-navy cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={waitForReply}
                  onChange={(e) => setWaitForReply(e.target.checked)}
                  className="rounded border-slate-300 text-navy focus:ring-navy"
                />
                <span>Send reply and pause SLA timer (Wait for customer reply)</span>
              </label>
            )}

            {/* Attachments */}
            <AttachmentPicker files={composerFiles} onChange={setComposerFiles} disabled={sending} />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                {messageBody.length}/8000 characters
              </span>
              <Button
                type="submit"
                variant={composerMode === 'private' ? 'secondary' : 'danger'}
                loading={sending}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{composerMode === 'private' ? 'Save Private Note' : 'Send Reply'}</span>
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-light-200 border border-slate-200 text-center text-xs text-slate-500">
          This ticket is closed and the reopening window has ended. Messages are locked.
        </div>
      )}

      {/* Claim Ticket Modal */}
      <Modal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        title="Claim Ticket Assignment"
        description="Taking ownership will assign this ticket directly to you, making you responsible for meeting response and resolution SLA deadlines."
        footer={
          <>
            <Button variant="ghost" onClick={() => setClaimModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleClaim} loading={claiming}>
              Confirm Claim
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Ticket #{ticket.id}: <strong>{ticket.subject}</strong>
        </p>
      </Modal>

      {/* Transfer / Assign Ticket Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title={ticket.owner_id ? 'Transfer Ticket' : 'Assign Ticket'}
        description="Select an active support agent to take over ownership of this ticket."
        footer={
          <>
            <Button variant="ghost" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleTransfer} loading={transferring}>
              Save Assignment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy mb-1">Target Support Agent</label>
            <select
              value={selectedAgentId || ''}
              onChange={(e) => setSelectedAgentId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Transfer Reason (Optional)</label>
            <textarea
              rows={3}
              maxLength={500}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Explain why this ticket is being reassigned…"
              className="w-full px-3 py-2 text-xs bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            />
          </div>
        </div>
      </Modal>

      {/* Change Priority Modal */}
      <Modal
        isOpen={priorityModalOpen}
        onClose={() => setPriorityModalOpen(false)}
        title="Change Ticket Priority"
        description="Adjusting priority alters SLA deadline targets. Upgrades recalculate deadlines immediately, while downgrades retain promised times."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPriorityModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleChangePriority} loading={changingPriority}>
              Update Priority
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {(['low', 'medium', 'urgent'] as TicketPriority[]).map((p) => (
            <label
              key={p}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                newPriority === p
                  ? 'bg-light-200 border-navy ring-1 ring-navy font-bold text-navy'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="priorityOption"
                  checked={newPriority === p}
                  onChange={() => setNewPriority(p)}
                  className="text-navy focus:ring-navy"
                />
                <span className="capitalize">{p} Priority</span>
              </div>
              <PriorityBadge priority={p} />
            </label>
          ))}
        </div>
      </Modal>

      {/* Mark Resolved Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Mark Ticket as Resolved?"
        description="Frontdesk will record your resolution timestamp against the SLA metrics and initiate the 7-day customer reopening window."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleResolve} loading={resolving}>
              Confirm Resolution
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Make sure all customer inquiries have been addressed before resolving.
        </p>
      </Modal>
    </div>
  );
};
