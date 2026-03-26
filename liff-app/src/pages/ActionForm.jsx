import React, { useState, useEffect } from 'react'
import PhotoUpload from '../components/PhotoUpload'
import { logActivity, addToOfflineQueue } from '../services/api'
import { ACTION_CONFIG } from '../components/ActionButton'

const ActionForm = ({ type, id, action, onBack, onSuccess, isOnline }) => {
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const actionConfig = ACTION_CONFIG[action] || { icon: '❓', label: action }

  // Clean up FileReader preview URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const handlePhotoSelected = (file) => {
    setPhoto(file)
    // Use object URL — properly cleaned up in useEffect above
    const objectUrl = URL.createObjectURL(file)
    setPhotoPreview(objectUrl)
  }

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null)
    setPhotoPreview(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    const activityData = {
      activitable_type: type === 'plant' ? 'App\\Models\\Plant' : 'App\\Models\\Plot',
      activitable_id: id,
      type: action,
      notes: notes.trim() || null,
      photo: photo
    }

    try {
      if (!isOnline) {
        await addToOfflineQueue('activity', activityData)
        onSuccess()
        return
      }

      const formData = new FormData()
      formData.append('activitable_type', type === 'plant' ? 'App\\Models\\Plant' : 'App\\Models\\Plot')
      formData.append('activitable_id', id)
      formData.append('type', action)
      if (notes.trim()) formData.append('notes', notes.trim())
      if (photo) formData.append('photo', photo)

      await logActivity(formData)
      onSuccess()
    } catch (err) {
      console.error('Submit error:', err)
      if (err.offline) {
        await addToOfflineQueue('activity', activityData)
        onSuccess()
      } else {
        setError('ไม่สามารถบันทึกได้ กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }

  const isReport = action === 'report'

  return (
    <div className="container">
      <button className="back-btn" onClick={onBack}>
        ← กลับ
      </button>

      {/* Action Header Card */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>
          {actionConfig.icon}
        </div>
        <h2 className="card-title" style={{ marginBottom: 'var(--space-1)' }}>
          {actionConfig.label}
        </h2>
        <span className="type-badge">
          {type === 'plant' ? '🌱 ต้นไม้' : '🗺️ แปลง'} #{id}
        </span>
      </div>

      {/* Form Card */}
      <div className="card">
        {error && (
          <div className="error" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">หมายเหตุ (ไม่บังคับ)</label>
          <textarea
            className="form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="เพิ่มรายละเอียดเพิ่มเติม..."
            maxLength={500}
          />
          <p className="form-hint">{notes.length}/500</p>
        </div>

        {isReport && (
          <div className="form-group">
            <label className="form-label">รูปภาพประกอบ (ไม่บังคับ)</label>
            <PhotoUpload
              onPhotoSelected={handlePhotoSelected}
              photoPreview={photoPreview}
              onRemove={handleRemovePhoto}
            />
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
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
}

export default ActionForm
