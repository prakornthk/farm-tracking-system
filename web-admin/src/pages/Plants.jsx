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
    setSaving(true);
    try {
      await plantsAPI.delete(plotId, deleteTarget.id);
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
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">ต้นไม้ในแปลง</h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">แปลง #{plotId}</p>
        {isManager() && (
          <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plants.map((plant) => (
            <div key={plant.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl">🌱</div>
                {isManager() && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(plant)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(plant)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{plant.name}</h3>
              <span className={`badge ${STATUS_COLORS[plant.status] || STATUS_COLORS.healthy} capitalize`}>
                {plant.status === 'healthy' ? 'สุขภาพดี' : plant.status === 'warning' ? 'เตือน' : plant.status === 'sick' ? 'ป่วย' : 'ตาย'}
              </span>
              {plant.planted_date && (
                <p className="text-xs text-gray-400 mt-2">ปลูกเมื่อ: {plant.planted_date}</p>
              )}
              {plant.notes && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{plant.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editPlant ? 'แก้ไขต้นไม้' : 'เพิ่มต้นไม้ใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อต้นไม้ *</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น สตรอว์เบอร์รี #001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <select
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
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ปลูก</label>
                <input
                  type="date"
                  className="input"
                  value={form.planted_date}
                  onChange={(e) => setForm({ ...form, planted_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">บันทึก</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="บันทึกเพิ่มเติม..."
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
        title="ลบต้นไม้"
        message={`ต้องการลบ "${deleteTarget?.name}" หรือไม่?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}
