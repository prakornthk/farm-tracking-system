import React, { useState } from 'react'
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

  const handlePhotoSelected = (file) => {
    setPhoto(file)
    // Use createObjectURL for better memory management than FileReader
    const objectUrl = URL.createObjectURL(file)
    setPhotoPreview(objectUrl)
  }

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhoto(null)
    setPhotoPreview(null)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    // activityData now includes photo for all action types
    const activityData = {
      activitable_type: type === 'plant' ? 'App\\Models\\Plant' : 'App\\Models\\Plot',
      activitable_id: id,
      type: action,
      notes: notes.trim() || null,
      photo: photo
    }

    try {
      if (!isOnline) {
        // Queue for offline sync - photo will be stored properly
        addToOfflineQueue('activity', activityData)
        onSuccess()
        return
      }

      const formData = new FormData()
      formData.append('activitable_type', type === 'plant' ? 'App\\Models\\Plant' : 'App\\Models\\Plot')
      formData.append('activitable_id', id)
      formData.append('type', action)
      if (notes.trim()) {
        formData.append('notes', notes.trim())
      }
      if (photo) {
        formData.append('photo', photo)
      }

      await logActivity(formData)
      onSuccess()
    } catch (err) {
      console.error('Submit error:', err)
      if (err.offline) {
        // Queue for later
        addToOfflineQueue('activity', activityData)
        onSuccess()
      } else {
        setError('ไม่สามารถบันทึกได้ กรุณาลองใหม่')
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

      {/* Action Header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>{actionConfig.icon}</div>
        <h2>{actionConfig.label}</h2>
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
          <label>หมายเหตุ (ไม่บังคับ)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="เพิ่มรายละเอียดเพิ่มเติม..."
            maxLength={500}
          />
          <small style={{ color: '#999', fontSize: '12px' }}>
            {notes.length}/500
          </small>
        </div>

        {/* Photo Upload - available for all action types */}
        <div className="form-group">
          <label>รูปภาพประกอบ (ไม่บังคับ)</label>
          <PhotoUpload
            onPhotoSelected={handlePhotoSelected}
            photoPreview={photoPreview}
            onRemove={handleRemovePhoto}
          />
          {action === 'report' && (
            <small style={{ color: '#999', fontSize: '12px', display: 'block', marginTop: '6px' }}>
              แนะนำสำหรับการแจ้งปัญหา
            </small>
          )}
        </div>

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
          style={{ marginTop: '10px' }}
          disabled={loading}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}

export default ActionForm
