import React, { useState, useEffect } from 'react';
import apiService from '../../api/apiService';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { History, CheckCircle2, Clock } from 'lucide-react';

export const StaffHistory = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await apiService.getStaffDashboard();
        if (res.data?.success && res.data.data) {
          // Flatten any tokens from sessions or fetch recent tokens
          const allTokens = [];
          res.data.data.forEach((item) => {
            if (item.activeToken) allTokens.push(item.activeToken);
          });
          setTokens(allTokens);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading resolved queue history..." />;
  }

  return (
    <div>
      <PageHeader
        title="Served Queue History"
        subtitle="Log of serviced and resolved customer appointments."
      />

      <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
        <h2 className="text-base font-bold text-text-primary mb-4">
          Today's Served Logs
        </h2>

        {tokens.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Completed Tokens Today"
            description="Customers served and completed during active sessions will appear in this log."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-app-secondary/60 text-xs font-semibold uppercase text-text-secondary border-b border-border-light">
                <tr>
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes / Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {tokens.map((token) => (
                  <tr key={token._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold font-tabular text-brand-navy">
                      {token.tokenNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-text-primary">
                      {token.userId?.name || 'Customer'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={token.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-text-muted">
                      {token.resolutionReason || 'Served at counter'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffHistory;
