import React, { useState, useCallback } from 'react'
import PhotoUpload from '../components/PhotoUpload'
import { submitProblemReport, addToOfflineQueue } from '../services/api'

const PROBLEM_TYPES = [
  { value: 'pest',    label: '🐛 แมลง/ศัตรูพืช' },
  { value: 'disease', label: '🤒 โรคพืช' },
  { value: 'water',   label: '💧 ปัญหาน้ำ' },
  { value: 'soil',    label: '🪨 ปัญหาดิน' },
  { value: 'weather', label: '🌡️ ปัญหาสภาพอากาศ' },
  { value: 'other',   label: '❓ อื่นๆ' }
]

const SEVERITY_LEVELS = [
  { value: 'low',    label: 'ต่ำ',      color: '#52b788' },
  { value: 'medium', label: 'ปานกลาง',  color: '#f59e0b' },
  { value: 'high',   label: 'สูง',       color: '#ef4444' }
]

const ProblemReport = React.memo(({ type, id, onBack, onSuccess, isOnline }) => {
  const [problemType,   setProblemType]   = useState('')
  const [severity,       setSeverity]       = useState('medium')
  const [description,    setDescription]    = useState('')
  const [photo,           setPhoto]           = useState(null)
  const [photoPreview,    setPhotoPreview]    = useState(null)
  const [loading,         setLoading]         = useState(false)
  const [error,            setError]            = useState(null)

  const handlePhotoSelected = useCallback((file) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }, [photoPreview])

  const handleRemovePhoto = useCallback(() => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null)
    setPhotoPreview(null)
  }, [photoPreview])

  const handleSubmit = useCallback(async () => {
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
        await addToOfflineQueue('problem', reportData)
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
      if (err.offline) {
        await addToOfflineQueue('problem', reportData)
        onSuccess()
      } else {
        setError('ไม่สามารถส่งรายงานได้ กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }, [type, id, problemType, severity, description, photo, isOnline, onSuccess])

  return (
    <div className="container">
      <button className="back-btn" onClick={onBack} aria-label="กลับไปหน้าก่อน">
        ← กลับ
      </button>

      {/* Header */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          marginBottom: 'var(--space-4)',
          background: 'var(--color-danger-bg)'
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }} aria-hidden="true">⚠️</div>
        <h2 className="card-title" style={{ marginBottom: 'var(--space-1)' }}>แจ้งปัญหา</h2>
        <span className="type-badge" aria-label={`ประเภท: ${type === 'plant' ? 'ต้นไม้' : 'แปลง'}, ID: ${id}`}>
          {type === 'plant' ? '🌱 ต้นไม้' : '🗺️ แปลง'} #{id}
        </span>
      </div>

      {/* Form */}
      <div className="card">
        {error && (
          <div className="error" style={{ marginBottom: 'var(--space-4)' }} role="alert">
            {error}
          </div>
        )}

        {/* Problem Type */}
        <div className="form-group">
          <label className="form-label" htmlFor="problem-type">
            ประเภทปัญหา <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <select
            id="problem-type"
            className="form-select"
            value={problemType}
            onChange={(e) => setProblemType(e.target.value)}
            required
          >
            <option value="">-- เลือกประเภทปัญหา --</option>
            {PROBLEM_TYPES.map(pt => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div className="form-group">
          <label className="form-label" id="severity-label">
            ระดับความรุนแรง
          </label>
          <div
            role="group"
            aria-labelledby="severity-label"
            style={{ display: 'flex', gap: 'var(--space-2)' }}
          >
            {SEVERITY_LEVELS.map(level => {
              const isSelected = severity === level.value
              return (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setSeverity(level.value)}
                  aria-pressed={isSelected}
                  style={{
                    flex: 1,
                    padding: 'var(--space-2) var(--space-1)',
                    border: '2px solid',
                    borderColor: isSelected ? level.color : 'var(--color-border)',
                    background: isSelected ? level.color : 'var(--color-surface)',
                    color: isSelected ? '#fff' : 'var(--color-text)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontWeight: isSelected ? '600' : '400',
                    fontSize: 'var(--text-sm)',
                    fontFamily: 'inherit',
                    transition: 'all var(--transition-base)',
                    minHeight: '44px'
                  }}
                >
                  {level.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="problem-description">
            อธิบายปัญหา <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <textarea
            id="problem-description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายปัญหาที่พบโดยละเอียด..."
            maxLength={1000}
            required
            aria-describedby="description-hint"
          />
          <p id="description-hint" className="form-hint">{description.length}/1000</p>
        </div>

        {/* Photo */}
        <div className="form-group">
          <label className="form-label">รูปภาพประกอบ (แนะนำ)</label>
          <PhotoUpload
            onPhotoSelected={handlePhotoSelected}
            photoPreview={photoPreview}
            onRemove={handleRemovePhoto}
          />
          <p className="form-hint" style={{ textAlign: 'left', color: 'var(--color-text-muted)' }}>
            ช่วยให้เข้าใจปัญหาได้ง่ายขึ้น
          </p>
        </div>

        <button
          className="btn btn-danger"
          onClick={handleSubmit}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'กำลังส่ง...' : 'ส่งรายงานปัญหา'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginTop: 'var(--space-2)' }}
          disabled={loading}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
})

ProblemReport.displayName = 'ProblemReport'

export default ProblemReport
