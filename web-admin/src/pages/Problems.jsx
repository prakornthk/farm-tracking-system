import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { problemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../components/Shared';

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

export default function Problems() {
  const { isManager } = useAuth();
  const { data: problems, loading, error, execute } = useApi(() => problemsAPI.list());
  const [showForm, setShowForm] = useState(false);
  const [editProblem, setEditProblem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium', plot_id: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    execute();
  }, []);

  const openCreate = () => {
    setEditProblem(null);
    setForm({ title: '', description: '', severity: 'medium', plot_id: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditProblem(p);
    setForm({
      title: p.title,
      description: p.description || '',
      severity: p.severity || 'medium',
      plot_id: p.plot_id || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('กรุณากรอกหัวข้อปัญหา');
      return;
    }
    setSaving(true);
    try {
      if (editProblem) {
        await problemsAPI.update(editProblem.id, form);
      } else {
        await problemsAPI.create(form);
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
      await problemsAPI.delete(deleteTarget.id);
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
        <h1 className="text-2xl font-bold text-gray-900">รายงานปัญหา</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          แจ้งปัญหา
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
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <AlertTriangle className="text-orange-500 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900">{p.title}</h3>
                      <span className={`badge ${SEVERITY_COLORS[p.severity] || 'bg-gray-100 text-gray-600'}`}>
                        {p.severity === 'low' ? 'ต่ำ' : p.severity === 'medium' ? 'ปานกลาง' : 'ด่วน'}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                    )}
                    {p.plot_name && (
                      <p className="text-xs text-gray-400 mt-1">📍 {p.plot_name}</p>
                    )}
                    {p.reporter_name && (
                      <p className="text-xs text-gray-400 mt-1">👤 {p.reporter_name}</p>
                    )}
                  </div>
                </div>

                {isManager() && (
                  <div className="flex gap-1 ml-3">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editProblem ? 'แก้ไขปัญหา' : 'แจ้งปัญหาใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อปัญหา *</label>
                <input
                  type="text"
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น ใบเหลืองผิดปกติ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="อธิบายปัญหาที่พบ..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ระดับความรุนแรง</label>
                  <select
                    className="input"
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  >
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">ด่วน</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">แปลงที่เกี่ยวข้อง</label>
                  <input
                    type="text"
                    className="input"
                    value={form.plot_id}
                    onChange={(e) => setForm({ ...form, plot_id: e.target.value })}
                    placeholder="ID แปลง"
                  />
                </div>
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
        title="ลบปัญหา"
        message={`ต้องการลบปัญหา "${deleteTarget?.title}" หรือไม่?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={saving}
      />
    </div>
  );
}
