import {
  AlertCircle,
  RefreshCw,
  Inbox,
  Plus,
  ChevronRight,
  Info,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

/* ─── Spinner ─── */
export function LoadingSpinner({ size = 'md' }) {
  const sizeClass =
    size === 'sm' ? 'w-4 h-4' :
    size === 'lg' ? 'w-8 h-8' :
    'w-6 h-6';
  return (
    <div className="flex justify-center items-center py-12" role="status" aria-label="กำลังโหลด">
      <RefreshCw className={`${sizeClass} animate-spin text-green-600`} aria-hidden="true" />
    </div>
  );
}

/* ─── Error Alert ─── */
export function ErrorAlert({ message, onRetry }) {
  return (
    <div
      className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm"
      role="alert"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle size={16} aria-hidden="true" />
      </div>
      <span className="flex-1 text-sm font-medium">{message || 'เกิดข้อผิดพลาด'}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-semibold text-red-600 hover:text-red-800 hover:underline px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
        >
          ลองใหม่
        </button>
      )}
    </div>
  );
}

/* ─── Empty State ─── */
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm"
        >
          {action.icon && <action.icon size={16} aria-hidden="true" />}
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ─── Confirm Modal ─── */
export function ConfirmModal({ open, title, message, onConfirm, onCancel, loading, confirmLabel = 'ยืนยัน', cancelLabel = 'ยกเลิก', variant = 'danger' }) {
  if (!open) return null;

  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : variant === 'primary'
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : 'bg-gray-900 hover:bg-gray-800 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all">
        <div className="flex items-start gap-4 mb-5">
          {variant === 'danger' && (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={20} className="text-red-600" aria-hidden="true" />
            </div>
          )}
          {variant === 'primary' && (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} className="text-green-600" aria-hidden="true" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 id="confirm-modal-title" className="text-base font-semibold text-gray-900">
              {title}
            </h3>
            {message && (
              <p id="confirm-modal-desc" className="text-sm text-gray-500 mt-1 leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${confirmClass}`}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'กำลัง...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Card ─── */
export function Card({ children, className = '', padding = 'md', hover = false }) {
  const paddingClass =
    padding === 'none' ? '' :
    padding === 'sm' ? 'p-4' :
    padding === 'lg' ? 'p-8' :
    'p-5';

  return (
    <div
      className={`
        bg-white rounded-2xl border border-gray-200 shadow-sm
        ${paddingClass}
        ${hover ? 'hover:shadow-md hover:border-gray-300 transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/* ─── Badge ─── */
export function Badge({ children, variant = 'default', size = 'md' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant] || variants.default}
        ${sizes[size] || sizes.md}
      `}
    >
      {children}
    </span>
  );
}

/* ─── Status Dot ─── */
export function StatusDot({ status, label }) {
  const config = {
    active:   { color: 'bg-green-500', pulse: false, text: 'ใช้งาน' },
    inactive: { color: 'bg-gray-400',   pulse: false, text: 'ไม่ใช้งาน' },
    pending:  { color: 'bg-amber-400',  pulse: true,  text: 'รอดำเนินการ' },
    success:  { color: 'bg-green-500',  pulse: false, text: 'สำเร็จ' },
    error:    { color: 'bg-red-500',    pulse: false, text: 'ล้มเหลว' },
    warning:  { color: 'bg-amber-400',  pulse: false, text: 'เตือน' },
  };

  const c = config[status] || config.inactive;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
      <span className={`relative flex h-2 w-2`}>
        {c.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${c.color}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${c.color}`} />
      </span>
      {label !== undefined ? label : c.text}
    </span>
  );
}

/* ─── Info Block ─── */
export function InfoBlock({ icon: Icon = Info, label, value, className = '' }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={14} className="text-gray-500" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-gray-900 font-semibold truncate">{value ?? '—'}</p>
      </div>
    </div>
  );
}

/* ─── Section Header ─── */
export function SectionHeader({ title, description, action }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && (
        <div className="flex-shrink-0">{action}</div>
      )}
    </div>
  );
}

/* ─── Divider ─── */
export function Divider({ label }) {
  if (label) {
    return (
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    );
  }
  return <div className="h-px bg-gray-200 my-4" />;
}

/* ─── Toolbar ─── */
export function Toolbar({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 mb-4 ${className}`}>
      {children}
    </div>
  );
}

/* ─── Stat Card ─── */
export function StatCard({ icon: Icon, label, value, trend, trendUp }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Icon size={20} className="text-green-600" aria-hidden="true" />
          </div>
        )}
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
