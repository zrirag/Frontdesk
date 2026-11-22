import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/reports';
import { SlaReport, TicketHistoryEvent } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatIstDateTime, formatIstDateOnly } from '../../utils/date';
import {
  BarChart3,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  Mail,
  Trophy,
  History,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const navigate = useNavigate();

  const [report, setReport] = useState<SlaReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [milestone, setMilestone] = useState<'all' | 'first_response' | 'resolution'>('all');

  // Ticket history modal
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [historyEvents, setHistoryEvents] = useState<TicketHistoryEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { milestone };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const data = await reportsApi.getSlaReport(params);
      setReport(data);
      if (!fromDate) setFromDate(data.period.from);
      if (!toDate) setToDate(data.period.to);
    } catch (err: any) {
      setError(err.message || 'Failed to load SLA report.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, milestone]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const viewTicketHistory = async (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await reportsApi.getTicketHistory(ticketId);
      setHistoryEvents(res.events);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to load ticket audit history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">Reports & SLA Performance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit compliance, investigate deadline breaches, review staff closure efficiency, and trace ticket history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReport} loading={loading} title="Refresh report">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Date Filter & Milestone Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-navy">Period:</span>
            <input
              type="date"
              value={fromDate}
              max={report?.period.today}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              max={report?.period.today}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            />
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="font-bold text-navy">Milestone:</span>
            <select
              value={milestone}
              onChange={(e) => setMilestone(e.target.value as any)}
              className="px-2.5 py-1.5 bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            >
              <option value="all">All Milestones</option>
              <option value="first_response">First Response Only</option>
              <option value="resolution">Resolution Only</option>
            </select>
          </div>
        </div>

        <Button size="sm" variant="primary" onClick={fetchReport}>
          Apply Filter
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-deepRed text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !report ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Generating analytics…</p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* First response misses */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Missed First Response</span>
                <Clock className="w-4 h-4 text-deepRed" />
              </div>
              <div className="text-2xl font-black text-deepRed tracking-tight">
                {report.misses.first_response}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">SLA response breaches</p>
            </div>

            {/* Resolution misses */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Missed Resolution</span>
                <AlertTriangle className="w-4 h-4 text-deepRed" />
              </div>
              <div className="text-2xl font-black text-deepRed tracking-tight">
                {report.misses.resolution}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">SLA resolution breaches</p>
            </div>

            {/* Resolved closures */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Resolved Cycles</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-navy tracking-tight">
                {report.closures.resolved.count}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {report.closures.resolved.reopened} reopened
              </p>
            </div>

            {/* Inactivity closures */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Inactivity Closures</span>
                <Hourglass className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-navy tracking-tight">
                {report.closures.closed_inactivity.count}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {report.closures.closed_inactivity.reopened} reopened
              </p>
            </div>
          </div>

          {/* Closure Activity Visualization */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-navy">Closure Activity Over Time</h3>
                <p className="text-[11px] text-slate-400">
                  {report.closure_activity.interval_days === 1
                    ? 'Daily totals (IST)'
                    : `${report.closure_activity.interval_days}-day intervals (IST)`}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-navy">
                  <span className="w-3 h-3 rounded-sm bg-navy"></span> Resolved
                </span>
                <span className="flex items-center gap-1.5 font-medium text-amber-700">
                  <span className="w-3 h-3 rounded-sm bg-amber-500"></span> Inactivity Closed
                </span>
              </div>
            </div>

            {/* Bar Chart Container */}
            {report.closure_activity.buckets.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No closure activity in selected period.</p>
            ) : (
              <div className="pt-4 overflow-x-auto">
                <div className="min-w-[500px] flex items-end gap-3 h-44 border-b border-slate-200 pb-2">
                  {report.closure_activity.buckets.map((b, i) => {
                    const total = b.resolved + b.closed_inactivity;
                    const maxVal = Math.max(
                      1,
                      ...report.closure_activity.buckets.map((item) => item.resolved + item.closed_inactivity)
                    );
                    const resolvedPct = Math.round((b.resolved / maxVal) * 100);
                    const inactivePct = Math.round((b.closed_inactivity / maxVal) * 100);

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">
                          {total}
                        </div>
                        <div className="w-full max-w-[28px] h-32 flex flex-col justify-end gap-0.5 rounded-t-sm overflow-hidden bg-light-200">
                          {b.closed_inactivity > 0 && (
                            <div
                              style={{ height: `${inactivePct}%` }}
                              title={`Closed for inactivity: ${b.closed_inactivity}`}
                              className="w-full bg-amber-500"
                            />
                          )}
                          {b.resolved > 0 && (
                            <div
                              style={{ height: `${resolvedPct}%` }}
                              title={`Resolved: ${b.resolved}`}
                              className="w-full bg-navy"
                            />
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 truncate w-full text-center">
                          {formatIstDateOnly(b.from)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Grid: Leaderboard & Notification Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Staff Resolver Leaderboard */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Staff Resolution Leaderboard</span>
                </h3>
              </div>
              {report.leaderboard.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">No resolutions recorded in this period.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-light-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Staff Member</th>
                      <th className="py-2.5 px-4 text-center">Resolved</th>
                      <th className="py-2.5 px-4 text-center">On Time</th>
                      <th className="py-2.5 px-4 text-right">On-Time %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.leaderboard.map((staff, idx) => {
                      const rate =
                        staff.resolved > 0 ? Math.round((staff.on_time / staff.resolved) * 100) : 100;
                      return (
                        <tr key={staff.staff_id} className="hover:bg-light-50 transition">
                          <td className="py-3 px-4 font-bold text-navy flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span>{staff.name}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-navy">{staff.resolved}</td>
                          <td className="py-3 px-4 text-center font-semibold text-emerald-700">{staff.on_time}</td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rate >= 90
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : rate >= 70
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-red-50 text-deepRed'
                              }`}
                            >
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Email Notification Status */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>Notification Worker Outbox</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-light-50 border border-slate-200">
                  <span className="font-semibold text-slate-600">Queued in Dispatch</span>
                  <span className="font-bold text-navy text-sm">{report.notifications.queued}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-800">
                  <span className="font-semibold">Successfully Sent</span>
                  <span className="font-bold text-sm">{report.notifications.sent}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/60 border border-red-200 text-deepRed">
                  <span className="font-semibold">Failed Attempts</span>
                  <span className="font-bold text-sm">{report.notifications.failed}</span>
                </div>
              </div>
              <div className="pt-2 text-[11px] text-slate-400">
                Worker status:{' '}
                {report.notifications.delivery_configured ? (
                  <strong className="text-emerald-700">SMTP Configured</strong>
                ) : (
                  <strong className="text-amber-700">SMTP Offline / Unconfigured</strong>
                )}
              </div>
            </div>
          </div>

          {/* Missed SLA Deadlines Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-deepRed" />
                <span>Missed Deadlines Log ({report.tickets.length})</span>
              </h3>
            </div>

            {report.tickets.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400">
                No missed SLA deadlines recorded in this period. Great performance!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-light-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Ticket</th>
                      <th className="py-2.5 px-4">Milestone</th>
                      <th className="py-2.5 px-4">Deadline (IST)</th>
                      <th className="py-2.5 px-4">Breached / Missed At (IST)</th>
                      <th className="py-2.5 px-4 text-right">Audit Trail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.tickets.map((miss, idx) => (
                      <tr key={idx} className="hover:bg-light-50 transition">
                        <td className="py-3 px-4 font-bold text-navy">
                          <button
                            onClick={() => navigate(`/tickets/${miss.ticket_id}`)}
                            className="hover:text-deepRed hover:underline text-left"
                          >
                            #{miss.ticket_id}: {miss.subject}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-medium capitalize">
                          {miss.milestone === 'first_response' ? 'First Response' : 'Resolution'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {formatIstDateTime(miss.deadline_at)}
                        </td>
                        <td className="py-3 px-4 text-deepRed font-mono font-bold">
                          {formatIstDateTime(miss.missed_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewTicketHistory(miss.ticket_id)}
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Audit History</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Ticket Audit History Modal */}
      <Modal
        isOpen={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        title={`Audit Trail for Ticket #${selectedTicketId}`}
        description="Append-only cryptographic audit event log for compliance tracking."
        maxWidth="xl"
      >
        {historyLoading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Retrieving audit events…</p>
          </div>
        ) : historyError ? (
          <div className="p-3 rounded-xl bg-red-50 text-deepRed text-xs">{historyError}</div>
        ) : historyEvents.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">No events recorded for this ticket.</p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {historyEvents.map((event) => (
              <div key={event.id} className="p-3.5 rounded-xl bg-light-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy font-mono">#{event.id} · {event.action}</span>
                  <span className="text-[11px] text-slate-400">{formatIstDateTime(event.occurred_at)}</span>
                </div>
                <p className="text-slate-600">
                  Actor: <strong className="text-navy">{event.actor_name || 'System / Automated Worker'}</strong>
                </p>
                {event.details && Object.keys(event.details).length > 0 && (
                  <pre className="p-2 rounded-lg bg-navy-900 text-light text-[10px] font-mono overflow-x-auto">
                    {JSON.stringify(event.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
