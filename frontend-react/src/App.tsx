import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AuthPage } from './views/auth/AuthPage';
import { TicketQueueView } from './views/tickets/TicketQueueView';
import { TicketDetailView } from './views/tickets/TicketDetailView';
import { StaffManagementView } from './views/staff/StaffManagementView';
import { HolidayCalendarView } from './views/holidays/HolidayCalendarView';
import { ReportsView } from './views/reports/ReportsView';
import { RefreshCw } from 'lucide-react';

// Handles backward compatibility for ?ticket=<id> and #verify=<token> links from emails
const LegacyLinkHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Check for legacy ?ticket=<id> in query params
    const searchParams = new URLSearchParams(window.location.search);
    const ticketParam = searchParams.get('ticket');
    if (ticketParam) {
      // Clean query parameter from window location so it doesn't repeatedly trigger
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
      navigate(`/tickets/${ticketParam}`);
      return;
    }

    // 2. Check for legacy #verify=<token>
    if (window.location.hash.startsWith('#verify=')) {
      navigate('/login');
    }
  }, [navigate, location]);

  return null;
};

// Route wrapper for authenticated users
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requireManagement?: boolean;
}> = ({ children, requireManagement = false }) => {
  const { user, loading, canManage } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-navy mb-3" />
        <p className="text-xs font-semibold text-slate-500">Checking Frontdesk session…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.must_change_password) {
    return <Navigate to="/login" replace />;
  }

  if (requireManagement && !canManage) {
    return <Navigate to="/" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <LegacyLinkHandler />
        <Routes>
          {/* Public / Auth routes */}
          <Route path="/login" element={<AuthPage />} />

          {/* Protected workspace routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TicketQueueView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <TicketDetailView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute requireManagement>
                <StaffManagementView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/holidays"
            element={
              <ProtectedRoute requireManagement>
                <HolidayCalendarView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute requireManagement>
                <ReportsView />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
