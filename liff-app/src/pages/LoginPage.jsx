import React from 'react'

const LoginPage = ({ onLogin, error }) => {
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌾</div>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Farm Tracking</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>ระบบติดตามและบันทึกกิจกรรมในไร่</p>
        
        {error && (
          <div className="error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}
        
        <button className="btn btn-primary" onClick={onLogin}>
          เข้าสู่ระบบด้วย LINE
        </button>
        
        <p style={{ fontSize: '12px', color: '#999', marginTop: '16px' }}>
          กรุณาเข้าสู่ระบบเพื่อใช้งาน
        </p>
      </div>
    </div>
  )
}

export default LoginPage
