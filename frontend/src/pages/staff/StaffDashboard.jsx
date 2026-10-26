import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import apiService from '../../api/apiService';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Users,
  Clock,
  CheckCircle2,
  PhoneCall,
  Play,
  CheckSquare,
  SkipForward,
  UserX,
  Power,
  RefreshCw,
  MapPin,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const { socket, joinQueueRoom, leaveQueueRoom } = useSocket();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [servicesData, setServicesData] = useState([]);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const isFetchingRef = useRef(false);

  // Dialog states
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmVariant: 'danger',
    action: null,
  });

  const activeServiceData = servicesData[selectedServiceIndex] || null;
  const currentSession = activeServiceData?.session || null;
  const currentActiveToken = activeServiceData?.activeToken || null;
  const waitingTokens = activeServiceData?.waitingTokens || [];

  // Fetch staff dashboard state
  const fetchStaffData = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      const res = await apiService.getStaffDashboard();
      if (res.data?.success) {
        setServicesData(res.data.data || []);
      }
    } catch (err) {
      if (err.status !== 429) {
        toastRef.current?.error(err.message || 'Failed to load staff queue.');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  // Real-time socket room subscription
  useEffect(() => {
    if (!currentSession?._id || !socket) return;

    const sessionId = currentSession._id;
    joinQueueRoom(sessionId);

    const handleUpdate = () => {
      console.log('[Staff Socket] Queue update received');
      fetchStaffData();
    };

    socket.on('queue:updated', handleUpdate);
    socket.on('token:joined', handleUpdate);
    socket.on('token:called', handleUpdate);
    socket.on('token:started', handleUpdate);
    socket.on('token:completed', handleUpdate);
    socket.on('token:cancelled', handleUpdate);
    socket.on('token:skipped', handleUpdate);
    socket.on('token:no_show', handleUpdate);
    socket.on('queue:status_changed', handleUpdate);

    return () => {
      leaveQueueRoom(sessionId);
      socket.off('queue:updated', handleUpdate);
      socket.off('token:joined', handleUpdate);
      socket.off('token:called', handleUpdate);
      socket.off('token:started', handleUpdate);
      socket.off('token:completed', handleUpdate);
      socket.off('token:cancelled', handleUpdate);
      socket.off('token:skipped', handleUpdate);
      socket.off('token:no_show', handleUpdate);
      socket.off('queue:status_changed', handleUpdate);
    };
  }, [currentSession?._id, socket, joinQueueRoom, leaveQueueRoom, fetchStaffData]);

  // Staff Queue Operations
  const handleCallNext = async () => {
    if (!currentSession) return;
    try {
      setActionLoading(true);
      const res = await apiService.callNextToken(currentSession._id);
      if (res.data?.success) {
        toast.success(`Token ${res.data.token.tokenNumber} called to counter!`);
        await fetchStaffData();
      }
    } catch (err) {
      toast.error(err.message || 'Could not call next token.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async (tokenId) => {
    try {
      setActionLoading(true);
      const res = await apiService.startService(tokenId);
      if (res.data?.success) {
        toast.success(`Service started for token ${res.data.token.tokenNumber}.`);
        await fetchStaffData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to start service.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteService = async (tokenId) => {
    try {
      setActionLoading(true);
      const res = await apiService.completeService(tokenId, 'Service completed at desk');
      if (res.data?.success) {
        toast.success(`Token ${res.data.token.tokenNumber} marked as completed!`);
        await fetchStaffData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to complete service.');
    } finally {
      setActionLoading(false);
    }
  };

  const promptSkipToken = (tokenId, tokenNumber) => {
    setModalState({
      isOpen: true,
      title: `Skip Token ${tokenNumber}?`,
      message: 'Are you sure you want to skip this customer? Their token will be recorded as skipped.',
      confirmText: 'Yes, Skip Token',
      confirmVariant: 'warning',
      action: async () => {
        try {
          setActionLoading(true);
          const res = await apiService.skipToken(tokenId, 'Customer not present at call');
          if (res.data?.success) {
            toast.info(`Token ${tokenNumber} skipped.`);
            await fetchStaffData();
          }
        } catch (err) {
          toast.error(err.message);
        } finally {
          setActionLoading(false);
          setModalState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const promptMarkNoShow = (tokenId, tokenNumber) => {
    setModalState({
      isOpen: true,
      title: `Mark ${tokenNumber} as No-Show?`,
      message: 'Marking a customer as No-Show releases the counter and flags the token in system analytics.',
      confirmText: 'Mark No-Show',
      confirmVariant: 'danger',
      action: async () => {
        try {
          setActionLoading(true);
          const res = await apiService.markNoShow(tokenId, 'Did not appear after multiple calls');
          if (res.data?.success) {
            toast.warning(`Token ${tokenNumber} marked as no-show.`);
            await fetchStaffData();
          }
        } catch (err) {
          toast.error(err.message);
        } finally {
          setActionLoading(false);
          setModalState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const toggleQueueStatus = async () => {
    if (!currentSession) return;
    const newStatus = currentSession.status === 'open' ? 'closed' : 'open';
    try {
      setActionLoading(true);
      const res = await apiService.updateQueueStatus(currentSession._id, newStatus);
      if (res.data?.success) {
        toast.info(`Queue is now ${newStatus}.`);
        await fetchStaffData();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading staff operations counter..." />;
  }

  if (servicesData.length === 0) {
    return (
      <div>
        <PageHeader title="Staff Counter" subtitle="Queue control panel" />
        <EmptyState
          icon={Users}
          title="No Services Assigned"
          description="You do not currently have any active services assigned. Contact an administrator to link services."
        />
      </div>
    );
  }

  const isCounterOccupied = !!currentActiveToken && ['called', 'serving'].includes(currentActiveToken.status);
  const isQueueOpen = currentSession?.status === 'open';

  return (
    <div>
      {/* Page Header with Service Selector Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Counter Operations
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-text-muted" />
            <span>{activeServiceData?.service?.name}</span>
            <span>•</span>
            <span className="font-semibold text-text-primary">{activeServiceData?.service?.location}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Service Switcher if multiple assigned */}
          {servicesData.length > 1 && (
            <select
              value={selectedServiceIndex}
              onChange={(e) => setSelectedServiceIndex(Number(e.target.value))}
              className="px-3 py-2 text-xs font-semibold bg-white border border-border-light rounded-xl shadow-xs text-text-primary focus:outline-hidden"
            >
              {servicesData.map((item, idx) => (
                <option key={item.service._id} value={idx}>
                  {item.service.codePrefix} - {item.service.name}
                </option>
              ))}
            </select>
          )}

          {/* Queue Open/Close Toggle */}
          <button
            onClick={toggleQueueStatus}
            disabled={actionLoading}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              isQueueOpen
                ? 'bg-red-50 text-semantic-danger border border-red-200 hover:bg-red-100'
                : 'bg-emerald-50 text-semantic-success border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isQueueOpen ? 'Close Queue' : 'Open Queue'}</span>
          </button>

          <button
            onClick={fetchStaffData}
            className="p-2 bg-white border border-border-light text-text-secondary hover:text-text-primary rounded-xl shadow-xs transition"
            title="Refresh state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Waiting Customers"
          value={activeServiceData?.waitingCount || 0}
          subtitle="In line for this counter"
          icon={Users}
          badgeText={activeServiceData?.waitingCount > 0 ? 'Active' : 'Empty'}
          badgeType={activeServiceData?.waitingCount > 0 ? 'warning' : 'info'}
        />
        <StatCard
          title="Current Active Token"
          value={currentActiveToken?.tokenNumber || 'None'}
          subtitle={currentActiveToken ? `Status: ${currentActiveToken.status}` : 'Desk is currently free'}
          icon={PhoneCall}
          iconColor="text-brand-indigo"
          iconBg="bg-brand-softIndigo"
        />
        <StatCard
          title="Customers Served Today"
          value={activeServiceData?.servedTodayCount || 0}
          subtitle="Completed sessions"
          icon={CheckCircle2}
          iconColor="text-semantic-success"
          iconBg="bg-semantic-successBg"
        />
        <StatCard
          title="Average Duration"
          value={`${activeServiceData?.service?.averageServiceDuration || 10}m`}
          subtitle="Configured service pace"
          icon={Clock}
          iconColor="text-brand-teal"
          iconBg="bg-brand-softTeal"
        />
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Token Control Panel (1 Column) */}
        <div className="lg:col-span-1">
          <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-border-light mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Active Counter Desk
              </span>
              <StatusBadge status={isQueueOpen ? 'open' : 'closed'} size="sm" />
            </div>

            {currentActiveToken ? (
              <div>
                <div className="text-center my-4 p-5 rounded-2xl bg-app-secondary border border-border-light">
                  <span className="text-xs font-semibold text-text-muted block mb-1">
                    Customer at Desk
                  </span>
                  <div className="text-4xl font-extrabold font-tabular text-brand-navy">
                    {currentActiveToken.tokenNumber}
                  </div>
                  <div className="mt-2 flex justify-center">
                    <StatusBadge status={currentActiveToken.status} size="md" />
                  </div>
                </div>

                <div className="space-y-2 mb-6 text-xs text-text-secondary bg-app-bg p-3.5 rounded-xl border border-border-light">
                  <div className="flex justify-between">
                    <span>Customer Name:</span>
                    <strong className="text-text-primary">{currentActiveToken.userId?.name || 'Customer'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sequence #:</span>
                    <span className="font-tabular font-bold">{currentActiveToken.queueSequence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Called Timestamp:</span>
                    <span className="font-tabular">
                      {currentActiveToken.calledAt ? new Date(currentActiveToken.calledAt).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                </div>

                {/* State Transition Action Buttons */}
                <div className="space-y-2.5">
                  {currentActiveToken.status === 'called' && (
                    <button
                      onClick={() => handleStartService(currentActiveToken._id)}
                      disabled={actionLoading}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Service</span>
                    </button>
                  )}

                  {currentActiveToken.status === 'serving' && (
                    <button
                      onClick={() => handleCompleteService(currentActiveToken._id)}
                      disabled={actionLoading}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-semantic-success hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Complete Service & Free Counter</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-light">
                    <button
                      onClick={() => promptSkipToken(currentActiveToken._id, currentActiveToken.tokenNumber)}
                      disabled={actionLoading}
                      className="py-2 px-3 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary bg-white border border-border-light hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>Skip</span>
                    </button>
                    <button
                      onClick={() => promptMarkNoShow(currentActiveToken._id, currentActiveToken.tokenNumber)}
                      disabled={actionLoading}
                      className="py-2 px-3 rounded-xl text-xs font-semibold text-semantic-danger hover:bg-red-50 border border-semantic-danger/20 transition flex items-center justify-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>No-Show</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-app-secondary border border-border-light flex items-center justify-center text-text-muted mx-auto mb-3">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-text-primary mb-1">
                  Counter Is Available
                </h4>
                <p className="text-xs text-text-secondary max-w-xs mx-auto mb-6">
                  {waitingTokens.length > 0
                    ? `${waitingTokens.length} customers are waiting in queue.`
                    : 'No customers currently waiting.'}
                </p>

                <button
                  onClick={handleCallNext}
                  disabled={waitingTokens.length === 0 || !isQueueOpen || actionLoading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-indigo hover:bg-brand-indigoHover shadow-md shadow-brand-indigo/20 transition flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-text-muted disabled:shadow-none"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Next Customer</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Waiting List Queue Table (2 Columns) */}
        <div className="lg:col-span-2">
          <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-border-light mb-4">
              <div>
                <h2 className="text-base font-bold text-text-primary">
                  Live Waiting List
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Ordered strictly by sequence allocation
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-softIndigo text-brand-indigo font-tabular">
                {waitingTokens.length} waiting
              </span>
            </div>

            {waitingTokens.length === 0 ? (
              <div className="py-12 text-center text-text-secondary text-sm">
                No customers are currently in the waiting queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs font-semibold uppercase text-text-secondary border-b border-border-light">
                    <tr>
                      <th className="py-3 px-4">Pos</th>
                      <th className="py-3 px-4">Token #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Wait Time</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {waitingTokens.map((token, index) => {
                      const waitMinutes = Math.floor(
                        (Date.now() - new Date(token.joinedAt).getTime()) / 60000
                      );

                      return (
                        <tr key={token._id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 font-bold font-tabular text-text-secondary">
                            #{index + 1}
                          </td>
                          <td className="py-3.5 px-4 font-bold font-tabular text-brand-navy">
                            {token.tokenNumber}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-text-primary">
                            {token.userId?.name || 'Customer'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-text-secondary font-tabular">
                            {waitMinutes}m elapsed
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Fast Call Button if desk is free and top of queue */}
                              {index === 0 && !isCounterOccupied && isQueueOpen && (
                                <button
                                  onClick={handleCallNext}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-brand-indigo hover:bg-brand-indigoHover transition"
                                >
                                  Call
                                </button>
                              )}
                              <button
                                onClick={() => promptSkipToken(token._id, token.tokenNumber)}
                                disabled={actionLoading}
                                className="px-2 py-1 rounded-lg text-xs text-text-secondary hover:text-text-primary border border-border-light hover:bg-slate-100 transition"
                                title="Skip token"
                              >
                                Skip
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        confirmVariant={modalState.confirmVariant}
        loading={actionLoading}
        onConfirm={modalState.action}
        onCancel={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default StaffDashboard;
