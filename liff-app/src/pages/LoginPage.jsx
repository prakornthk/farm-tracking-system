import React from 'react'

const LoginPage = ({ onLogin, error }) => {
  return (
    <div className="login-screen">
      {/* Background decoration */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg-circle login-bg-circle--1" />
        <div className="login-bg-circle login-bg-circle--2" />
        <div className="login-bg-circle login-bg-circle--3" />
      </div>

      <div className="login-content">
        {/* Logo mark */}
        <div className="login-logo" aria-hidden="true">
          <span>🌱</span>
        </div>

        {/* Branding */}
        <div className="login-brand">
          <h1 className="login-title">Farm Tracking</h1>
          <p className="login-tagline">ระบบติดตามและบันทึกกิจกรรมในไร่</p>
        </div>

        {/* Features */}
        <div className="login-features">
          <div className="login-feature">
            <span className="login-feature-icon" aria-hidden="true">📱</span>
            <span>สแกน QR บันทึกกิจกรรมได้ทุกที่</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon" aria-hidden="true">📤</span>
            <span>ทำงานออฟไลน์ได้ แม้ไม่มีสัญญาณ</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon" aria-hidden="true">🔔</span>
            <span>แจ้งปัญหาต้นไม้ได้อย่างรวดเร็ว</span>
          </div>
        </div>

        {error && (
          <div className="error" role="alert" style={{ marginBottom: 'var(--space-4)', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {/* LINE Login Button */}
        <button
          className="btn btn-primary login-btn"
          onClick={onLogin}
          aria-label="เข้าสู่ระบบด้วย LINE"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.349 0-.63-.285-.63-.629V8.108c0-.345.281-.63.63-.63.346 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.915C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          เข้าสู่ระบบด้วย LINE
        </button>

        <p className="login-footer">
          กรุณาเข้าสู่ระบบเพื่อใช้งาน<br />
          ระบบจะใช้บัญชี LINE ของคุณ
        </p>
      </div>
    </div>
  )
}

export default LoginPage
