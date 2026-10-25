import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmationModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be reversed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const confirmColors = {
    danger: 'bg-semantic-danger hover:bg-red-700 text-white',
    warning: 'bg-semantic-warning hover:bg-amber-700 text-white',
    primary: 'bg-brand-indigo hover:bg-brand-indigoHover text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-app-surface border border-border-light rounded-2xl max-w-md w-full shadow-modal overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between p-6 border-b border-border-light">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                confirmVariant === 'danger'
                  ? 'bg-semantic-dangerBg text-semantic-danger'
                  : confirmVariant === 'warning'
                  ? 'bg-semantic-warningBg text-semantic-warning'
                  : 'bg-brand-softIndigo text-brand-indigo'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-text-muted hover:text-text-primary p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-app-secondary border-t border-border-light">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-white border border-border-light rounded-xl shadow-sm hover:bg-slate-50 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-xl shadow-sm transition flex items-center gap-2 ${confirmColors[confirmVariant]}`}
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
