import React from 'react';
import { TicketPriority, TicketStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'navy' | 'slate' | 'light' | 'red' | 'deepRed' | 'warning' | 'success';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '' }) => {
  const variantStyles = {
    navy: 'bg-navy-50 text-navy-800 border-navy-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
    light: 'bg-light text-navy border-slate-300',
    red: 'bg-red-50 text-red-600 border-red-200',
    deepRed: 'bg-deepRed/10 text-deepRed border-deepRed/20',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TicketPriority; className?: string }> = ({
  priority,
  className = '',
}) => {
  if (priority === 'urgent') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-deepRed/10 text-deepRed border border-deepRed/25 animate-pulse ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-deepRed"></span>
        Urgent
      </span>
    );
  }
  if (priority === 'medium') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy-100 text-navy-800 border border-navy-200 ${className}`}
      >
        Medium
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
    >
      Low
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TicketStatus; className?: string; isCustomer?: boolean }> = ({
  status,
  className = '',
  isCustomer = false,
}) => {
  switch (status) {
    case 'open':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy-50 text-navy-700 border border-navy-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-navy-500"></span>
          Open
        </span>
      );
    case 'waiting_on_customer':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {isCustomer ? 'Needs your reply' : 'Waiting on customer'}
        </span>
      );
    case 'resolved':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Resolved
        </span>
      );
    case 'closed_inactivity':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        >
          Closed for inactivity
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          {status}
        </span>
      );
  }
};

export const MilestoneBadge: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
  const text = label || status;
  switch (status) {
    case 'met':
      return <Badge variant="success">✓ {text}</Badge>;
    case 'late':
    case 'overdue':
      return <Badge variant="deepRed">⚠️ {text}</Badge>;
    case 'paused':
      return <Badge variant="warning">⏸ {text}</Badge>;
    case 'not_applicable':
      return <Badge variant="slate">N/A</Badge>;
    default:
      return <Badge variant="navy">{text}</Badge>;
  }
};
