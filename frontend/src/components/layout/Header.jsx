import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ConnectionBadge from '../common/ConnectionBadge';
import { Menu, Clock, ChevronRight } from 'lucide-react';

export const Header = ({ onOpenSidebar }) => {
  const { user, activeToken } = useAuth();
  const location = useLocation();

  // Generate context title from route
  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path.includes('/customer/services')) return 'Available Services';
    if (path.includes('/customer/my-queue')) return 'Live Queue Tracking';
    if (path.includes('/customer/history')) return 'Token History';
    if (path.includes('/customer/profile')) return 'My Profile';
    if (path.includes('/customer')) return 'Customer Dashboard';

    if (path.includes('/staff/queue')) return 'Active Queue Management';
    if (path.includes('/staff/history')) return 'Resolved Queue History';
    if (path.includes('/staff/profile')) return 'Staff Profile';
    if (path.includes('/staff')) return 'Staff Operations';

    if (path.includes('/admin/services')) return 'Services & Counters';
    if (path.includes('/admin/queues')) return 'Queue Sessions';
    if (path.includes('/admin/staff')) return 'Staff Directory & Roles';
    if (path.includes('/admin/analytics')) return 'System Analytics & BI';
    if (path.includes('/admin/profile')) return 'Admin Settings';
    if (path.includes('/admin')) return 'Administrator Console';

    return 'Portal';
  };

  return (
    <header className="sticky top-0 z-20 bg-app-surface/90 backdrop-blur-md border-b border-border-light h-16 flex items-center justify-between px-4 sm:px-8">
      {/* Left: Mobile Menu Toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden text-text-secondary hover:text-text-primary p-2 rounded-xl hover:bg-slate-100 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <span className="text-text-muted capitalize font-medium">
            {user?.role}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
          <span className="font-semibold text-text-primary">
            {getBreadcrumbTitle()}
          </span>
        </div>
      </div>

      {/* Right: Live Connection + Active Token Chip + Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Customer Active Token Shortcut if exists */}
        {user?.role === 'customer' && activeToken && (
          <Link
            to="/customer/my-queue"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-softIndigo text-brand-indigo border border-brand-indigo/20 hover:bg-brand-indigo hover:text-white transition shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Active: {activeToken.tokenNumber}</span>
          </Link>
        )}

        {/* Live WebSocket Connection Status */}
        <ConnectionBadge />

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border-light">
          <div className="w-8 h-8 rounded-full bg-brand-indigo text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="hidden lg:block text-xs font-semibold text-text-primary">
            {user?.name?.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
