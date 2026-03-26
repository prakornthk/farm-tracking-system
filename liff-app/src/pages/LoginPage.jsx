import React from 'react'

const LoginPage = ({ onLogin, error }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 'var(--space-4)' }}>
      <div style={{ textAlign: 'center', maxWidth: '320px', width: '100%' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-4)' }}>🌾</div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--color-text)', marginBottom: 'var(--space-2)', letterSpacing: '-0.02em' }}>Farm Tracking</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
          ระบบติดตามและบันทึกกิจกรรมในไร่
        </p>
        
        {error && (
          <div className="error" style={{ marginBottom: 'var(--space-4)', textAlign: 'left' }}>
            {error}
          </div>
        )}
        
        <button className="btn btn-primary" onClick={onLogin}>
          เข้าสู่ระบบด้วย LINE
        </button>
        
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-4)' }}>
          กรุณาเข้าสู่ระบบเพื่อใช้งาน
        </p>
      </div>
    </div>
  )
}

export default LoginPage
