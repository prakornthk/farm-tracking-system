import React, { useRef } from 'react'

const PhotoUpload = ({ onPhotoSelected, photoPreview, onRemove }) => {
  const fileInputRef = useRef(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์มีขนาดใหญ่เกิน 5MB')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพ')
        return
      }

      onPhotoSelected(file)
    }
  }

  if (photoPreview) {
    return (
      <div className="photo-preview">
        <img src={photoPreview} alt="Preview" />
        <button className="remove-btn" onClick={onRemove}>
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="photo-upload" onClick={handleClick}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div className="icon">📷</div>
      <p>แตะเพื่อถ่ายรูปหรือเลือกรูปภาพ</p>
    </div>
  )
}

export default PhotoUpload
