import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Grid3x3, QrCode } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { plotsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

export default function Plots() {
  const { id: zoneId } = useParams();
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const { data: plots, loading, error, execute } = useApi(() => plotsAPI.list(zoneId));
  const [showForm, setShowForm] = useState(false);
  const [editPlot, setEditPlot] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', size: '', plant_type: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    execute();
  }, [zoneId]);

  const openCreate = () => {
    setEditPlot(null);
    setForm({ name: '', size: '', plant_type: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (plot) => {
    setEditPlot(plot);
    setForm({ name: plot.name, size: plot.size || '', plant_type: plot.plant_type || '' });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('กรุณากรอกชื่อแปลง');
      return;
    }
    setSaving(true);
    try {
      if (editPlot) {
        await plotsAPI.update(zoneId, editPlot.id, form);
      } else {
        await plotsAPI.create(zoneId, form);
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
      await plotsAPI.delete(zoneId, deleteTarget.id);
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
        <h1 className="text-2xl font-bold text-gray-900">แปลงปลูก</h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">โซน #{zoneId}</p>
        {isManager() && (
          <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            เพิ่มแปลง
          </button>
        )}
      </div>

      {!plots || plots.length === 0 ? (
        <EmptyState
          icon={Grid3x3}
          title="ยังไม่มีแปลง"
          description="เพิ่มแปลงปลูกใหม่"
          action={isManager() ? { label: 'เพิ่มแปลง', onClick: openCreate } : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plots.map((plot) => (
            <div key={plot.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">🌿</div>
                {isManager() && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(plot)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(plot)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{plot.name}</h3>
              {plot.plant_type && <p className="text-sm text-gray-500">🌱 {plot.plant_type}</p>}
              {plot.size && <p className="text-sm text-gray-400">📐 {plot.size} ตร.ม.</p>}
              <div className="flex gap-2 mt-3">
                <Link
                  to={`/plots/${plot.id}/plants`}
                  className="inline-flex items-center gap-1 text-sm text-green-600 font-medium hover:underline"
                >
                  ดูต้นไม้ →
                </Link>
                <Link
                  to={`/plots/${plot.id}/qr`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
                >
                  <QrCode size={14} /> QR
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editPlot ? 'แก้ไขแปลง' : 'เพิ่มแปลงใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแปลง *</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น แปลง A1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ขนาด (ตร.ม.)</label>
                <input
                  type="text"
                  className="input"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="เช่น 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชนิดพืช</label>
                <input
                  type="text"
                  className="input"
                  value={form.plant_type}
                  onChange={(e) => setForm({ ...form, plant_type: e.target.value })}
                  placeholder="เช่น สตรอว์เบอร์รี"
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
        title="ลบแปลง"
        message={`ต้องการลบแปลง "${deleteTarget?.name}" หรือไม่?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}
