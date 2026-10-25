import React, { useState, useEffect } from 'react';
import apiService from '../../api/apiService';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Users,
  X,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const ServiceManagement = () => {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    codePrefix: '',
    description: '',
    category: 'Education',
    location: '',
    averageServiceDuration: 10,
    maximumQueueCapacity: 50,
    assignedStaffIds: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, staffRes] = await Promise.all([
        apiService.getServices(),
        apiService.getStaffList(),
      ]);

      if (servicesRes.data?.success) {
        setServices(servicesRes.data.services || []);
      }
      if (staffRes.data?.success) {
        setStaffList(staffRes.data.staff || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      codePrefix: '',
      description: '',
      category: 'Education',
      location: '',
      averageServiceDuration: 10,
      maximumQueueCapacity: 50,
      assignedStaffIds: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      codePrefix: service.codePrefix,
      description: service.description,
      category: service.category || 'Education',
      location: service.location,
      averageServiceDuration: service.averageServiceDuration,
      maximumQueueCapacity: service.maximumQueueCapacity,
      assignedStaffIds: service.assignedStaffIds?.map((s) => s._id || s) || [],
    });
    setModalOpen(true);
  };

  const handleStaffCheckbox = (staffId) => {
    setFormData((prev) => {
      const exists = prev.assignedStaffIds.includes(staffId);
      if (exists) {
        return {
          ...prev,
          assignedStaffIds: prev.assignedStaffIds.filter((id) => id !== staffId),
        };
      } else {
        return {
          ...prev,
          assignedStaffIds: [...prev.assignedStaffIds, staffId],
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingService) {
        const res = await apiService.updateService(editingService._id, formData);
        if (res.data?.success) {
          toast.success('Service updated successfully.');
        }
      } else {
        const res = await apiService.createService(formData);
        if (res.data?.success) {
          toast.success('New service created.');
        }
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.message || 'Error saving service.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate "${name}"?`)) return;
    try {
      const res = await apiService.deleteService(id);
      if (res.data?.success) {
        toast.info('Service deactivated.');
        await fetchData();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading service catalog..." />;
  }

  return (
    <div>
      <PageHeader
        title="Services & Counter Desks"
        subtitle="Configure physical service departments, queue capacities, and staff operators."
      >
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-indigo hover:bg-brand-indigoHover transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </PageHeader>

      {/* Services Table */}
      <div className="bg-app-surface border border-border-light rounded-2xl p-6 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-app-secondary/60 text-xs font-semibold uppercase text-text-secondary border-b border-border-light">
              <tr>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Pace (mins)</th>
                <th className="py-3 px-4">Max Capacity</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {services.map((service) => (
                <tr key={service._id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold font-tabular text-brand-navy">
                    {service.codePrefix}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-text-primary">
                    {service.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-text-secondary">
                    {service.category}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-text-secondary">
                    {service.location}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-tabular">
                    {service.averageServiceDuration}m
                  </td>
                  <td className="py-3.5 px-4 text-xs font-tabular">
                    {service.maximumQueueCapacity} tokens
                  </td>
                  <td className="py-3.5 px-4 text-xs text-text-primary">
                    {service.assignedStaffIds?.length > 0 ? (
                      <span className="truncate max-w-[150px] inline-block">
                        {service.assignedStaffIds.map((s) => s.name).join(', ')}
                      </span>
                    ) : (
                      <span className="text-text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-brand-indigo hover:bg-brand-softIndigo/50 transition"
                        title="Edit service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service._id, service.name)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-semantic-danger hover:bg-red-50 transition"
                        title="Deactivate service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-app-surface border border-border-light rounded-2xl max-w-lg w-full shadow-modal overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border-light">
              <h3 className="text-base font-bold text-text-primary">
                {editingService ? 'Edit Service' : 'Add New Service Counter'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Student Administration"
                    className="w-full px-3 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Prefix Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formData.codePrefix}
                    onChange={(e) =>
                      setFormData({ ...formData, codePrefix: e.target.value.toUpperCase() })
                    }
                    placeholder="ADM"
                    className="w-full px-3 py-2 text-sm bg-app-bg border border-border-light rounded-xl font-bold uppercase font-tabular focus:outline-hidden focus:border-brand-indigo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain what transactions are handled here..."
                  className="w-full px-3 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo"
                  >
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Banking & Finance">Banking & Finance</option>
                    <option value="Public Administration">Public Administration</option>
                    <option value="Salon & Wellness">Salon & Wellness</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Location / Desk
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Counter 1, Block A"
                    className="w-full px-3 py-2 text-sm bg-app-bg border border-border-light rounded-xl focus:outline-hidden focus:border-brand-indigo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Avg Service Time (mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={formData.averageServiceDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        averageServiceDuration: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-app-bg border border-border-light rounded-xl font-tabular focus:outline-hidden focus:border-brand-indigo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Daily Token Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={formData.maximumQueueCapacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maximumQueueCapacity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-app-bg border border-border-light rounded-xl font-tabular focus:outline-hidden focus:border-brand-indigo"
                  />
                </div>
              </div>

              {/* Staff Assignment Multi-check */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Assign Staff Operators
                </label>
                <div className="border border-border-light rounded-xl p-3 bg-app-bg max-h-32 overflow-y-auto space-y-2">
                  {staffList.length === 0 ? (
                    <span className="text-xs text-text-muted">No staff accounts found.</span>
                  ) : (
                    staffList.map((staff) => (
                      <label
                        key={staff._id}
                        className="flex items-center gap-2 text-xs text-text-primary cursor-pointer hover:text-brand-indigo"
                      >
                        <input
                          type="checkbox"
                          checked={formData.assignedStaffIds.includes(staff._id)}
                          onChange={() => handleStaffCheckbox(staff._id)}
                          className="rounded-sm border-border-strong text-brand-indigo focus:ring-0"
                        />
                        <span>
                          {staff.name} ({staff.email})
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-text-secondary bg-white border border-border-light rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-indigo hover:bg-brand-indigoHover rounded-xl transition shadow-sm disabled:opacity-70"
                >
                  {submitting ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
