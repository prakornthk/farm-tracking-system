import React, { useState, useEffect, useCallback } from 'react'
import PhotoUpload from '../components/PhotoUpload'
import { logActivity, addToOfflineQueue } from '../services/api'
import { ACTION_CONFIG } from '../components/ActionButton'

const ActionForm = React.memo(({ type, id, action, onBack, onSuccess, isOnline }) => {
  const [notes,        setNotes]        = useState('')
  const [photo,        setPhoto]        = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,         setError]        = useState(null)

  const actionConfig = ACTION_CONFIG[action] || { icon: '❓', label: action }

  // Revoke ObjectURL when preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

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
    setLoading(true)
    setError(null)

    const activityData = {
      activitable_type: type === 'plant' ? 'App\\Models\\Plant' : 'App\\Models\\Plot',
      activitable_id: id,
      type: action,
      notes: notes.trim() || null,
      photo
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
      if (err.offline) {
        await addToOfflineQueue('activity', activityData)
        onSuccess()
      } else {
        setError('ไม่สามารถบันทึกได้ กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }, [type, id, action, notes, photo, isOnline, onSuccess])

  const isReport = action === 'report'

  return (
    <div className="container">
      <button className="back-btn" onClick={onBack} aria-label="กลับไปหน้าก่อน">
        ← กลับ
      </button>

      {/* Action Header Card */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }} aria-hidden="true">
          {actionConfig.icon}
        </div>
        <h2 className="card-title" style={{ marginBottom: 'var(--space-1)' }}>
          {actionConfig.label}
        </h2>
        <span className="type-badge" aria-label={`ประเภท: ${type === 'plant' ? 'ต้นไม้' : 'แปลง'}, ID: ${id}`}>
          {type === 'plant' ? '🌱 ต้นไม้' : '🗺️ แปลง'} #{id}
        </span>
      </div>

      {/* Form Card */}
      <div className="card">
        {error && (
          <div className="error" style={{ marginBottom: 'var(--space-4)' }} role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="action-notes">
            หมายเหตุ (ไม่บังคับ)
          </label>
          <textarea
            id="action-notes"
            className="form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="เพิ่มรายละเอียดเพิ่มเติม..."
            maxLength={500}
            aria-describedby="notes-hint"
          />
          <p id="notes-hint" className="form-hint">{notes.length}/500</p>
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
          aria-busy={loading}
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginTop: 'var(--space-2)' }}
          disabled={loading}
          aria-busy={loading}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
})

ActionForm.displayName = 'ActionForm'

export default ActionForm
