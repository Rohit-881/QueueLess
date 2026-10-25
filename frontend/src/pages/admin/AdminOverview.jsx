import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import {
  Layers,
  Clock,
  Users,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Sliders,
  ArrowRight,
  AlertCircle,
  Building2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const AdminOverview = () => {
  const toast = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [services, setServices] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reseed Modal State
  const [isReseedModalOpen, setIsReseedModalOpen] = useState(false);
  const [reseeding, setReseeding] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, servicesRes, sessionsRes] = await Promise.all([
        apiService.getAnalytics(),
        apiService.getServices(),
        apiService.getQueueSessions(),
      ]);

      if (analyticsRes.data?.success) {
        setAnalytics(analyticsRes.data.data);
      }
      if (servicesRes.data?.success) {
        setServices(servicesRes.data.services || []);
      }
      if (sessionsRes.data?.success) {
        setSessions(sessionsRes.data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleReseed = async () => {
    try {
      setReseeding(true);
      const res = await apiService.reseedDemoData();
      if (res.data?.success) {
        toast.success(res.data.message || 'Demo data and initial tokens restored successfully!');
        setIsReseedModalOpen(false);
        await fetchAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reseed database.');
    } finally {
      setReseeding(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading administrator analytics..." />;
  }

  const summary = analytics?.summary || {};

  return (
    <div>
      <PageHeader
        title="System Administration"
        subtitle="Platform-wide operational overview, real-time queues, and capacity status."
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsReseedModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-semantic-danger bg-red-50 border border-red-200 hover:bg-red-100 transition shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Detailed BI Charts</span>
          </Link>
        </div>
      </PageHeader>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Active Services"
          value={summary.totalServices || services.length}
          subtitle="Operating counters"
          icon={Layers}
          iconColor="text-brand-indigo"
          iconBg="bg-brand-softIndigo"
        />
        <StatCard
          title="Open Queue Sessions"
          value={summary.openQueues || 0}
          subtitle="Accepting tokens today"
          icon={Sliders}
          iconColor="text-brand-teal"
          iconBg="bg-brand-softTeal"
          badgeText="Live"
          badgeType="success"
        />
        <StatCard
          title="Waiting Customers"
          value={summary.waitingCustomers || 0}
          subtitle="Across all counters"
          icon={Users}
          badgeText={summary.waitingCustomers > 0 ? 'Queue Active' : 'Clear'}
          badgeType={summary.waitingCustomers > 0 ? 'warning' : 'info'}
        />
        <StatCard
          title="Served Today"
          value={summary.servedToday || 0}
          subtitle="Completed sessions"
          icon={CheckCircle2}
          iconColor="text-semantic-success"
          iconBg="bg-semantic-successBg"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-app-surface border border-border-light rounded-2xl p-5 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary block mb-1">
            Average Wait Time
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-tabular text-text-primary">
              {summary.avgWaitMinutes || 0}
            </span>
            <span className="text-xs font-medium text-text-muted">minutes</span>
          </div>
          <span className="text-xs text-text-muted mt-2 block">
            Target benchmark: &lt; 15 mins
          </span>
        </div>

        <div className="bg-app-surface border border-border-light rounded-2xl p-5 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary block mb-1">
            Average Consultation
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-tabular text-text-primary">
              {summary.avgServiceDuration || 0}
            </span>
            <span className="text-xs font-medium text-text-muted">minutes</span>
          </div>
          <span className="text-xs text-text-muted mt-2 block">
            Computed across completed sessions
          </span>
        </div>

        <div className="bg-app-surface border border-border-light rounded-2xl p-5 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary block mb-1">
            Cancellation Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-tabular text-text-primary">
              {summary.cancellationRate || 0}%
            </span>
          </div>
          <span className="text-xs text-text-muted mt-2 block">
            Customer-initiated dropouts
          </span>
        </div>
      </div>

      {/* Services Table Quick Glance */}
      <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-text-primary">Operating Service Desks</h2>
            <p className="text-xs text-text-secondary">
              Real-time counter configurations and assignments
            </p>
          </div>
          <Link
            to="/admin/services"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-indigo hover:text-brand-indigoHover"
          >
            <span>Manage All Desks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-app-secondary/60 text-xs font-semibold uppercase text-text-secondary border-b border-border-light">
              <tr>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Staff Assigned</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Live Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {services.map((service) => (
                <tr key={service._id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold font-tabular text-brand-navy">
                    {service.codePrefix}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">
                    {service.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-text-secondary">
                    {service.location}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-text-primary">
                    {service.assignedStaffIds?.length > 0
                      ? service.assignedStaffIds.map((s) => s.name).join(', ')
                      : 'None assigned'}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-tabular">
                    {service.maximumQueueCapacity} max
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge
                      status={service.queueSession?.status === 'open' ? 'open' : 'closed'}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reseed Confirmation Modal */}
      <ConfirmationModal
        isOpen={isReseedModalOpen}
        onClose={() => setIsReseedModalOpen(false)}
        onConfirm={handleReseed}
        title="Reset & Restore Initial Demo Data?"
        message="This will reset the database back to the initial demo state: 4 departments (Clinic, Student Admin, Finance, Library), default demo accounts (Admin, Staff, Customers), and initial sample active tokens. This is ideal for resetting a clean state before a college viva or evaluation."
        confirmText={reseeding ? 'Restoring...' : 'Yes, Reset Demo Data'}
        confirmVariant="danger"
      />
    </div>
  );
};

export default AdminOverview;
