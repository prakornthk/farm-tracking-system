import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  worker: 'bg-green-100 text-green-700',
};

const ROLE_LABELS = {
  owner: 'เจ้าของ',
  manager: 'ผู้จัดการ',
  worker: 'พนักงาน',
};

export default function Users() {
  const { isOwner } = useAuth();
  const { data: users, loading, error, execute } = useApi(usersAPI.list);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'worker', line_user_id: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    execute();
  }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', role: 'worker', line_user_id: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'worker',
      line_user_id: user.line_user_id || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('กรุณากรอกชื่อ');
      return;
    }
    setSaving(true);
    try {
      if (editUser) {
        await usersAPI.update(editUser.id, form);
      } else {
        await usersAPI.create(form);
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
      await usersAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      execute();
    } catch (err) {
      alert(err.response?.data?.message || 'ลบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner()) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ผู้ใช้งาน</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          เพิ่มผู้ใช้
        </button>
      </div>

      {!users || users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="ยังไม่มีผู้ใช้"
          description="เพิ่มผู้ใช้งานใหม่"
          action={{ label: 'เพิ่มผู้ใช้', onClick: openCreate }}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">ชื่อ</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">อีเมล</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">บทบาท</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">
                        {user.name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{user.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(user)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 ml-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4" aria-label={editUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}>
              <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                <input
                  id="user-name"
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div>
                <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                <input
                  id="user-email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-1">บทบาท</label>
                <select
                  id="user-role"
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="worker">พนักงาน (Worker)</option>
                  <option value="manager">ผู้จัดการ (Manager)</option>
                  <option value="owner">เจ้าของ (Owner)</option>
                </select>
              </div>
              <div>
                <label htmlFor="user-line-id" className="block text-sm font-medium text-gray-700 mb-1">LINE User ID</label>
                <input
                  id="user-line-id"
                  type="text"
                  className="input"
                  value={form.line_user_id}
                  onChange={(e) => setForm({ ...form, line_user_id: e.target.value })}
                  placeholder="Uxxxx..."
                />
              </div>
              {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
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
        title="ลบผู้ใช้"
        message={`ต้องการลบผู้ใช้ "${deleteTarget?.name}" หรือไม่?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}
