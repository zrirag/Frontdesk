import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Inbox,
  CheckCircle2,
  Layers,
  Users,
  Calendar,
  BarChart3,
  LogOut,
  Menu,
  X,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, isCustomer, canManage, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await logout();
      navigate('/login');
    } finally {
      setSigningOut(false);
    }
  };

  const roleLabel = {
    customer: 'Customer',
    agent: 'Support Agent',
    manager: 'Team Manager',
    admin: 'Administrator',
  }[user?.role || 'customer'];

  // Current scope for active queue highlighting
  const searchParams = new URLSearchParams(location.search);
  const currentScope = searchParams.get('scope') || (isCustomer ? 'mine' : 'queue');

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
      isActive
        ? 'bg-deepRed text-white shadow-md shadow-deepRed/20'
        : 'text-slate-300 hover:text-white hover:bg-navy-800'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy text-white select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-deepRed flex items-center justify-center font-bold text-white shadow-md shadow-deepRed/25">
            FD
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Frontdesk</h1>
            <p className="text-[11px] text-slate-400 font-medium">Arvo Systems Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
          </div>
          <div className="space-y-1">
            {isCustomer ? (
              <NavLink
                to="/?scope=mine"
                onClick={() => setMobileMenuOpen(false)}
                className={() => navItemClass(location.pathname === '/' && currentScope === 'mine')}
              >
                <Inbox className="w-4 h-4" />
                <span>My Requests</span>
              </NavLink>
            ) : (
              <>
                <NavLink
                  to="/?scope=queue"
                  onClick={() => setMobileMenuOpen(false)}
                  className={() => navItemClass(location.pathname === '/' && currentScope === 'queue')}
                >
                  <Inbox className="w-4 h-4" />
                  <span>Unassigned Queue</span>
                </NavLink>

                <NavLink
                  to="/?scope=mine"
                  onClick={() => setMobileMenuOpen(false)}
                  className={() => navItemClass(location.pathname === '/' && currentScope === 'mine')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Assigned to Me</span>
                </NavLink>

                {canManage && (
                  <NavLink
                    to="/?scope=all"
                    onClick={() => setMobileMenuOpen(false)}
                    className={() => navItemClass(location.pathname === '/' && currentScope === 'all')}
                  >
                    <Layers className="w-4 h-4" />
                    <span>All Tickets</span>
                  </NavLink>
                )}
              </>
            )}
          </div>
        </div>

        {canManage && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Operations
            </div>
            <div className="space-y-1">
              <NavLink
                to="/staff"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Users className="w-4 h-4" />
                <span>Staff Management</span>
              </NavLink>

              <NavLink
                to="/holidays"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Calendar className="w-4 h-4" />
                <span>Holiday Calendar</span>
              </NavLink>

              <NavLink
                to="/reports"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports & SLA</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* Support Hours Banner in Sidebar */}
      <div className="px-4 py-3 mx-4 mb-4 rounded-xl bg-navy-800/80 border border-navy-700/60 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
          <Clock className="w-3.5 h-3.5 text-deepRed" />
          <span>Support Hours</span>
        </div>
        <p className="text-[11px] text-slate-400">Mon–Fri · 09:30–18:30 IST</p>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-navy-800 bg-navy-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-700 text-light flex items-center justify-center font-bold text-xs shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          title="Sign out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-deepRed hover:bg-navy-800 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-light overflow-hidden font-sans">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-full shrink-0 shadow-xl border-r border-navy-800">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-navy hover:bg-light transition"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-navy text-sm hidden sm:inline">Frontdesk</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-light-300 text-slate-700">
                {isCustomer ? 'Customer Portal' : 'Support Console'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-light-200 border border-slate-200 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">System Online</span>
              <span className="text-slate-400">·</span>
              <span className="text-[11px] text-slate-500">IST Zone</span>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-navy leading-none">{user?.name}</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{user?.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto bg-light p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
