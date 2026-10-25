import React, { useState, useEffect } from 'react';
import apiService from '../../api/apiService';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAnalytics();
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Computing MongoDB aggregation analytics..." />;
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const volumeByHour = charts.volumeByHour || [];
  const statusDistribution = charts.statusDistribution || [];
  const serviceBreakdown = charts.serviceBreakdown || [];

  return (
    <div>
      <PageHeader
        title="Operational Analytics & BI"
        subtitle="Server-side MongoDB aggregation metrics, throughput trends, and queue distributions."
      >
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary bg-white border border-border-light hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </PageHeader>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Served Today"
          value={summary.servedToday || 0}
          subtitle="Completed customer visits"
          icon={CheckCircle2}
          iconColor="text-semantic-success"
          iconBg="bg-semantic-successBg"
        />
        <StatCard
          title="Average Wait Time"
          value={`${summary.avgWaitMinutes || 0}m`}
          subtitle="Join time to counter call"
          icon={Clock}
          iconColor="text-semantic-warning"
          iconBg="bg-semantic-warningBg"
        />
        <StatCard
          title="Average Service Time"
          value={`${summary.avgServiceDurationMinutes || 0}m`}
          subtitle="Desk interaction duration"
          icon={TrendingUp}
          iconColor="text-brand-teal"
          iconBg="bg-brand-softTeal"
        />
        <StatCard
          title="Cancellation Rate"
          value={`${summary.cancellationRate || 0}%`}
          subtitle="Abandoned before call"
          icon={AlertTriangle}
          iconColor="text-semantic-danger"
          iconBg="bg-semantic-dangerBg"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 1. Line Chart: Hourly Volume Trend */}
        <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Queue Volume by Hour Today
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Customer joins vs completed services
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-softIndigo text-brand-indigo font-tabular">
              Hourly Throughput
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                <XAxis dataKey="hour" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '0.75rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="joined"
                  name="Joined Queue"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4F46E5' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Served"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0D9488' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Donut Chart: Token Status Distribution */}
        <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Token Status Distribution
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Proportion of completed, waiting, and cancelled tokens
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-softTeal text-brand-teal font-tabular">
              All Records
            </span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {statusDistribution.length === 0 ? (
              <span className="text-xs text-text-muted">No token records found.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.75rem',
                      border: '1px solid #E2E8F0',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bar Chart: Customers Served by Service Department */}
      <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-text-primary">
              Volume by Service Counter Desk
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Comparison of total tokens issued vs completed per department
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          {serviceBreakdown.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-text-muted">
              No service activity records available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" />
                <XAxis dataKey="serviceName" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '0.75rem',
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="total"
                  name="Total Tokens"
                  fill="#4F46E5"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="completed"
                  name="Successfully Completed"
                  fill="#0D9488"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
