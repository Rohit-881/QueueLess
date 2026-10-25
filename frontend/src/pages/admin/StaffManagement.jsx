import React, { useState, useEffect } from 'react';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Users, Shield, UserCheck, User, Search, Check, AlertCircle, UserPlus, X } from 'lucide-react';

export const StaffManagement = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  // New User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAllUsers();
      if (res.data?.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingId(userId);
      const res = await apiService.updateUser(userId, { role: newRole });
      if (res.data?.success) {
        toast.success(`User role updated to ${newRole}.`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      setUpdatingId(userId);
      const res = await apiService.updateUser(userId, { isActive: !currentActive });
      if (res.data?.success) {
        toast.info(`User ${!currentActive ? 'activated' : 'deactivated'}.`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: !currentActive } : u))
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiService.createUser(newUser);
      if (res.data?.success) {
        toast.success(`User "${newUser.name}" created with role "${newUser.role}".`);
        setIsModalOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'staff' });
        await fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner label="Loading staff directory and accounts..." />;
  }

  return (
    <div>
      <PageHeader
        title="Staff & User Directory"
        subtitle="Manage access privileges, promote authorized staff operators, and create new accounts."
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Account</span>
        </button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="bg-app-surface border border-border-light rounded-2xl p-4 sm:p-5 shadow-card mb-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto">
            {['All', 'staff', 'admin', 'customer'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                  roleFilter === role
                    ? 'bg-brand-indigo text-white shadow-xs'
                    : 'bg-app-bg text-text-secondary hover:text-text-primary border border-border-light'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-app-secondary/60 text-xs font-semibold uppercase text-text-secondary border-b border-border-light">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Change Privilege</th>
                <th className="py-3 px-4 text-right">Account Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredUsers.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {item.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-text-primary">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-text-secondary">
                    {item.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize border ${
                        item.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : item.role === 'staff'
                          ? 'bg-brand-softTeal text-brand-teal border-brand-teal/20'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        item.isActive ? 'text-semantic-success' : 'text-semantic-danger'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isActive ? 'bg-semantic-success' : 'bg-semantic-danger'
                        }`}
                      />
                      <span>{item.isActive ? 'Active' : 'Deactivated'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={item.role}
                      disabled={updatingId === item._id}
                      onChange={(e) => handleRoleChange(item._id, e.target.value)}
                      className="px-2.5 py-1 text-xs font-medium bg-app-bg border border-border-light rounded-lg focus:outline-hidden text-text-primary"
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff Operator</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleActive(item._id, item.isActive)}
                      disabled={updatingId === item._id}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                        item.isActive
                          ? 'text-semantic-danger hover:bg-red-50 border-red-200'
                          : 'text-semantic-success hover:bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      {item.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-light animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-light">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-softIndigo text-brand-indigo flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Create New Account</h3>
                  <p className="text-xs text-text-secondary">Add customer, staff, or admin user</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-app-bg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Robert Vance"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. robert.vance@queueless.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Account Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo font-medium"
                >
                  <option value="staff">Staff Operator (Desk / Counter Caller)</option>
                  <option value="admin">Administrator (Full Platform Control)</option>
                  <option value="customer">Customer (Patient / Student / Visitor)</option>
                </select>
                <p className="mt-1 text-[11px] text-text-muted">
                  Staff can call and manage queue tokens. Admins have complete access.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-light mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-app-bg border border-border-light transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
