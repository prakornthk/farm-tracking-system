import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, User, Filter } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { tasksAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

const STATUS_COLORS = {
  pending:   'badge badge-warning',
  in_progress: 'badge badge-info',
  completed: 'badge badge-success',
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
    usersAPI.list().then((r) => setUsers(r.data || [])).catch(() => setUsers([]));
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

  const getStatusLabel = (s) => ({ pending: 'รอดำเนินการ', in_progress: 'กำลังทำ', completed: 'เสร็จแล้ว' }[s] || s);

  return (
    <div>
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Filter size={14} className="text-gray-400 flex-shrink-0" />
        <select className="input py-1.5 text-sm w-auto" value={filter.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="pending">รอดำเนินการ</option>
          <option value="in_progress">กำลังทำ</option>
          <option value="completed">เสร็จแล้ว</option>
        </select>
        <select className="input py-1.5 text-sm w-auto" value={filter.assigned_to}
          onChange={(e) => handleFilterChange('assigned_to', e.target.value)}>
          <option value="">ทุกคน</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {actionError && <ErrorAlert message={actionError} onRetry={() => setActionError('')} />}
      {loading ? <LoadingSpinner />
       : error ? <ErrorAlert message={error} onRetry={execute} />
       : !tasks || tasks.length === 0 ? (
        <EmptyState icon={CheckCircle} title="ไม่มีงาน"
          description="สร้างงานใหม่เพื่อเริ่มต้น"
          action={isManager() ? { label: 'สร้างงาน', onClick: openCreate } : null} />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="card-padded flex items-start gap-3">
              <button
                onClick={() => handleComplete(task)}
                className={`mt-0.5 p-0.5 rounded-full flex-shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green-600 ${
                  task.status === 'completed' ? 'text-green-600' : 'text-gray-300 hover:text-green-600'}`}
                aria-label={task.status === 'completed' ? 'งานเสร็จแล้ว' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
              >
                <CheckCircle size={18} aria-hidden="true" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h3 className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  <span className={STATUS_COLORS[task.status] || 'badge badge-neutral'}>{getStatusLabel(task.status)}</span>
                  {task.priority === 'high' && <span className="badge badge-danger">ด่วน</span>}
                </div>
                {task.description && <p className="text-xs text-gray-500 mb-2">{task.description}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {task.assignments?.length > 0 && (
                    <span className="flex items-center gap-1"><User size={11} />{task.assignments.map(a => a.user?.name || 'Unknown').join(', ')}</span>
                  )}
                  {task.due_date && <span>📅 {task.due_date}</span>}
                </div>
              </div>
              {isManager() && (
                <div className="flex gap-0.5 flex-shrink-0">
                  <button onClick={() => openEdit(task)} className="btn-icon" aria-label="แก้ไขงาน"><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteTarget(task)} className="btn-icon hover:text-danger" aria-label="ลบงาน"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{editTask ? 'แก้ไขงาน' : 'สร้างงานใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">ชื่องาน *</label>
                <input type="text" className="input" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น ฉีดพ่นยาฆ่าแมลง" />
              </div>
              <div>
                <label className="label">รายละเอียด</label>
                <textarea className="input" rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">มอบหมายให้</label>
                  <select className="input" value={form.assigned_users[0] || ''}
                    onChange={(e) => setForm({ ...form, assigned_users: e.target.value ? [e.target.value] : [] })}>
                    <option value="">-- เลือก --</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">ความด่วน</label>
                  <select className="input" value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">ด่วน</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">วันที่ครบกำหนด</label>
                <input type="date" className="input" value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              {formError && <p className="text-sm text-danger">{formError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal open={!!deleteTarget} title="ลบงาน"
        message={`ต้องการลบงาน "${deleteTarget?.title}" หรือไม่?`}
        onConfirm={handleDelete} onCancel={() => { setDeleteTarget(null); setActionError(''); }}
        loading={saving} error={actionError} />
    </div>
  );
}
