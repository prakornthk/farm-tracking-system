import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, User, Filter, Loader2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { tasksAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

// ── Design Tokens ──────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:     'badge badge-warning',
  in_progress: 'badge badge-info',
  completed:   'badge badge-success',
};

const STATUS_LABELS = {
  pending:     'รอดำเนินการ',
  in_progress: 'กำลังทำ',
  completed:   'เสร็จแล้ว',
};

const PRIORITY_COLORS = {
  high:   'badge badge-danger',
  medium: 'badge badge-warning',
  low:    'badge badge-neutral',
};

const PRIORITY_LABELS = {
  high:   'ด่วน',
  medium: 'ปานกลาง',
  low:    'ต่ำ',
};

const ROLE_LABELS = {
  owner:   'เจ้าของ',
  manager: 'ผู้จัดการ',
  worker: 'พนักงาน',
};

// ── Helpers ────────────────────────────────────────────────────────
const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
};

export default function Tasks() {
  const { isManager } = useAuth();
  const [filter, setFilter] = useState({ status: '', assigned_to: '' });
  const [users, setUsers] = useState([]);
  const { data: tasks, loading, error, execute } = useApi(() => tasksAPI.list(filter));
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', assigned_users: [], due_date: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    execute();
    usersAPI.list().then((r) => setUsers(r.data?.data || [])).catch(() => setUsers([]));
  }, []);

  useEffect(() => { execute(); }, [filter]);

  const handleFilterChange = (key, value) => setFilter({ ...filter, [key]: value });

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', assigned_users: [], due_date: '', priority: 'medium' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      assigned_users: task.assignments?.map(a => a.user_id) || [],
      due_date: task.due_date || '',
      priority: task.priority || 'medium',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('กรุณากรอกชื่องาน'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.assigned_users.length === 0) delete payload.assigned_users;
      if (editTask) await tasksAPI.update(editTask.id, payload);
      else await tasksAPI.create(payload);
      setShowForm(false);
      execute();
    } catch (err) {
      setFormError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError('');
    setSaving(true);
    try {
      await tasksAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      execute();
    } catch (err) {
      setActionError(err.response?.data?.message || 'ลบไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  const handleComplete = async (task) => {
    try { await tasksAPI.complete(task.id); execute(); }
    catch (err) { setActionError(err.response?.data?.message || 'ไม่สามารถอัปเดตสถานะได้'); }
  };

  return (
    <div>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">งาน</h1>
          <p className="section-subtitle">จัดการงานและการมอบหมาย</p>
        </div>
        {isManager() && (
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} />สร้างงาน
          </button>
        )}
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <Filter size={14} className="text-gray-400 flex-shrink-0 ml-1" />
        <select
          className="input py-1.5 text-sm w-auto min-w-[120px]"
          value={filter.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          aria-label="กรองตามสถานะ"
        >
          <option value="">ทุกสถานะ</option>
          <option value="pending">รอดำเนินการ</option>
          <option value="in_progress">กำลังทำ</option>
          <option value="completed">เสร็จแล้ว</option>
        </select>
        <select
          className="input py-1.5 text-sm w-auto min-w-[140px]"
          value={filter.assigned_to}
          onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
          aria-label="กรองตามผู้รับผิดชอบ"
        >
          <option value="">ทุกคน</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* ── Action Error ───────────────────────────────────────────── */}
      {actionError && <ErrorAlert message={actionError} onRetry={() => setActionError('')} />}

      {/* ── Loading / Error / Empty ─────────────────────────────────── */}
      {loading ? <LoadingSpinner />
       : error ? <ErrorAlert message={error} onRetry={execute} />
       : !tasks || tasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="ไม่มีงาน"
          description="สร้างงานใหม่เพื่อเริ่มต้น"
          action={isManager() ? { label: 'สร้างงาน', onClick: openCreate } : null}
        />
      ) : (
        /* ── Task List ─────────────────────────────────────────── */
        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue = isOverdue(task.due_date);
            return (
              <div
                key={task.id}
                className="card-padded flex items-start gap-3 hover:shadow-md hover:border-gray-200 transition-all duration-150 group"
              >
                {/* Complete Toggle */}
                <button
                  onClick={() => handleComplete(task)}
                  className={`mt-0.5 p-0.5 rounded-full flex-shrink-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green-600 ${
                    task.status === 'completed'
                      ? 'text-green-600 ring-2 ring-green-100'
                      : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                  }`}
                  aria-label={task.status === 'completed' ? 'งานเสร็จแล้ว' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
                >
                  <CheckCircle size={18} aria-hidden="true" />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title + Badges row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3
                      className={`text-sm font-medium transition-colors ${
                        task.status === 'completed'
                          ? 'line-through text-gray-400'
                          : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <span className={STATUS_COLORS[task.status] || 'badge badge-neutral'}>
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                    {task.priority && (
                      <span className={PRIORITY_COLORS[task.priority] || 'badge badge-neutral'}>
                        {PRIORITY_LABELS[task.priority] || task.priority}
                      </span>
                    )}
                    {overdue && task.status !== 'completed' && (
                      <span className="badge badge-danger animate-pulse">เลยกำหนด!</span>
                    )}
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {task.assignments?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <User size={11} aria-hidden="true" />
                        {task.assignments.map(a => a.user?.name || 'Unknown').join(', ')}
                      </span>
                    )}
                    {task.due_date && (
                      <span className={`flex items-center gap-1 ${overdue && task.status !== 'completed' ? 'text-red-500 font-medium' : ''}`}>
                        📅 {task.due_date}
                        {overdue && task.status !== 'completed' && ' (เลยกำหนด)'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isManager() && (
                  <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => openEdit(task)}
                      className="btn-icon"
                      aria-label={`แก้ไขงาน ${task.title}`}
                    >
                      <Edit2 size={14} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(task)}
                      className="btn-icon hover:text-red-600"
                      aria-label={`ลบงาน ${task.title}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Form Modal ───────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-form-title"
          >
            <h2 id="task-form-title" className="text-lg font-semibold text-gray-900 mb-5">
              {editTask ? 'แก้ไขงาน' : 'สร้างงานใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="task-title" className="label">ชื่องาน *</label>
                <input
                  id="task-title"
                  type="text"
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น ฉีดพ่นยาฆ่าแมลง"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="task-description" className="label">รายละเอียด</label>
                <textarea
                  id="task-description"
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="อธิบายรายละเอียดเพิ่มเติม..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="task-assignee" className="label">มอบหมายให้</label>
                  <select
                    id="task-assignee"
                    className="input"
                    value={form.assigned_users[0] || ''}
                    onChange={(e) =>
                      setForm({ ...form, assigned_users: e.target.value ? [e.target.value] : [] })
                    }
                  >
                    <option value="">-- เลือกพนักงาน --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({ROLE_LABELS[u.role] || u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="task-priority" className="label">ความด่วน</label>
                  <select
                    id="task-priority"
                    className="input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">ด่วน</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="task-due-date" className="label">วันที่ครบกำหนด</label>
                <input
                  id="task-due-date"
                  type="date"
                  className="input"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 flex items-center gap-1.5" role="alert">
                  <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" aria-hidden="true" />
                  {formError}
                </p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-w-[88px]"
                  disabled={saving}
                  aria-busy={saving}
                >
                  {saving ? (
                    <><Loader2 size={14} className="animate-spin" aria-hidden="true" />กำลังบันทึก...</>
                  ) : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteTarget}
        title="ลบงาน"
        message={`ต้องการลบงาน "${deleteTarget?.title}" หรือไม่?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setActionError(''); }}
        loading={saving}
        error={actionError}
      />
    </div>
  );
}
