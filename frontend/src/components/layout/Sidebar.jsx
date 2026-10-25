import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Layers,
  Clock,
  History,
  User,
  Users,
  BarChart3,
  LogOut,
  Sparkles,
  X,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const getNavLinks = () => {
    if (!user) return [];

    if (user.role === 'customer') {
      return [
        { name: 'Overview', to: '/customer', icon: LayoutDashboard },
        { name: 'Available Services', to: '/customer/services', icon: Layers },
        { name: 'My Live Queue', to: '/customer/my-queue', icon: Clock },
        { name: 'Token History', to: '/customer/history', icon: History },
        { name: 'Profile', to: '/customer/profile', icon: User },
      ];
    }

    if (user.role === 'staff') {
      return [
        { name: 'Dashboard', to: '/staff', icon: LayoutDashboard },
        { name: 'Active Queue Counter', to: '/staff/queue', icon: Clock },
        { name: 'Served History', to: '/staff/history', icon: History },
        { name: 'Profile', to: '/staff/profile', icon: User },
      ];
    }

    if (user.role === 'admin') {
      return [
        { name: 'Overview', to: '/admin', icon: LayoutDashboard },
        { name: 'Services & Counters', to: '/admin/services', icon: Layers },
        { name: 'Queue Sessions', to: '/admin/queues', icon: Sliders },
        { name: 'Staff Management', to: '/admin/staff', icon: Users },
        { name: 'Real-Time Analytics', to: '/admin/analytics', icon: BarChart3 },
        { name: 'Admin Profile', to: '/admin/profile', icon: User },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-border-light select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border-light">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-indigo flex items-center justify-center text-white shadow-sm shadow-brand-indigo/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold text-brand-navy tracking-tight">
              QueueLess
            </span>
            <span className="block text-[10px] font-semibold tracking-wider uppercase text-brand-teal">
              Virtual SaaS
            </span>
          </div>
        </NavLink>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-text-muted hover:text-text-primary p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Pill */}
      <div className="px-6 py-3 bg-app-secondary border-b border-border-light flex items-center justify-between">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Workspace
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize bg-brand-softIndigo text-brand-indigo border border-brand-indigo/15">
          {user?.role} Portal
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/customer' || item.to === '/staff' || item.to === '/admin'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-indigo text-white shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-border-light bg-app-secondary/50">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {user?.name}
            </p>
            <p className="text-xs text-text-muted truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-semantic-danger hover:bg-red-50 border border-border-light bg-white transition shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 z-30 shadow-card">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 shadow-modal animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
