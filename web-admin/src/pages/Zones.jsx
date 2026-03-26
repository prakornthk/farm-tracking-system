import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Grid3x3 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { zonesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

export default function Zones() {
  const { id: farmId } = useParams();
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const { data: zones, loading, error, execute } = useApi(() => zonesAPI.list(farmId));
  const [showForm, setShowForm] = useState(false);
  const [editZone, setEditZone] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    execute();
  }, [farmId]);

  const openCreate = () => {
    setEditZone(null);
    setForm({ name: '', description: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (zone) => {
    setEditZone(zone);
    setForm({ name: zone.name, description: zone.description || '' });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('กรุณากรอกชื่อโซน');
      return;
    }
    setSaving(true);
    try {
      if (editZone) {
        await zonesAPI.update(farmId, editZone.id, form);
      } else {
        await zonesAPI.create(farmId, form);
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
      await zonesAPI.delete(farmId, deleteTarget.id);
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
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/farms')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">โซนในฟาร์ม</h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">ฟาร์ม #{farmId}</p>
        {isManager() && (
          <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            เพิ่มโซน
          </button>
        )}
      </div>

      {!zones || zones.length === 0 ? (
        <EmptyState
          icon={Grid3x3}
          title="ยังไม่มีโซน"
          description="เพิ่มโซนเพื่อจัดกลุ่มแปลงปลูก"
          action={isManager() ? { label: 'เพิ่มโซน', onClick: openCreate } : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div key={zone.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">🗺️</div>
                {isManager() && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(zone)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(zone)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{zone.name}</h3>
              {zone.description && <p className="text-sm text-gray-400 mb-3">{zone.description}</p>}
              <Link
                to={`/zones/${zone.id}/plots`}
                className="inline-flex items-center gap-1 text-sm text-green-600 font-medium hover:underline"
              >
                ดูแปลง <span>→</span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editZone ? 'แก้ไขโซน' : 'เพิ่มโซนใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4" aria-label={editZone ? 'แก้ไขโซน' : 'เพิ่มโซนใหม่'}>
              <div>
                <label htmlFor="zone-name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อโซน *</label>
                <input
                  id="zone-name"
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น โซน A - ผัก leafy"
                />
              </div>
              <div>
                <label htmlFor="zone-description" className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  id="zone-description"
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม..."
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
        title="ลบโซน"
        message={`ต้องการลบโซน "${deleteTarget?.name}" หรือไม่?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}
