import React, { useState, useEffect } from 'react';
import apiService from '../../api/apiService';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { History, Calendar, Clock, MapPin } from 'lucide-react';

export const CustomerHistory = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await apiService.getMyHistory();
        if (res.data?.success) {
          setTokens(res.data.tokens || []);
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
    return <LoadingSpinner label="Loading your past tokens..." />;
  }

  return (
    <div>
      <PageHeader
        title="My Queue History"
        subtitle="Chronological log of all virtual tokens issued to your account."
      />

      {tokens.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Past Tokens"
          description="You haven't joined any virtual queues yet. Your completed and resolved visits will appear here."
        />
      ) : (
        <div className="bg-app-surface border border-border-light rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-app-secondary/60 text-xs font-semibold uppercase text-text-secondary border-b border-border-light">
                <tr>
                  <th className="py-3.5 px-5">Token #</th>
                  <th className="py-3.5 px-5">Service Department</th>
                  <th className="py-3.5 px-5">Location</th>
                  <th className="py-3.5 px-5">Joined At</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Resolution / Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {tokens.map((token) => (
                  <tr key={token._id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-5 font-bold font-tabular text-brand-navy">
                      {token.tokenNumber}
                    </td>
                    <td className="py-4 px-5 font-medium text-text-primary">
                      {token.serviceId?.name || 'Service'}
                    </td>
                    <td className="py-4 px-5 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-text-muted" />
                        <span>{token.serviceId?.location || 'Desk'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs text-text-secondary">
                      {new Date(token.joinedAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={token.status} size="sm" />
                    </td>
                    <td className="py-4 px-5 text-xs text-text-muted">
                      {token.resolutionReason || '—'}
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

export default CustomerHistory;
