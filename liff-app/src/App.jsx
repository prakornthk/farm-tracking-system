import React, { useState, useEffect, useCallback } from 'react'
import useLiff from './hooks/useLiff'
import useOffline from './hooks/useOffline'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
import ScanPage from './pages/ScanPage'
import ActionForm from './pages/ActionForm'
import SuccessPage from './pages/SuccessPage'
import TaskList from './pages/TaskList'
import ProblemReport from './pages/ProblemReport'

const App = () => {
  const [currentView, setCurrentView] = useState('scan')
  const [scanData, setScanData] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const { liff, isLoggedIn, isReady, profile, error: liffError, login } = useLiff()
  const { isOnline, pendingCount } = useOffline()

  const handleSelectAction = useCallback((action) => setSelectedAction(action), [])
  const handleBack         = useCallback(() => setSelectedAction(null), [])
  const handleSuccess      = useCallback(() => { setShowSuccess(true); setSelectedAction(null) }, [])
  const handleLogin        = useCallback(() => login(), [login])

  const handleViewChange = useCallback((view) => {
    if (view === 'scan') { setScanData(null); setSelectedAction(null); setShowSuccess(false) }
    setCurrentView(view)
  }, [])

  const handleNextScan = useCallback(() => {
    setShowSuccess(false)
    setScanData(null)
    if (liff) {
      liff.scanCode().then(result => {
        const value = result.value
        const match = value.match(/(?:scan\/)?([^\/]+)\/([^\/]+)$/)
        if (match) setScanData({ type: match[1], id: match[2] })
      }).catch(() => {})
    }
  }, [liff])

  const handleClose = useCallback(() => { if (liff) liff.closeWindow() }, [liff])

  useEffect(() => {
    const parseRoute = () => {
      const path = window.location.pathname
      const scanMatch = path.match(/^\/scan\/([^\/]+)\/([^\/]+)$/)
      if (scanMatch) {
        setScanData({ type: scanMatch[1], id: scanMatch[2] })
        setCurrentView('scan')
      }
    }
    parseRoute()
    window.addEventListener('popstate', parseRoute)
    return () => window.removeEventListener('popstate', parseRoute)
  }, [])

  if (!isReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    )
  }

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} error={liffError} />

  const renderContent = () => {
    if (showSuccess) return <SuccessPage onNextScan={handleNextScan} onClose={handleClose} />

    if (selectedAction && scanData) {
      if (selectedAction === 'report') {
        return <ProblemReport type={scanData.type} id={scanData.id} onBack={handleBack} onSuccess={handleSuccess} isOnline={isOnline} />
      }
      return <ActionForm type={scanData.type} id={scanData.id} action={selectedAction} onBack={handleBack} onSuccess={handleSuccess} isOnline={isOnline} />
    }

    if (currentView === 'tasks') {
      return <TaskList userId={profile?.userId} onBack={handleBack} isOnline={isOnline} />
    }

    if (scanData) {
      return <ScanPage type={scanData.type} id={scanData.id} onSelectAction={handleSelectAction} />
    }

    // Welcome / scan prompt
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-4)' }}>🌾</div>
          <h2 className="card-title" style={{ marginBottom: 'var(--space-2)' }}>Farm Tracking</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            สวัสดี {profile?.displayName}!
          </p>
          
          {!isOnline && (
            <div className="error" style={{ marginBottom: 'var(--space-4)', background: 'var(--color-warning-bg)', color: 'var(--color-warning-dark)' }}>
              📴 อยู่ในโหมดออฟไลน์ — ข้อมูลจะถูกบันทึกเมื่อเชื่อมต่ออินเทอร์เน็ต
            </div>
          )}
          
          {pendingCount > 0 && (
            <div style={{ background: 'var(--color-info-bg)', color: 'var(--color-info-dark)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: '500' }}>
              📤 มี {pendingCount} รายการรอ sync
            </div>
          )}

          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            สแกน QR Code บนต้นไม้หรือแปลงเพื่อเริ่มบันทึกกิจกรรม
          </p>

          <button className="btn btn-primary" style={{ marginTop: 'var(--space-5)' }}
            onClick={async () => {
              try {
                const result = await liff.scanCode()
                const match = result.value.match(/(?:scan\/)?([^\/]+)\/([^\/]+)$/)
                if (match) setScanData({ type: match[1], id: match[2] })
                else alert('QR Code ไม่ถูกต้อง')
              } catch (e) { console.error('Scan cancelled') }
            }}>
            📱 สแกน QR Code
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {!isOnline && (
        <div className="offline-banner">📴 ไม่มีการเชื่อมต่ออินเทอร์เน็ต</div>
      )}
      <Header title="Farm Tracking" currentView={currentView} onViewChange={handleViewChange} />
      <main style={{ paddingTop: '0' }}>{renderContent()}</main>
    </>
  )
}

export default App
