import React from 'react'

const LoginPage = React.memo(({ onLogin, error }) => {
  return (
    <div className="login-layout">
      <div className="login-content">
        <div className="login-logo" aria-hidden="true">🌾</div>
        <h1 className="login-title">Farm Tracking</h1>
        <p className="login-subtitle">ระบบติดตามและบันทึกกิจกรรมในไร่</p>

        {error && (
          <div className="error" role="alert" style={{ marginBottom: 'var(--space-4)', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={onLogin}
          aria-label="เข้าสู่ระบบด้วย LINE"
        >
          เข้าสู่ระบบด้วย LINE
        </button>

        <p className="login-hint">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
      </div>
    </div>
  )
})

LoginPage.displayName = 'LoginPage'

export default LoginPage
