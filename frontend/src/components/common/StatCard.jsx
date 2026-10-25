import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'info',
  iconColor = 'text-brand-indigo',
  iconBg = 'bg-brand-softIndigo',
  className = '',
}) => {
  return (
    <div
      className={`bg-app-surface border border-border-light rounded-2xl p-5 shadow-card hover:shadow-cardHover transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-tabular text-text-primary tracking-tight">
          {value}
        </span>
        {badgeText && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              badgeType === 'success'
                ? 'bg-semantic-successBg text-semantic-success'
                : badgeType === 'warning'
                ? 'bg-semantic-warningBg text-semantic-warning'
                : 'bg-brand-softIndigo text-brand-indigo'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-text-muted font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
