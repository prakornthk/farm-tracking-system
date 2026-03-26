import React, { useState } from 'react'
import PhotoUpload from '../components/PhotoUpload'
import { submitProblemReport, addToOfflineQueue } from '../services/api'

const PROBLEM_TYPES = [
  { value: 'pest', label: '🐛 แมลง/ศัตรูพืช' },
  { value: 'disease', label: '🤒 โรคพืช' },
  { value: 'water', label: '💧 ปัญหาน้ำ' },
  { value: 'soil', label: '🪨 ปัญหาดิน' },
  { value: 'weather', label: '🌡️ ปัญหาสภาพอากาศ' },
  { value: 'other', label: '❓ อื่นๆ' }
]

const SEVERITY_LEVELS = [
  { value: 'low', label: 'ต่ำ', color: '#4CAF50' },
  { value: 'medium', label: 'ปานกลาง', color: '#FF9800' },
  { value: 'high', label: 'สูง', color: '#f44336' }
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
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
  }

  const handleSubmit = async () => {
    if (!problemType) {
      setError('กรุณาเลือกประเภทปัญหา')
      return
    }

    if (!description.trim()) {
      setError('กรุณาอธิบายปัญหา')
      return
    }

    setLoading(true)
    setError(null)

    const reportData = {
      target_type: type,
      target_id: id,
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
      formData.append('target_type', type)
      formData.append('target_id', id)
      formData.append('problem_type', problemType)
      formData.append('severity', severity)
      formData.append('description', description.trim())
      if (photo) {
        formData.append('photo', photo)
      }

      await submitProblemReport(formData)
      onSuccess()
    } catch (err) {
      console.error('Submit report error:', err)
      if (err.offline) {
        addToOfflineQueue('problem', reportData)
        onSuccess()
      } else {
        setError('ไม่สามารถส่งรายงานได้ กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <button className="back-btn" onClick={onBack}>
        ← กลับ
      </button>

      {/* Header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '16px', background: '#fff5f5' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚠️</div>
        <h2>แจ้งปัญหา</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>
          {type === 'plant' ? 'ต้นไม้' : 'แปลง'} #{id}
        </p>
      </div>

      {/* Form */}
      <div className="card form-section">
        {error && (
          <div className="error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label>ประเภทปัญหา *</label>
          <select
            value={problemType}
            onChange={(e) => setProblemType(e.target.value)}
          >
            <option value="">-- เลือกประเภทปัญหา --</option>
            {PROBLEM_TYPES.map(pt => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>ระดับความรุนแรง</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {SEVERITY_LEVELS.map(level => (
              <button
                key={level.value}
                type="button"
                onClick={() => setSeverity(level.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '2px solid',
                  borderColor: severity === level.value ? level.color : '#e0e0e0',
                  background: severity === level.value ? level.color : 'white',
                  color: severity === level.value ? 'white' : '#333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: severity === level.value ? '600' : '400'
                }}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>อธิบายปัญหา *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายปัญหาที่พบโดยละเอียด..."
            maxLength={1000}
          />
          <small style={{ color: '#999', fontSize: '12px' }}>
            {description.length}/1000
          </small>
        </div>

        <div className="form-group">
          <label>รูปภาพประกอบ (แนะนำ)</label>
          <PhotoUpload
            onPhotoSelected={handlePhotoSelected}
            photoPreview={photoPreview}
            onRemove={handleRemovePhoto}
          />
          <small style={{ color: '#999', fontSize: '12px', display: 'block', marginTop: '6px' }}>
            ช่วยให้เข้าใจปัญหาได้ง่ายขึ้น
          </small>
        </div>

        <button
          className="btn btn-danger"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'กำลังส่ง...' : 'ส่งรายงานปัญหา'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginTop: '10px' }}
          disabled={loading}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}

export default ProblemReport
