import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { problemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

export default function Problems() {
  const { isManager } = useAuth();
  const { data: problems, loading, error, execute } = useApi(() => problemsAPI.list());
  const [showForm, setShowForm] = useState(false);
  const [editProblem, setEditProblem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium', plot_id: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => { execute(); }, []);

  const openCreate = () => {
    setEditProblem(null);
    setForm({ title: '', description: '', severity: 'medium', plot_id: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditProblem(p);
    setForm({ title: p.title, description: p.description || '', severity: p.severity || 'medium', plot_id: p.plot_id || '' });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('กรุณากรอกหัวข้อปัญหา'); return; }
    setSaving(true);
    try {
      if (editProblem) await problemsAPI.update(editProblem.id, form);
      else await problemsAPI.create(form);
      setShowForm(false);
      execute();
    } catch (err) {
      setFormError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    setSaving(true);
    try {
      await problemsAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      execute();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'ลบไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  const severityBadge = (s) => ({
    low: 'badge bg-blue-100 text-blue-700',
    medium: 'badge bg-yellow-100 text-yellow-700',
    high: 'badge bg-red-100 text-red-700',
  }[s] || 'badge bg-gray-100 text-gray-600');

  const severityLabel = (s) => ({ low: 'ต่ำ', medium: 'ปานกลาง', high: 'ด่วน' }[s] || s);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={execute} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">รายงานปัญหา</h1>
          <p className="section-subtitle">ติดตามปัญหาที่พบในฟาร์ม</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={16} />แจ้งปัญหา
        </button>
      </div>

      {!problems || problems.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="ไม่มีปัญหาที่รายงาน"
          description="หากพบปัญหาใดๆ สามารถแจ้งได้ที่นี่"
          action={{ label: 'แจ้งปัญหา', onClick: openCreate }}
        />
      ) : (
        <div className="space-y-3">
          {problems.map((p) => (
            <div key={p.id} className="card-padded">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-yellow-50 rounded-lg mt-0.5 flex-shrink-0">
                  <AlertTriangle size={15} className="text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{p.title}</h3>
                    <span className={severityBadge(p.severity)}>{severityLabel(p.severity)}</span>
                  </div>
                  {p.description && <p className="text-sm text-gray-500 mb-2">{p.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {p.plot_name && <span>{p.plot_name}</span>}
                    {p.reporter_name && <span>ผู้รายงาน: {p.reporter_name}</span>}
                  </div>
                </div>
                {isManager() && (
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button onClick={() => openEdit(p)} className="btn-icon" aria-label={`แก้ไขปัญหา ${p.title}`}><Edit2 size={14} aria-hidden="true" /></button>
                    <button onClick={() => setDeleteTarget(p)} className="btn-icon hover:text-red-600" aria-label={`ลบปัญหา ${p.title}`}><Trash2 size={14} aria-hidden="true" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">{editProblem ? 'แก้ไขปัญหา' : 'แจ้งปัญหาใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4" aria-label={editProblem ? 'แก้ไขปัญหา' : 'แจ้งปัญหาใหม่'}>
              <div>
                <label htmlFor="problem-title" className="label">หัวข้อปัญหา *</label>
                <input id="problem-title" type="text" className="input" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น ใบเหลืองผิดปกติ" />
              </div>
              <div>
                <label htmlFor="problem-description" className="label">รายละเอียด</label>
                <textarea id="problem-description" className="input" rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="อธิบายปัญหาที่พบ..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="problem-severity" className="label">ระดับความรุนแรง</label>
                  <select id="problem-severity" className="input" value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">ด่วน</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="problem-plot-id" className="label">แปลงที่เกี่ยวข้อง</label>
                  <input id="problem-plot-id" type="text" className="input" value={form.plot_id}
                    onChange={(e) => setForm({ ...form, plot_id: e.target.value.replace(/\s+/g, '').slice(0, 50) })}
                    placeholder="ID แปลง" />
                </div>
              </div>
              {formError && <p className="text-sm text-danger" role="alert">{formError}</p>}
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
        title="ลบปัญหา"
        message={`ต้องการลบปัญหา "${deleteTarget?.title}" หรือไม่?`}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
        loading={saving}
        error={deleteError}
      />
    </div>
  );
}
