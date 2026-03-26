import { AlertCircle, RefreshCw } from 'lucide-react';

export function LoadingSpinner({ size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <div className="flex justify-center items-center py-8" role="status" aria-label="กำลังโหลด">
      <RefreshCw className={`${sizeClass} animate-spin text-green-600`} aria-hidden="true" />
    </div>
  );
}

export function ErrorAlert({ message, onRetry }) {
  return (
    <div
      className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
      role="alert"
    >
      <AlertCircle size={20} aria-hidden="true" />
      <span className="flex-1 text-sm">{message || 'เกิดข้อผิดพลาด'}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium hover:underline">
          ลองใหม่
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon size={48} className="text-gray-300 mb-4" aria-hidden="true" />}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ConfirmModal({ open, title, message, onConfirm, onCancel, loading, error }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
        <h3 id="confirm-modal-title" className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        {error && <p className="text-sm text-danger mb-4" role="alert">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn btn-secondary" disabled={loading}>ยกเลิก</button>
          <button onClick={onConfirm} className="btn btn-danger" disabled={loading} aria-busy={loading}>
            {loading ? 'กำลัง...' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  );
}
