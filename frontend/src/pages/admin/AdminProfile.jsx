import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiService from '../../api/apiService';
import PageHeader from '../../components/common/PageHeader';
import { Shield, User, Mail, Database } from 'lucide-react';

export const AdminProfile = () => {
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
        toast.success('Admin profile updated.');
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
        title="Admin Settings & Profile"
        subtitle="Master system administrator credentials and maintenance."
      />

      <div className="bg-app-surface border border-border-light rounded-2xl p-6 sm:p-8 shadow-card mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-light">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-purple-600/20">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{user?.name}</h2>
            <p className="text-xs text-text-secondary">{user?.email}</p>
            <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize bg-purple-50 text-purple-700 border border-purple-200">
              Root Administrator
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Admin Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Admin Email
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
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-indigo" />
          <span>Database & Environment Details</span>
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed mb-4">
          The platform is connected to local MongoDB at <code className="px-1.5 py-0.5 rounded-md bg-app-secondary font-mono text-brand-navy">127.0.0.1:27017/queueless</code>. To reset demo data at any time, run <code className="px-1.5 py-0.5 rounded-md bg-app-secondary font-mono text-brand-navy">npm run seed</code> in the backend directory.
        </p>
      </div>
    </div>
  );
};

export default AdminProfile;
