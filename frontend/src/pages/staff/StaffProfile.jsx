import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiService from '../../api/apiService';
import PageHeader from '../../components/common/PageHeader';
import { User, Mail, ShieldCheck } from 'lucide-react';

export const StaffProfile = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const res = await apiService.updateProfile({ name: name.trim() });
      if (res.data?.success) {
        toast.success('Staff profile updated.');
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Staff Profile & Settings"
        subtitle="Operational credentials and authorized desk profile."
      />

      <div className="bg-app-surface border border-border-light rounded-2xl p-6 sm:p-8 shadow-card">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-light">
          <div className="w-14 h-14 rounded-2xl bg-brand-teal text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-brand-teal/20">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{user?.name}</h2>
            <p className="text-xs text-text-secondary">{user?.email}</p>
            <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize bg-brand-softTeal text-brand-teal border border-brand-teal/15">
              Authorized Service Officer
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-border-light rounded-xl text-text-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffProfile;
