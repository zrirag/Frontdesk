import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { staffApi } from '../../api/staff';
import { StaffMember, StaffRoster } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  UserPlus,
  RefreshCw,
  Shield,
  UserCheck,
  Share2,
  AlertTriangle,
  Mail,
  Lock,
} from 'lucide-react';

export const StaffManagementView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [roster, setRoster] = useState<StaffRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add staff modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<'agent' | 'manager'>('agent');
  const [addPassword, setAddPassword] = useState('');
  const [addManagerId, setAddManagerId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Move agent modal
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [agentToMove, setAgentToMove] = useState<StaffMember | null>(null);
  const [newManagerId, setNewManagerId] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffApi.list();
      setRoster(data);

      const activeManagers = data.managers.filter((m) => m.is_active);
      if (activeManagers.length > 0 && !addManagerId) {
        setAddManagerId(activeManagers[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load staff roster.');
    } finally {
      setLoading(false);
    }
  }, [addManagerId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (addPassword.length < 15 || addPassword.length > 128) {
      setAddError('Temporary password must be between 15 and 128 characters.');
      return;
    }

    try {
      setAdding(true);
      await staffApi.add({
        name: addName.trim(),
        email: addEmail.trim(),
        role: addRole,
        temporary_password: addPassword,
        manager_id: addRole === 'agent' ? addManagerId : null,
      });

      setAddModalOpen(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      await fetchStaff();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create staff member.');
    } finally {
      setAdding(false);
    }
  };

  const handleMoveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentToMove || !newManagerId) return;
    setMoveError(null);

    try {
      setMoving(true);
      await staffApi.moveAgent(agentToMove.id, newManagerId, agentToMove.manager_id || null);
      setMoveModalOpen(false);
      setAgentToMove(null);
      await fetchStaff();
    } catch (err: any) {
      setMoveError(err.message || 'Failed to move agent.');
    } finally {
      setMoving(false);
    }
  };

  const activeManagers = roster?.managers.filter((m) => m.is_active) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">
            {isAdmin ? 'Staff Management' : 'My Support Team'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Oversee managers, support agents, and organizational team reporting lines.'
              : 'Manage the support agents assigned to your team.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStaff} loading={loading} title="Refresh roster">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button variant="danger" size="sm" onClick={() => setAddModalOpen(true)}>
            <UserPlus className="w-4 h-4" />
            <span>{isAdmin ? 'Add Staff Member' : 'Add Support Agent'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-deepRed text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !roster ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading staff roster…</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Managers Table (Admin only) */}
          {isAdmin && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-navy" />
                  <span>Team Managers ({roster?.managers.length || 0})</span>
                </h2>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-light-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Manager</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roster?.managers.map((manager) => (
                      <tr key={manager.id} className="hover:bg-light-50 transition">
                        <td className="py-3.5 px-4 font-bold text-navy flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                            {manager.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{manager.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">{manager.email}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              manager.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {manager.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Support Agents Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-navy" />
                <span>Support Agents ({roster?.agents.length || 0})</span>
              </h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-light-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Support Agent</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Reports To (Manager)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster?.agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-light-50 transition">
                      <td className="py-3.5 px-4 font-bold text-navy flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{agent.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{agent.email}</td>
                      <td className="py-3.5 px-4">
                        {agent.manager_name ? (
                          <span className="font-medium text-navy">{agent.manager_name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAgentToMove(agent);
                              setNewManagerId(agent.manager_id || (activeManagers[0]?.id ?? null));
                              setMoveError(null);
                              setMoveModalOpen(true);
                            }}
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Reassign</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={isAdmin ? 'Create Staff Account' : 'Add Support Agent'}
        description="Newly created staff accounts receive a temporary password and must choose a permanent password upon first signing in."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleAddStaff} loading={adding}>
              Create Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
          {addError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-deepRed flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-navy mb-1">Full Name</label>
            <input
              type="text"
              required
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3 py-2 bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            />
          </div>

          <div>
            <label className="block font-bold text-navy mb-1">Email Address</label>
            <input
              type="email"
              required
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full px-3 py-2 bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            />
          </div>

          {isAdmin && (
            <div>
              <label className="block font-bold text-navy mb-1">Staff Role</label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as 'agent' | 'manager')}
                className="w-full px-3 py-2 bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
              >
                <option value="agent">Support Agent</option>
                <option value="manager">Team Manager</option>
              </select>
            </div>
          )}

          {addRole === 'agent' && (
            <div>
              <label className="block font-bold text-navy mb-1">Assigned Manager</label>
              <select
                value={addManagerId || ''}
                onChange={(e) => setAddManagerId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
              >
                {activeManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-bold text-navy">Temporary Password</label>
              <span className="text-[10px] text-slate-400">15–128 characters</span>
            </div>
            <input
              type="text"
              required
              value={addPassword}
              onChange={(e) => setAddPassword(e.target.value)}
              placeholder="InitialTempPass123!"
              className="w-full px-3 py-2 font-mono bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            />
          </div>
        </form>
      </Modal>

      {/* Move Agent Modal (Admin only) */}
      <Modal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        title="Reassign Support Agent"
        description={`Assign ${agentToMove?.name || 'this agent'} to a new active manager team.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleMoveAgent} loading={moving}>
              Confirm Reassignment
            </Button>
          </>
        }
      >
        <form onSubmit={handleMoveAgent} className="space-y-4 text-xs">
          {moveError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-deepRed flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{moveError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-navy mb-1">Select New Manager</label>
            <select
              value={newManagerId || ''}
              onChange={(e) => setNewManagerId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-light-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy text-navy"
            >
              {activeManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
