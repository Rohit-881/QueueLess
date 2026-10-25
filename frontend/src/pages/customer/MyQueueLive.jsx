import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import apiService from '../../api/apiService';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  BellRing,
  ArrowRight,
  XCircle,
  RefreshCw,
  Building,
} from 'lucide-react';

export const MyQueueLive = () => {
  const { user, activeToken, setActiveToken } = useAuth();
  const { socket, joinQueueRoom, leaveQueueRoom, connectionStatus } = useSocket();
  const toast = useToast();
  const navigate = useNavigate();

  const [tokenData, setTokenData] = useState(null);
  const [position, setPosition] = useState(null);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState(0);
  const [currentlyServingToken, setCurrentlyServingToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed plans');

  // Fetch authoritative state from MongoDB
  const fetchActiveTokenState = useCallback(async () => {
    try {
      const res = await apiService.getMyActiveToken();
      if (res.data?.success && res.data.hasActiveToken) {
        setTokenData(res.data.token);
        setPosition(res.data.position);
        setPeopleAhead(res.data.peopleAhead);
        setEstimatedWaitMinutes(res.data.estimatedWaitMinutes);
        setCurrentlyServingToken(res.data.currentlyServingToken);
        setActiveToken(res.data.token);
      } else {
        setTokenData(null);
        setActiveToken(null);
      }
    } catch (err) {
      console.error('Failed to load active token state:', err);
    } finally {
      setLoading(false);
    }
  }, [setActiveToken]);

  useEffect(() => {
    fetchActiveTokenState();
  }, [fetchActiveTokenState]);

  // Real-time socket subscription and listeners
  useEffect(() => {
    if (!tokenData?.queueSessionId?._id || !socket) return;

    const sessionId = tokenData.queueSessionId._id;
    joinQueueRoom(sessionId);

    // Handler for real-time queue updates
    const handleQueueUpdated = (summary) => {
      console.log('[Live Queue Event] queue:updated received', summary);
      // Re-fetch authoritative dynamic position & wait calculation
      fetchActiveTokenState();
    };

    // Handler when any token is called
    const handleTokenCalled = (data) => {
      console.log('[Live Queue Event] token:called', data);
      if (tokenData && data.tokenId === tokenData._id) {
        toast.info(`🔔 Ding! Your token ${tokenData.tokenNumber} has been called! Proceed to counter.`, 10000);
      }
      fetchActiveTokenState();
    };

    const handlePrivateCall = (data) => {
      toast.info(`🔔 YOUR TURN! Please proceed to ${data.location || 'Counter'}.`, 15000);
      fetchActiveTokenState();
    };

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('token:called', handleTokenCalled);
    socket.on('token:started', handleQueueUpdated);
    socket.on('token:completed', handleQueueUpdated);
    socket.on('token:cancelled', handleQueueUpdated);
    socket.on('token:skipped', handleQueueUpdated);
    socket.on('token:no_show', handleQueueUpdated);
    socket.on('queue:status_changed', handleQueueUpdated);
    socket.on('your_token:called', handlePrivateCall);

    return () => {
      leaveQueueRoom(sessionId);
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('token:called', handleTokenCalled);
      socket.off('token:started', handleQueueUpdated);
      socket.off('token:completed', handleQueueUpdated);
      socket.off('token:cancelled', handleQueueUpdated);
      socket.off('token:skipped', handleQueueUpdated);
      socket.off('token:no_show', handleQueueUpdated);
      socket.off('queue:status_changed', handleQueueUpdated);
      socket.off('your_token:called', handlePrivateCall);
    };
  }, [tokenData?.queueSessionId?._id, socket, joinQueueRoom, leaveQueueRoom, fetchActiveTokenState, toast]);

  // Handle Cancellation
  const handleConfirmCancel = async () => {
    if (!tokenData) return;
    try {
      setCancelLoading(true);
      const res = await apiService.cancelToken(tokenData._id, cancelReason);
      if (res.data?.success) {
        toast.info(`Token ${tokenData.tokenNumber} was cancelled.`);
        setIsCancelModalOpen(false);
        setActiveToken(null);
        setTokenData(null);
        navigate('/customer/services');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel token.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Synchronizing live queue token..." />;
  }

  if (!tokenData) {
    return (
      <div>
        <PageHeader
          title="Live Queue Tracking"
          subtitle="Real-time virtual queue position and estimated wait."
        />
        <EmptyState
          icon={Clock}
          title="No Active Queue Token"
          description="You do not currently have a waiting or serving token in any queue session."
          action={
            <Link
              to="/customer/services"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm"
            >
              <span>Browse Services & Join Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      </div>
    );
  }

  const isCalled = tokenData.status === 'called';
  const isServing = tokenData.status === 'serving';
  const isWaiting = tokenData.status === 'waiting';

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Live Queue Tracking"
        subtitle="Real-time synchronized token status with instant updates."
      >
        <button
          onClick={fetchActiveTokenState}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary bg-white border border-border-light hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </PageHeader>

      {/* Alert Banner when Called */}
      {isCalled && (
        <div className="mb-6 p-5 rounded-2xl bg-brand-indigo text-white shadow-xl shadow-brand-indigo/30 animate-bounce duration-1000 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold">Your Turn Has Arrived!</h3>
              <p className="text-xs text-white/90">
                Please proceed immediately to{' '}
                <span className="font-semibold underline">
                  {tokenData.serviceId?.location || 'the counter'}
                </span>
                .
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white text-brand-indigo shrink-0">
            Proceed to Desk
          </span>
        </div>
      )}

      {/* Hero Token Card (Section 8 Step 3) */}
      <div className="bg-app-surface border border-border-light rounded-2xl p-6 sm:p-10 shadow-card mb-8 text-center relative overflow-hidden">
        {/* Top subtle brand bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-indigo" />

        <div className="inline-flex items-center gap-2 mb-3">
          <Building className="w-4 h-4 text-text-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {tokenData.serviceId?.name}
          </span>
        </div>

        {/* Most prominent element: Token Number */}
        <div className="my-3">
          <span className="text-xs font-semibold text-text-muted block mb-1">
            Your Digital Token
          </span>
          <div className="text-5xl sm:text-7xl font-extrabold font-tabular text-brand-navy tracking-tight">
            {tokenData.tokenNumber}
          </div>
        </div>

        {/* Token Status Badge */}
        <div className="flex justify-center mb-6">
          <StatusBadge status={tokenData.status} size="lg" />
        </div>

        {/* Dynamic Queue Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border-light">
          {/* Position in Line */}
          <div className="p-4 rounded-xl bg-app-secondary border border-border-light text-center">
            <span className="text-xs text-text-secondary font-medium block mb-1">
              Position in Queue
            </span>
            <div className="text-2xl font-bold font-tabular text-text-primary">
              {isWaiting ? `#${position || 1}` : isCalled ? 'Now at Desk' : 'Active'}
            </div>
            <span className="text-[11px] text-text-muted mt-0.5 block">
              {isWaiting ? `${peopleAhead} people ahead` : 'Your turn is active'}
            </span>
          </div>

          {/* Estimated Wait */}
          <div className="p-4 rounded-xl bg-app-secondary border border-border-light text-center">
            <span className="text-xs text-text-secondary font-medium block mb-1">
              Estimated Wait
            </span>
            <div className="text-2xl font-bold font-tabular text-semantic-warning">
              {isWaiting ? `~${estimatedWaitMinutes} mins` : 'Immediate'}
            </div>
            <span className="text-[11px] text-text-muted mt-0.5 block">
              Dynamic calculation
            </span>
          </div>

          {/* Now Serving at Counter */}
          <div className="p-4 rounded-xl bg-app-secondary border border-border-light text-center">
            <span className="text-xs text-text-secondary font-medium block mb-1">
              Now Serving Counter
            </span>
            <div className="text-2xl font-bold font-tabular text-brand-teal">
              {currentlyServingToken || 'None active'}
            </div>
            <span className="text-[11px] text-text-muted mt-0.5 block">
              Current desk token
            </span>
          </div>
        </div>

        {/* Token Meta Information */}
        <div className="mt-6 pt-6 border-t border-border-light flex flex-wrap items-center justify-between gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-text-muted" />
            <span>Counter: <strong className="text-text-primary">{tokenData.serviceId?.location}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-text-muted" />
            <span>Joined: <strong className="text-text-primary">{new Date(tokenData.joinedAt).toLocaleTimeString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Cancellation Action when in waiting state */}
      {isWaiting && (
        <div className="bg-app-surface border border-border-light rounded-2xl p-5 shadow-card flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Need to step away?
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              You can cancel your waiting token so the counter advances for others.
            </p>
          </div>
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-semantic-danger hover:bg-semantic-dangerBg border border-semantic-danger/20 transition shrink-0"
          >
            Cancel Token
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        title={`Cancel Token ${tokenData.tokenNumber}?`}
        message="Are you sure you want to cancel your place in this virtual queue? You will lose your current spot and need to join again."
        confirmText="Yes, Cancel Token"
        cancelText="Keep My Spot"
        confirmVariant="danger"
        loading={cancelLoading}
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
};

export default MyQueueLive;
