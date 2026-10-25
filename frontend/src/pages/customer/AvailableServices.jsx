import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiService from '../../api/apiService';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Search,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AvailableServices = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { activeToken, setActiveToken } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await apiService.getServices();
      if (res.data?.success) {
        setServices(res.data.services || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch active services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filter by category and search term
  useEffect(() => {
    let result = [...services];

    if (selectedCategory !== 'All') {
      result = result.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.codePrefix.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
      );
    }

    setFilteredServices(result);
  }, [services, selectedCategory, searchQuery]);

  const categories = [
    'All',
    'Education',
    'Healthcare',
    'Banking & Finance',
    'Public Administration',
    'Salon & Wellness',
    'Other',
  ];

  const handleJoinQueue = async (serviceId, serviceName) => {
    try {
      setJoiningId(serviceId);
      const res = await apiService.joinQueue(serviceId);

      if (res.data?.success) {
        toast.success(`You joined the queue! Your token is ${res.data.token.tokenNumber}.`);
        setActiveToken(res.data.token);
        navigate('/customer/my-queue');
      }
    } catch (err) {
      if (err.code === 'DUPLICATE_ACTIVE_TOKEN') {
        toast.warning(err.message || 'You already have an active token in this queue.');
        navigate('/customer/my-queue');
      } else {
        toast.error(err.message || 'Could not join queue at this time.');
      }
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading available service counters..." />;
  }

  return (
    <div>
      <PageHeader
        title="Available Services & Counters"
        subtitle="Browse department desks, check live waiting times, and join virtual queues."
      />

      {/* Active Token notification banner */}
      {activeToken && (
        <div className="mb-6 p-4 rounded-xl bg-brand-softIndigo border border-brand-indigo/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-brand-indigo shrink-0" />
            <div className="text-xs sm:text-sm text-text-primary">
              <span className="font-semibold">Notice:</span> You already hold active token{' '}
              <span className="font-bold font-tabular text-brand-indigo">{activeToken.tokenNumber}</span> for{' '}
              {activeToken.serviceId?.name || 'an active queue'}.
            </div>
          </div>
          <button
            onClick={() => navigate('/customer/my-queue')}
            className="text-xs font-semibold text-brand-indigo hover:text-brand-indigoHover underline shrink-0 ml-2"
          >
            View Live Status
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-app-surface border border-border-light rounded-2xl p-4 sm:p-5 shadow-card mb-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by counter, service name, code..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-brand-indigo text-white shadow-xs'
                    : 'bg-app-bg text-text-secondary hover:text-text-primary hover:bg-slate-100 border border-border-light'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <EmptyState
          title="No matching services found"
          description="Try adjusting your search query or category filters to find available service counters."
          action={
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-indigo text-white hover:bg-brand-indigoHover transition"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const session = service.queueSession;
            const isOpen = session?.status === 'open';
            const waitingCount = session?.waitingCount || 0;
            const estWait = session?.estimatedWaitMinutes || 0;
            const isUserInThisQueue = activeToken?.serviceId?._id === service._id;

            return (
              <div
                key={service._id}
                className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card hover:shadow-cardHover transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-softIndigo text-brand-indigo font-tabular border border-brand-indigo/15">
                      {service.codePrefix}
                    </span>
                    <StatusBadge status={isOpen ? 'open' : 'closed'} size="sm" />
                  </div>

                  <h3 className="text-base font-bold text-text-primary mb-1.5">
                    {service.name}
                  </h3>

                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-4">
                    {service.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="truncate">{service.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span>Avg Duration: {service.averageServiceDuration} mins / customer</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-light">
                  <div className="flex items-center justify-between mb-4 text-xs">
                    <div>
                      <span className="text-text-muted block">Queue Status</span>
                      <span className="font-bold font-tabular text-text-primary text-sm">
                        {waitingCount} waiting
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-text-muted block">Estimated Wait</span>
                      <span className="font-bold font-tabular text-semantic-warning text-sm">
                        {isOpen ? `~${estWait} mins` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {isUserInThisQueue ? (
                    <button
                      onClick={() => navigate('/customer/my-queue')}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-brand-indigo bg-brand-softIndigo border border-brand-indigo/20 hover:bg-brand-indigo hover:text-white transition flex items-center justify-center gap-2"
                    >
                      <span>You are in queue ({activeToken.tokenNumber})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinQueue(service._id, service.name)}
                      disabled={!isOpen || joiningId === service._id}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-text-muted disabled:cursor-not-allowed"
                    >
                      {joiningId === service._id ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{isOpen ? 'Join Virtual Queue' : 'Queue Currently Closed'}</span>
                          {isOpen && <ArrowRight className="w-3.5 h-3.5" />}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailableServices;
