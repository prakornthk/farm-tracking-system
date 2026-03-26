import React, { useRef } from 'react'

const PhotoUpload = ({ onPhotoSelected, photoPreview, onRemove }) => {
  const fileInputRef = useRef(null)

  const handleClick = () => fileInputRef.current?.click()

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์มีขนาดใหญ่เกิน 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ')
      return
    }

    onPhotoSelected(file)
    e.target.value = '' // reset so same file can be selected again
  }

  if (photoPreview) {
    return (
      <div className="photo-preview">
        <img src={photoPreview} alt="ตัวอย่างรูปภาพ" />
        <button className="remove-btn" onClick={onRemove} type="button" aria-label="ลบรูปภาพ">
          ✕
        </button>
      </div>
    )
  }

  return (
    <div
      className="photo-upload"
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role="button"
      tabIndex={0}
      aria-label="อัพโหลดรูปภาพ"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <div className="upload-icon" aria-hidden="true">📷</div>
      <p>
        แตะเพื่อถ่ายรูปหรือเลือกรูปภาพ
        <span>รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</span>
      </p>
    </div>
  )
}

export default PhotoUpload
