import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../api/apiService';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Clock, Layers, History, ArrowRight, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';

export const CustomerOverview = () => {
  const { user, activeToken } = useAuth();
  const [services, setServices] = useState([]);
  const [historyTokens, setHistoryTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [servicesRes, historyRes] = await Promise.all([
          apiService.getServices(),
          apiService.getMyHistory(),
        ]);

        if (servicesRes.data?.success) {
          setServices(servicesRes.data.services || []);
        }
        if (historyRes.data?.success) {
          setHistoryTokens(historyRes.data.tokens || []);
        }
      } catch (err) {
        console.error('Failed to load customer dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading your dashboard..." />;
  }

  const completedCount = historyTokens.filter((t) => t.status === 'completed').length;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}!`}
        subtitle="Track your active virtual tokens and browse live service counters."
      />

      {/* Active Token Callout Banner if user is currently queued */}
      {activeToken && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-brand-indigo to-indigo-700 text-white shadow-lg shadow-brand-indigo/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Clock className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                  Active Virtual Token
                </span>
                <span className="text-xs font-bold text-teal-300">
                  {activeToken.serviceId?.name}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-tabular tracking-tight">
                {activeToken.tokenNumber}
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Location: {activeToken.serviceId?.location || 'Counter 1'}
              </p>
            </div>
          </div>

          <Link
            to="/customer/my-queue"
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-brand-indigo hover:bg-slate-50 transition shadow-sm flex items-center gap-2 shrink-0"
          >
            <span>Open Live Tracker</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Active Live Token"
          value={activeToken ? activeToken.tokenNumber : 'None'}
          subtitle={activeToken ? `Status: ${activeToken.status}` : 'You are not in a queue'}
          icon={Clock}
          badgeText={activeToken ? 'Live' : null}
          badgeType={activeToken ? 'warning' : 'info'}
        />
        <StatCard
          title="Available Services"
          value={services.length}
          subtitle="Open for digital tokens"
          icon={Layers}
          iconColor="text-brand-teal"
          iconBg="bg-brand-softTeal"
        />
        <StatCard
          title="Completed Visits"
          value={completedCount}
          subtitle="Tokens successfully served"
          icon={History}
          iconColor="text-semantic-success"
          iconBg="bg-semantic-successBg"
        />
      </div>

      {/* Popular Services Quick Access */}
      <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Available Service Counters
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Select a service to view queue status and join virtually
            </p>
          </div>
          <Link
            to="/customer/services"
            className="text-xs font-semibold text-brand-indigo hover:text-brand-indigoHover transition flex items-center gap-1"
          >
            <span>View All ({services.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.slice(0, 3).map((service) => (
            <div
              key={service._id}
              className="p-4 rounded-xl border border-border-light bg-app-bg hover:border-brand-indigo/30 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-softIndigo text-brand-indigo font-tabular">
                    {service.codePrefix}
                  </span>
                  <StatusBadge
                    status={service.queueSession?.status === 'open' ? 'open' : 'closed'}
                    size="sm"
                  />
                </div>
                <h3 className="font-semibold text-sm text-text-primary mb-1">
                  {service.name}
                </h3>
                <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                  {service.description}
                </p>
              </div>

              <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-text-muted" />
                  <span className="truncate max-w-[120px]">{service.location}</span>
                </span>
                <span className="font-tabular font-semibold text-text-primary">
                  {service.queueSession?.waitingCount || 0} waiting
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Table Preview */}
      {historyTokens.length > 0 && (
        <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">
              Recent Token History
            </h2>
            <Link
              to="/customer/history"
              className="text-xs font-semibold text-brand-indigo hover:text-brand-indigoHover transition"
            >
              View Full History
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold uppercase text-text-secondary border-b border-border-light">
                <tr>
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {historyTokens.slice(0, 4).map((token) => (
                  <tr key={token._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold font-tabular text-brand-navy">
                      {token.tokenNumber}
                    </td>
                    <td className="py-3 px-4 text-text-primary">
                      {token.serviceId?.name || 'General Service'}
                    </td>
                    <td className="py-3 px-4 text-xs text-text-secondary">
                      {new Date(token.joinedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={token.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOverview;
