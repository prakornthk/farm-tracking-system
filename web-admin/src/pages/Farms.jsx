import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Map, ChevronRight } from 'lucide-react';
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

  useEffect(() => { execute(); }, []);

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
    if (!form.name.trim()) { setFormError('กรุณากรอกชื่อฟาร์ม'); return; }
    setSaving(true);
    try {
      if (editFarm) await farmsAPI.update(editFarm.id, form);
      else await farmsAPI.create(form);
      setShowForm(false);
      execute();
    } catch (err) {
      setFormError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
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
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">ฟาร์ม</h1>
          <p className="section-subtitle">จัดการฟาร์มและพื้นที่เพาะปลูก</p>
        </div>
        {isManager() && (
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} />
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
            <div key={farm.id} className="card-padded card-hover group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-primary-50 rounded-lg">
                    <Map size={16} className="text-primary-600" />
                  </span>
                </div>
                {isManager() && (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(farm)} className="btn-icon">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(farm)} className="btn-icon hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{farm.name}</h3>
              {farm.location && (
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <Map size={10} />{farm.location}
                </p>
              )}
              {farm.description && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{farm.description}</p>
              )}
              <Link
                to={`/farms/${farm.id}/zones`}
                className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium hover:underline"
              >
                ดูโซน <ChevronRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{editFarm ? 'แก้ไขฟาร์ม' : 'เพิ่มฟาร์มใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">ชื่อฟาร์ม *</label>
                <input type="text" className="input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น ฟาร์มสตรอว์เบอร์รี" />
              </div>
              <div>
                <label className="label">ที่อยู่/พื้นที่</label>
                <input type="text" className="input" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="เช่น จ.เชียงใหม่" />
              </div>
              <div>
                <label className="label">รายละเอียด</label>
                <textarea className="input" rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม..." />
              </div>
              {formError && <p className="text-sm text-danger">{formError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">ยกเลิก</button>
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
