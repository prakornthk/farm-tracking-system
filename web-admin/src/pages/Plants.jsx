import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Sprout } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { plantsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

const STATUS_COLORS = {
  healthy: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  sick: 'bg-red-100 text-red-700',
  dead: 'bg-gray-100 text-gray-500',
};

export default function Plants() {
  const { id: plotId } = useParams();
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const { data: plants, loading, error, execute } = useApi(() => plantsAPI.list(plotId));
  const [showForm, setShowForm] = useState(false);
  const [editPlant, setEditPlant] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', status: 'healthy', planted_date: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    execute();
  }, [plotId]);

  const openCreate = () => {
    setEditPlant(null);
    setForm({ name: '', status: 'healthy', planted_date: '', notes: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (plant) => {
    setEditPlant(plant);
    setForm({
      name: plant.name,
      status: plant.status,
      planted_date: plant.planted_date || '',
      notes: plant.notes || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('กรุณากรอกชื่อต้นไม้');
      return;
    }
    setSaving(true);
    try {
      if (editPlant) {
        await plantsAPI.update(plotId, editPlant.id, form);
      } else {
        await plantsAPI.create(plotId, form);
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
      await plantsAPI.delete(plotId, deleteTarget.id);
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
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ต้นไม้ในแปลง</h1>
            <p className="text-sm text-gray-500 mt-0.5">แปลง #{plotId}</p>
          </div>
        </div>
        {isManager() && (
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} />
            เพิ่มต้นไม้
          </button>
        )}
      </div>

      {!plants || plants.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="ยังไม่มีต้นไม้"
          description="เพิ่มต้นไม้ในแปลงนี้"
          action={isManager() ? { label: 'เพิ่มต้นไม้', onClick: openCreate } : null}
        />
      ) : (
        <div className="space-y-2">
          {plants.map((plant) => (
            <div key={plant.id} className="plant-row group">
              <div className="plant-row-indicator">
                <Sprout size={18} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 className="text-base font-semibold text-gray-900">{plant.name}</h3>
                  <span className={`badge text-xs ${STATUS_COLORS[plant.status] || 'bg-gray-100 text-gray-600'}`}>
                    {plant.status === 'healthy' ? 'สุขภาพดี' : plant.status === 'warning' ? 'เตือน' : plant.status === 'sick' ? 'ป่วย' : plant.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {plant.planted_date && (
                    <span className="text-xs text-gray-400">ปลูกเมื่อ {plant.planted_date}</span>
                  )}
                  {plant.variety && (
                    <span className="text-xs text-gray-400">{plant.variety}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isManager() && (
                  <>
                    <button onClick={() => openEdit(plant)} className="btn-icon" aria-label={`แก้ไขต้นไม้ ${plant.name}`}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(plant)} className="btn-icon hover:text-red-600" aria-label={`ลบต้นไม้ ${plant.name}`}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                <Link
                  to={`/plots/${plotId}/qr`}
                  className="btn btn-secondary text-xs py-1.5 px-3"
                >
                  QR
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{editPlant ? 'แก้ไขต้นไม้' : 'เพิ่มต้นไม้ใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4" aria-label={editPlant ? 'แก้ไขต้นไม้' : 'เพิ่มต้นไม้ใหม่'}>
              <div>
                <label htmlFor="plant-name" className="label">ชื่อต้นไม้ *</label>
                <input
                  id="plant-name"
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น สตรอว์เบอร์รี #001"
                />
              </div>
              <div>
                <label htmlFor="plant-status" className="label">สถานะ</label>
                <select
                  id="plant-status"
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="healthy">สุขภาพดี</option>
                  <option value="warning">เตือน</option>
                  <option value="sick">ป่วย</option>
                  <option value="dead">ตาย</option>
                </select>
              </div>
              <div>
                <label htmlFor="plant-date" className="label">วันที่ปลูก</label>
                <input
                  id="plant-date"
                  type="date"
                  className="input"
                  value={form.planted_date}
                  onChange={(e) => setForm({ ...form, planted_date: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="plant-notes" className="label">บันทึก</label>
                <textarea
                  id="plant-notes"
                  className="input"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="บันทึกเพิ่มเติม..."
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
        title="ลบต้นไม้"
        message={`ต้องการลบ "${deleteTarget?.name}" หรือไม่?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
        loading={saving}
        error={deleteError}
      />
    </div>
  );
}
