import React, { useState } from 'react'
import PhotoUpload from '../components/PhotoUpload'
import { submitProblemReport, addToOfflineQueue } from '../services/api'

const PROBLEM_TYPES = [
  { value: 'pest',     label: '🐛 แมลง/ศัตรูพืช' },
  { value: 'disease',  label: '🤒 โรคพืช' },
  { value: 'water',    label: '💧 ปัญหาน้ำ' },
  { value: 'soil',     label: '🪨 ปัญหาดิน' },
  { value: 'weather',  label: '🌡️ ปัญหาสภาพอากาศ' },
  { value: 'other',    label: '❓ อื่นๆ' }
]

const SEVERITY_LEVELS = [
  { value: 'low',    label: 'ต่ำ',      color: '#52b788' },
  { value: 'medium', label: 'ปานกลาง',  color: '#f59e0b' },
  { value: 'high',   label: 'สูง',       color: '#ef4444' }
]

const ProblemReport = ({ type, id, onBack, onSuccess, isOnline }) => {
  const [problemType, setProblemType] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePhotoSelected = (file) => {
    setPhoto(file)
    const objectUrl = URL.createObjectURL(file)
    setPhotoPreview(objectUrl)
  }

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null)
    setPhotoPreview(null)
  }

  const handleSubmit = async () => {
    if (!problemType) { setError('กรุณาเลือกประเภทปัญหา'); return }
    if (!description.trim()) { setError('กรุณาอธิบายปัญหา'); return }

    setLoading(true)
    setError(null)

    const reportData = {
      plot_id: type === 'plot' ? id : null,
      plant_id: type === 'plant' ? id : null,
      problem_type: problemType,
      severity,
      description: description.trim(),
      photo
    }

    try {
      if (!isOnline) {
        addToOfflineQueue('problem', reportData)
        onSuccess()
        return
      }
      const formData = new FormData()
      formData.append('plot_id', type === 'plot' ? id : null)
      formData.append('plant_id', type === 'plant' ? id : null)
      formData.append('problem_type', problemType)
      formData.append('severity', severity)
      formData.append('description', description.trim())
      if (photo) formData.append('photo', photo)

      await submitProblemReport(formData)
      onSuccess()
    } catch (err) {
      console.error('Submit report error:', err)
      if (err.offline) { addToOfflineQueue('problem', reportData); onSuccess() }
      else setError('ไม่สามารถส่งรายงานได้ กรุณาลองใหม่')
    } finally { setLoading(false) }
  }

  return (
    <div className="container">
      <button className="back-btn" onClick={onBack}>← กลับ</button>

      {/* Header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-4)', background: 'var(--color-danger-bg)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>⚠️</div>
        <h2 className="card-title" style={{ marginBottom: 'var(--space-1)' }}>แจ้งปัญหา</h2>
        <span className="type-badge">{type === 'plant' ? '🌱 ต้นไม้' : '🗺️ แปลง'} #{id}</span>
      </div>

      {/* Form */}
      <div className="card">
        {error && <div className="error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

        <div className="form-group">
          <label className="form-label">ประเภทปัญหา *</label>
          <select className="form-select" value={problemType}
            onChange={(e) => setProblemType(e.target.value)}>
            <option value="">-- เลือกประเภทปัญหา --</option>
            {PROBLEM_TYPES.map(pt => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">ระดับความรุนแรง</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {SEVERITY_LEVELS.map(level => (
              <button key={level.value} type="button"
                onClick={() => setSeverity(level.value)}
                style={{
                  flex: 1,
                  padding: 'var(--space-2) var(--space-1)',
                  border: '2px solid',
                  borderColor: severity === level.value ? level.color : 'var(--color-border)',
                  background: severity === level.value ? level.color : 'var(--color-surface)',
                  color: severity === level.value ? '#fff' : 'var(--color-text)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: severity === level.value ? '600' : '400',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'inherit',
                  transition: 'all var(--transition-base)'
                }}>
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">อธิบายปัญหา *</label>
          <textarea className="form-textarea" value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายปัญหาที่พบโดยละเอียด..." maxLength={1000} />
          <p className="form-hint">{description.length}/1000</p>
        </div>

        <div className="form-group">
          <label className="form-label">รูปภาพประกอบ (แนะนำ)</label>
          <PhotoUpload onPhotoSelected={handlePhotoSelected} photoPreview={photoPreview} onRemove={handleRemovePhoto} />
          <p className="form-hint" style={{ textAlign: 'left', color: 'var(--color-text-muted)' }}>
            ช่วยให้เข้าใจปัญหาได้ง่ายขึ้น
          </p>
        </div>

        <button className="btn btn-danger" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังส่ง...' : 'ส่งรายงานปัญหา'}
        </button>

        <button className="btn btn-secondary" onClick={onBack}
          style={{ marginTop: 'var(--space-2)' }} disabled={loading}>
          ยกเลิก
        </button>
      </div>
    </div>
  )
}

export default ProblemReport
