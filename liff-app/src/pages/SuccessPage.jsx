import React from 'react'

const SuccessPage = ({ onNextScan, onClose }) => {
  return (
    <div className="container">
      <div className="success-screen" role="status" aria-live="polite" aria-atomic="true">
        <div className="success-icon" aria-hidden="true">✅</div>
        <h2 className="success-title">บันทึกสำเร็จ!</h2>
        <p className="success-message">
          ข้อมูลถูกบันทึกเรียบร้อยแล้ว<br />
          ขอบคุณที่ดูแลฟาร์มอย่างดี 🌱
        </p>

        <div className="success-actions btn-group" style={{ flexDirection: 'column', gap: 'var(--space-2)' }}>
          <button className="btn btn-primary" onClick={onNextScan}>
            📱 สแกนต่อ
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessPage
