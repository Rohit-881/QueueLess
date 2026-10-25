import React, { useState, useEffect } from 'react';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Sliders, Power, Play, Pause, RefreshCw, Calendar, MapPin, Ticket, X } from 'lucide-react';

export const QueueManagement = () => {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Walk-in Token Modal
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [submittingToken, setSubmittingToken] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    serviceId: '',
    customerName: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, servicesRes] = await Promise.all([
        apiService.getQueueSessions(),
        apiService.getServices(),
      ]);

      if (sessionsRes.data?.success) {
        setSessions(sessionsRes.data.sessions || []);
      }
      if (servicesRes.data?.success) {
        const activeServices = (servicesRes.data.services || []).filter((s) => s.isActive);
        setServices(activeServices);
        if (activeServices.length > 0 && !tokenForm.serviceId) {
          setTokenForm((prev) => ({ ...prev, serviceId: activeServices[0]._id }));
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch queue data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (sessionId, newStatus) => {
    try {
      setUpdatingId(sessionId);
      const res = await apiService.updateQueueStatus(sessionId, newStatus);
      if (res.data?.success) {
        toast.info(`Queue session marked as ${newStatus}.`);
        await fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update queue session status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleIssueToken = async (e) => {
    e.preventDefault();
    if (!tokenForm.serviceId) {
      toast.error('Please select a service counter.');
      return;
    }

    try {
      setSubmittingToken(true);
      const res = await apiService.issueWalkInToken({
        serviceId: tokenForm.serviceId,
        customerName: tokenForm.customerName || 'Walk-in Visitor',
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Token ${res.data.token?.tokenNumber} issued successfully!`);
        setIsTokenModalOpen(false);
        setTokenForm((prev) => ({ ...prev, customerName: '' }));
        await fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to issue token.');
    } finally {
      setSubmittingToken(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading operational queue sessions..." />;
  }

  return (
    <div>
      <PageHeader
        title="Queue Session Management"
        subtitle="Inspect operating sessions, token sequence allocation, and manual walk-in ticket generation."
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTokenModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-brand-teal hover:bg-teal-700 transition shadow-sm"
          >
            <Ticket className="w-4 h-4" />
            <span>Issue Walk-in Token</span>
          </button>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary bg-white border border-border-light hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </PageHeader>

      {sessions.length === 0 ? (
        <EmptyState
          icon={Sliders}
          title="No Queue Sessions Found"
          description="Operating queue sessions are automatically created for active services when customers or staff interact with them."
        />
      ) : (
        <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-app-secondary/60 text-xs font-semibold uppercase text-text-secondary border-b border-border-light">
                <tr>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total Tokens</th>
                  <th className="py-3 px-4">Active Counter</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary">
                        {session.serviceId?.name || 'Service'}
                      </div>
                      <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{session.serviceId?.location || 'Desk'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-tabular text-text-secondary">
                      {session.businessDate}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-tabular text-brand-navy">
                      {session.lastSequence} tokens
                    </td>
                    <td className="py-3.5 px-4">
                      {session.activeTokenId ? (
                        <span className="font-bold font-tabular text-brand-indigo bg-brand-softIndigo px-2 py-0.5 rounded-md text-xs border border-brand-indigo/15">
                          {session.activeTokenId.tokenNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-tabular">
                      {session.maximumCapacity} max
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={session.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {session.status === 'open' && (
                          <button
                            onClick={() => handleStatusChange(session._id, 'paused')}
                            disabled={updatingId === session._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
                          >
                            <Pause className="w-3 h-3" />
                            <span>Pause</span>
                          </button>
                        )}
                        {session.status === 'paused' && (
                          <button
                            onClick={() => handleStatusChange(session._id, 'open')}
                            disabled={updatingId === session._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                          >
                            <Play className="w-3 h-3" />
                            <span>Resume</span>
                          </button>
                        )}
                        {session.status !== 'closed' && (
                          <button
                            onClick={() => handleStatusChange(session._id, 'closed')}
                            disabled={updatingId === session._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
                          >
                            <Power className="w-3 h-3" />
                            <span>Close</span>
                          </button>
                        )}
                        {session.status === 'closed' && (
                          <button
                            onClick={() => handleStatusChange(session._id, 'open')}
                            disabled={updatingId === session._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-indigo bg-brand-softIndigo border border-brand-indigo/20 rounded-lg hover:bg-indigo-100 transition"
                          >
                            <Play className="w-3 h-3" />
                            <span>Reopen</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Walk-in Token Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-light">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-softTeal text-brand-teal flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Issue Walk-in Token</h3>
                  <p className="text-xs text-text-secondary">Generate a ticket for in-person visitors</p>
                </div>
              </div>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-app-bg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Target Service Counter *
                </label>
                <select
                  required
                  value={tokenForm.serviceId}
                  onChange={(e) => setTokenForm({ ...tokenForm, serviceId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo font-medium"
                >
                  {services.map((svc) => (
                    <option key={svc._id} value={svc._id}>
                      {svc.name} ({svc.codePrefix}) — {svc.counterNumber || 'Counter'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Visitor / Patient Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in Student / Visitor"
                  value={tokenForm.customerName}
                  onChange={(e) => setTokenForm({ ...tokenForm, customerName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo"
                />
                <p className="mt-1 text-[11px] text-text-muted">
                  Leave blank to issue as "Walk-in Visitor".
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-light mt-6">
                <button
                  type="button"
                  onClick={() => setIsTokenModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-app-bg border border-border-light transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingToken}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-teal hover:bg-teal-700 transition shadow-sm disabled:opacity-50"
                >
                  {submittingToken ? 'Generating...' : 'Issue Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManagement;
