import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Map } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { farmsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

export default function Farms() {
  const { isManager } = useAuth();
  const { data: farms, loading, error, execute } = useApi(farmsAPI.list);
  const [showForm, setShowForm] = useState(false);
  const [editFarm, setEditFarm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    execute();
  }, []);

  const openCreate = () => {
    setEditFarm(null);
    setForm({ name: '', location: '', description: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (farm) => {
    setEditFarm(farm);
    setForm({ name: farm.name, location: farm.location || '', description: farm.description || '' });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('กรุณากรอกชื่อฟาร์ม');
      return;
    }
    setSaving(true);
    try {
      if (editFarm) {
        await farmsAPI.update(editFarm.id, form);
      } else {
        await farmsAPI.create(form);
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
      await farmsAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      execute();
    } catch (err) {
      alert(err.response?.data?.message || 'ลบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ฟาร์ม</h1>
        {isManager() && (
          <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            เพิ่มฟาร์ม
          </button>
        )}
      </div>

      {!farms || farms.length === 0 ? (
        <EmptyState
          icon={Map}
          title="ยังไม่มีฟาร์ม"
          description="เริ่มต้นโดยการเพิ่มฟาร์มใหม่"
          action={isManager() ? { label: 'เพิ่มฟาร์ม', onClick: openCreate } : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm) => (
            <div key={farm.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">🌾</div>
                {isManager() && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(farm)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(farm)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{farm.name}</h3>
              {farm.location && <p className="text-sm text-gray-500 mb-2">📍 {farm.location}</p>}
              {farm.description && <p className="text-sm text-gray-400 mb-3">{farm.description}</p>}
              <Link
                to={`/farms/${farm.id}/zones`}
                className="inline-flex items-center gap-1 text-sm text-green-600 font-medium hover:underline"
              >
                ดูโซน <span>→</span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editFarm ? 'แก้ไขฟาร์ม' : 'เพิ่มฟาร์มใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อฟาร์ม *</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น ฟาร์มสตรอว์เบอร์รี"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่/พื้นที่</label>
                <input
                  type="text"
                  className="input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="เช่น จ.เชียงใหม่"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม..."
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
        title="ลบฟาร์ม"
        message={`ต้องการลบฟาร์ม "${deleteTarget?.name}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}
