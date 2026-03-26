import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, User, Filter } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { tasksAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export default function Tasks() {
  const { isManager } = useAuth();
  const [filter, setFilter] = useState({ status: '', assigned_to: '' });
  const [users, setUsers] = useState([]);
  const { data: tasks, loading, error, execute } = useApi(() => tasksAPI.list(filter));
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    execute();
    usersAPI.list().then((r) => setUsers(r.data || [])).catch(() => {});
  }, []);

  const handleFilterChange = (key, value) => {
    setFilter({ ...filter, [key]: value });
  };

  useEffect(() => {
    execute();
  }, [filter]);

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || '',
      priority: task.priority || 'medium',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('กรุณากรอกชื่องาน');
      return;
    }
    setSaving(true);
    try {
      if (editTask) {
        await tasksAPI.update(editTask.id, form);
      } else {
        await tasksAPI.create(form);
      }
      setShowForm(false);
      execute();
    } catch (err) {
      setFormError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await tasksAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      execute();
    } catch (err) {
      alert(err.response?.data?.message || 'ลบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (task) => {
    try {
      await tasksAPI.complete(task.id);
      execute();
    } catch (err) {
      alert('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const getStatusLabel = (s) => ({
    pending: 'รอดำเนินการ',
    in_progress: 'กำลังทำ',
    completed: 'เสร็จแล้ว',
  }[s] || s);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">งาน</h1>
        {isManager() && (
          <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            สร้างงาน
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            className="input py-1.5 text-sm w-auto"
            value={filter.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="in_progress">กำลังทำ</option>
            <option value="completed">เสร็จแล้ว</option>
          </select>
        </div>
        <select
          className="input py-1.5 text-sm w-auto"
          value={filter.assigned_to}
          onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
        >
          <option value="">ทุกคน</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorAlert message={error} onRetry={execute} />
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="ไม่มีงาน"
          description="สร้างงานใหม่เพื่อเริ่มต้น"
          action={isManager() ? { label: 'สร้างงาน', onClick: openCreate } : null}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="card p-4 flex items-start gap-4">
              <button
                onClick={() => handleComplete(task)}
                className={`mt-0.5 p-1 rounded-full transition-colors ${
                  task.status === 'completed'
                    ? 'text-green-500'
                    : 'text-gray-300 hover:text-green-500'
                }`}
              >
                <CheckCircle size={20} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  <span className={`badge ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-600'}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  {task.priority === 'high' && (
                    <span className="badge bg-red-100 text-red-700">ด่วน</span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {task.assigned_to_name && (
                    <span className="flex items-center gap-1">
                      <User size={12} /> {task.assigned_to_name}
                    </span>
                  )}
                  {task.due_date && <span>📅 {task.due_date}</span>}
                </div>
              </div>

              {isManager() && (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(task)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(task)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editTask ? 'แก้ไขงาน' : 'สร้างงานใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่องาน *</label>
                <input
                  type="text"
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น ฉีดพ่นยาฆ่าแมลง"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">มอบหมายให้</label>
                  <select
                    className="input"
                    value={form.assigned_to}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  >
                    <option value="">-- เลือก --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ความด่วน</label>
                  <select
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
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ครบกำหนด</label>
                <input
                  type="date"
                  className="input"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="ลบงาน"
        message={`ต้องการลบงาน "${deleteTarget?.title}" หรือไม่?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}
