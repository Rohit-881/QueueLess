import React from 'react';

const STATUS_CONFIGS = {
  waiting: {
    label: 'Waiting',
    bg: 'bg-semantic-warningBg',
    text: 'text-semantic-warning',
    border: 'border-semantic-warning/20',
    dot: 'bg-semantic-warning',
  },
  called: {
    label: 'Called (Proceed to Counter)',
    bg: 'bg-brand-softIndigo',
    text: 'text-brand-indigo',
    border: 'border-brand-indigo/20',
    dot: 'bg-brand-indigo animate-ping',
  },
  serving: {
    label: 'Now Serving',
    bg: 'bg-brand-softTeal',
    text: 'text-brand-teal',
    border: 'border-brand-teal/20',
    dot: 'bg-brand-teal animate-pulse-dot',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-semantic-successBg',
    text: 'text-semantic-success',
    border: 'border-semantic-success/20',
    dot: 'bg-semantic-success',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-semantic-dangerBg',
    text: 'text-semantic-danger',
    border: 'border-semantic-danger/20',
    dot: 'bg-semantic-danger',
  },
  skipped: {
    label: 'Skipped',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  no_show: {
    label: 'No-Show',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  open: {
    label: 'Queue Open',
    bg: 'bg-semantic-successBg',
    text: 'text-semantic-success',
    border: 'border-semantic-success/20',
    dot: 'bg-semantic-success',
  },
  closed: {
    label: 'Queue Closed',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  paused: {
    label: 'Paused',
    bg: 'bg-semantic-warningBg',
    text: 'text-semantic-warning',
    border: 'border-semantic-warning/20',
    dot: 'bg-semantic-warning',
  },
};

export const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const config = STATUS_CONFIGS[status] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs sm:text-sm',
    lg: 'px-3.5 py-1.5 text-sm sm:text-base font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
