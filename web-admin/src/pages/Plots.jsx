import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Sprout, ChevronRight, Grid3x3 } from 'lucide-react';
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
  const [deleteError, setDeleteError] = useState('');

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
    setDeleteError('');
    setSaving(true);
    try {
      await plotsAPI.delete(zoneId, deleteTarget.id);
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
            <h1 className="text-xl font-bold text-gray-900">แปลงปลูก</h1>
            <p className="text-sm text-gray-500 mt-0.5">โซน #{zoneId}</p>
          </div>
        </div>
        {isManager() && (
          <button onClick={openCreate} className="btn btn-primary">
            <Plus size={16} />
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
            <div key={plot.id} className="card-padded card-hover group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-green-50 rounded-lg">
                    <Sprout size={16} className="text-green-600" />
                  </span>
                </div>
                {isManager() && (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(plot)}
                      className="btn-icon"
                      aria-label={`แก้ไขแปลง ${plot.name}`}
                    >
                      <Edit2 size={14} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(plot)}
                      className="btn-icon hover:text-red-600"
                      aria-label={`ลบแปลง ${plot.name}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{plot.name}</h3>
              {plot.plant_type && (
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Sprout size={10} />{plot.plant_type}
                </p>
              )}
              {plot.size && (
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                  📐 {plot.size} ตร.ม.
                </p>
              )}
              <div className="flex items-center gap-3">
                <Link
                  to={`/plots/${plot.id}/plants`}
                  className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium hover:underline"
                >
                  ดูต้นไม้ <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{editPlot ? 'แก้ไขแปลง' : 'เพิ่มแปลงใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4" aria-label={editPlot ? 'แก้ไขแปลง' : 'เพิ่มแปลงใหม่'}>
              <div>
                <label htmlFor="plot-name" className="label">ชื่อแปลง *</label>
                <input
                  id="plot-name"
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น แปลง A1"
                />
              </div>
              <div>
                <label htmlFor="plot-size" className="label">ขนาด (ตร.ม.)</label>
                <input
                  id="plot-size"
                  type="text"
                  className="input"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="เช่น 100"
                />
              </div>
              <div>
                <label htmlFor="plot-plant-type" className="label">ชนิดพืช</label>
                <input
                  id="plot-plant-type"
                  type="text"
                  className="input"
                  value={form.plant_type}
                  onChange={(e) => setForm({ ...form, plant_type: e.target.value })}
                  placeholder="เช่น สตรอว์เบอร์รี"
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
        title="ลบแปลง"
        message={`ต้องการลบแปลง "${deleteTarget?.name}" หรือไม่?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
        loading={saving}
        error={deleteError}
      />
    </div>
  );
}
