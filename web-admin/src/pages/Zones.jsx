import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Map, ChevronRight, Grid3x3 } from 'lucide-react';
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
  const [deleteError, setDeleteError] = useState('');

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
    setDeleteError('');
    setSaving(true);
    try {
      await zonesAPI.delete(farmId, deleteTarget.id);
      setDeleteTarget(null);
      execute();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'ลบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/farms')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">โซนในฟาร์ม</h1>
            <p className="text-sm text-gray-500 mt-0.5">ฟาร์ม #{farmId}</p>
          </div>
        </div>
        {isManager() && (
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} />
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
        <div className="space-y-2">
          {zones.map((zone) => (
            <div key={zone.id} className="zone-row group">
              <div className="zone-row-indicator">
                <Grid3x3 size={18} className="text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900">{zone.name}</h3>
                {zone.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{zone.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isManager() && (
                  <>
                    <button onClick={() => openEdit(zone)} className="btn-icon" aria-label={`แก้ไขโซน ${zone.name}`}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(zone)} className="btn-icon hover:text-red-600" aria-label={`ลบโซน ${zone.name}`}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                <Link
                  to={`/zones/${zone.id}/plots`}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  เปิด <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{editZone ? 'แก้ไขโซน' : 'เพิ่มโซนใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4" aria-label={editZone ? 'แก้ไขโซน' : 'เพิ่มโซนใหม่'}>
              <div>
                <label htmlFor="zone-name" className="label">ชื่อโซน *</label>
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
                <label htmlFor="zone-description" className="label">รายละเอียด</label>
                <textarea
                  id="zone-description"
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>
              {formError && <p className="text-sm text-danger" role="alert">{formError}</p>}
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
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
        loading={saving}
        error={deleteError}
      />
    </div>
  );
}
