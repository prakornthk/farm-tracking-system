import React from 'react'

const SuccessPage = ({ onNextScan, onClose }) => {
  return (
    <div className="container">
      <div className="success-screen">
        <span className="success-icon">✅</span>
        <h2 className="success-title">บันทึกสำเร็จ!</h2>
        <p className="success-message">ข้อมูลถูกบันทึกเรียบร้อยแล้ว</p>
        
        <div className="btn-group">
          <button className="btn btn-primary" onClick={onNextScan}>
            📱 สแกนต่อ
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessPage
