import React, { useState, useEffect, useCallback } from 'react';
import { holidaysApi } from '../../api/holidays';
import { HolidayEntry, HolidaySchedule } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatIstDateOnly } from '../../utils/date';
import { Calendar, Plus, Trash2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const HolidayCalendarView: React.FC = () => {
  const [schedule, setSchedule] = useState<HolidaySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Add holiday modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Remove confirmation modal
  const [holidayToRemove, setHolidayToRemove] = useState<HolidayEntry | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await holidaysApi.list();
      setSchedule(data);
      if (!newDate) {
        setNewDate(data.today);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load holidays.');
    } finally {
      setLoading(false);
    }
  }, [newDate]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newDate) {
      setAddError('Please select a date.');
      return;
    }
    if (!newName.trim()) {
      setAddError('Please enter a holiday title.');
      return;
    }

    try {
      setAdding(true);
      const res = await holidaysApi.add(newDate, newName.trim());
      setAddModalOpen(false);
      setNewName('');
      setToast(
        res.deadlines_updated === 0
          ? 'Holiday added to business calendar.'
          : `Holiday added! Updated ${res.deadlines_updated} active SLA deadline(s).`
      );
      await fetchHolidays();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add holiday.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveHoliday = async () => {
    if (!holidayToRemove) return;
    try {
      setRemoving(true);
      const res = await holidaysApi.remove(holidayToRemove.date);
      setHolidayToRemove(null);
      setToast(
        res.deadlines_updated === 0
          ? 'Holiday removed from calendar.'
          : `Holiday removed! Recalculated ${res.deadlines_updated} active SLA deadline(s).`
      );
      await fetchHolidays();
    } catch (err: any) {
      setError(err.message || 'Failed to remove holiday.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">Holiday Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure official business holidays. Working hours and SLA deadlines automatically pause during holidays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchHolidays} loading={loading} title="Refresh holidays">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button variant="danger" size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
          </Button>
        </div>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-deepRed text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Holidays List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading && !schedule ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading holiday schedule…</p>
          </div>
        ) : schedule?.holidays.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-navy">No Upcoming Holidays</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add upcoming business holidays so that SLAs and response promises adjust accurately.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-light-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date (IST)</th>
                <th className="py-3 px-4">Holiday Title</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule?.holidays.map((h) => (
                <tr key={h.date} className="hover:bg-light-50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-navy">
                    {formatIstDateOnly(h.date)}
                    <span className="text-[10px] text-slate-400 font-normal ml-2">({h.date})</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-navy">{h.name}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setHolidayToRemove(h)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-deepRed hover:bg-red-50 transition"
                      title="Remove holiday"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Holiday Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Business Holiday"
        description="Choose a date and label. All pending active SLA deadlines that cross this date will automatically be moved forward."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleAddHoliday} loading={adding}>
              Add to Calendar
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddHoliday} className="space-y-4 text-xs">
          {addError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-deepRed flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-navy mb-1">Holiday Date</label>
            <input
              type="date"
              required
              min={schedule?.today}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            />
          </div>

          <div>
            <label className="block font-bold text-navy mb-1">Holiday Label</label>
            <input
              type="text"
              required
              maxLength={120}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Republic Day"
              className="w-full px-3 py-2 bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            />
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={!!holidayToRemove}
        onClose={() => setHolidayToRemove(null)}
        title="Remove Holiday?"
        description={`Are you sure you want to remove "${holidayToRemove?.name}" (${holidayToRemove?.date})? Active deadlines will be recalculated accordingly.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setHolidayToRemove(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRemoveHoliday} loading={removing}>
              Remove Holiday
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Historical past deadlines and completed milestones retain their recorded timestamps.
        </p>
      </Modal>
    </div>
  );
};
