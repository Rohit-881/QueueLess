import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no activity or data available to display.',
  action,
  className = '',
}) => {
  return (
    <div
      className={`bg-app-surface border border-border-light border-dashed rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-app-secondary border border-border-light flex items-center justify-center text-text-muted mb-4 shadow-sm">
        <Icon className="w-7 h-7 text-text-secondary" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
