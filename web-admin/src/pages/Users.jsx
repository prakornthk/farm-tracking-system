import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users as UsersIcon, Search } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-700 ring-purple-200',
  manager: 'bg-blue-100 text-blue-700 ring-blue-200',
  worker: 'bg-green-100 text-green-700 ring-green-200',
};

const ROLE_LABELS = {
  owner: 'เจ้าของ',
  manager: 'ผู้จัดการ',
  worker: 'พนักงาน',
};

// Avatar colors based on name hash for visual variety
const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
];

function getAvatarColor(name = '') {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function Users() {
  const { isOwner } = useAuth();
  const { data: users, loading, error, execute } = useApi(usersAPI.list);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'worker', line_user_id: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    execute();
  }, []);

  // Filter users by search
  const filteredUsers = users?.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

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
    setDeleteError('');
    setSaving(true);
    try {
      await usersAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      execute();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'ลบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner()) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <UsersIcon size={32} className="text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        <p className="text-sm text-gray-400 mt-1">ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์เข้าถึง</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ผู้ใช้งาน</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users?.length ?? 0} คนในระบบ
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2 shadow-sm hover:shadow">
          <Plus size={18} />
          เพิ่มผู้ใช้
        </button>
      </div>

      {/* Search */}
      {users && users.length > 0 && (
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหรืออีเมล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg
                       text-sm placeholder:text-gray-400
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                       transition-all duration-150"
          />
        </div>
      )}

      {/* Content */}
      {!users || users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="ยังไม่มีผู้ใช้"
          description="เพิ่มผู้ใช้งานคนแรกเพื่อเริ่มต้น"
          action={{ label: 'เพิ่มผู้ใช้', onClick: openCreate }}
        />
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Search size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">ไม่พบผู้ใช้ที่ค้นหา</p>
          <button onClick={() => setSearchQuery('')} className="text-sm text-primary-600 hover:underline mt-2">
            ล้างการค้นหา
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ผู้ใช้งาน
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    อีเมล
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group hover:bg-gray-50/60 transition-colors duration-100"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center
                                      text-sm font-semibold ${getAvatarColor(user.name)}`}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 block">{user.name}</span>
                          <span className="text-xs text-gray-400 md:hidden">
                            {user.email || '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {user.email || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                    ring-1 ring-inset ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600 ring-gray-200'}`}
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label={`แก้ไขผู้ใช้ ${user.name}`}
                          title="แก้ไข"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label={`ลบผู้ใช้ ${user.name}`}
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-modal-title"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 id="form-modal-title" className="text-lg font-bold text-gray-900">
                {editUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="ปิด"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 5L5 15M5 5l10 10" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" aria-label={editUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}>
              <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  id="user-name"
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="กรอกชื่อ-นามสกุล"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  อีเมล
                </label>
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
                <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-1.5">
                  บทบาท
                </label>
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
                <label htmlFor="user-line-id" className="block text-sm font-medium text-gray-700 mb-1.5">
                  LINE User ID
                </label>
                <input
                  id="user-line-id"
                  type="text"
                  className="input"
                  value={form.line_user_id}
                  onChange={(e) => setForm({ ...form, line_user_id: e.target.value })}
                  placeholder="Uxxxx... (optional)"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      กำลังบันทึก...
                    </span>
                  ) : (
                    'บันทึก'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="ยืนยันการลบ"
        message={`ต้องการลบผู้ใช้ "${deleteTarget?.name}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
        loading={saving}
        error={deleteError}
      />
    </div>
  );
}
