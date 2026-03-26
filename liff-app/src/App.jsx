import React, { useState, useEffect, useCallback, useRef } from 'react'
import useLiff from './hooks/useLiff'
import useOffline from './hooks/useOffline'
import Header from './components/Header'
import LoginPage from './pages/LoginPage'
import SuccessPage from './pages/SuccessPage'

// Lazy-load pages for code splitting — reduces initial bundle
const LazyScanPage      = React.lazy(() => import('./pages/ScanPage'))
const LazyActionForm    = React.lazy(() => import('./pages/ActionForm'))
const LazyProblemReport = React.lazy(() => import('./pages/ProblemReport'))
const LazyTaskList      = React.lazy(() => import('./pages/TaskList'))

const SuspenseFallback = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh'
    }}
  >
    <div className="spinner" role="status" aria-label="กำลังเริ่มต้นแอป" />
  </div>
)

const App = () => {
  const [currentView, setCurrentView]   = useState('scan')
  const [scanData,    setScanData]      = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)
  const [showSuccess,    setShowSuccess]    = useState(false)

  const { liff, isLoggedIn, isReady, profile, error: liffError, login } = useLiff()
  const { isOnline, pendingCount } = useOffline()

  // Stable callbacks — all useCallback chains to avoid stale closures
  const handleSelectAction = useCallback((action) => setSelectedAction(action), [])

  const handleBack = useCallback(() => {
    setSelectedAction(null)
  }, [])

  const handleSuccess = useCallback(() => {
    setShowSuccess(true)
    setSelectedAction(null)
  }, [])

  const handleLogin = useCallback(() => login(), [login])

  const handleViewChange = useCallback((view) => {
    setCurrentView(view)
    if (view === 'scan') {
      setScanData(null)
      setSelectedAction(null)
      setShowSuccess(false)
    }
  }, [])

  const handleNextScan = useCallback(() => {
    setShowSuccess(false)
    setScanData(null)
    if (liff) {
      liff.scanCode()
        .then(result => {
          const value = result.value
          const match = value.match(/(?:scan\/)?([^\/]+)\/([^\/]+)$/)
          if (match) setScanData({ type: match[1], id: match[2] })
        })
        .catch((err) => { console.warn('Scan cancelled or failed:', err.message) })
    }
  }, [liff])

  const handleClose = useCallback(() => {
    if (liff) liff.closeWindow()
  }, [liff])

  // Parse deep-link route on mount and on popstate
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

  // Loading state
  if (!isReady) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}
      >
        <div className="spinner" role="status" aria-label="กำลังเริ่มต้นแอป" />
      </div>
    )
  }

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} error={liffError} />

  // ── Render the appropriate view ────────────────────────────
  const renderContent = () => {
    if (showSuccess) {
      return (
        <SuccessPage
          onNextScan={handleNextScan}
          onClose={handleClose}
        />
      )
    }

    if (selectedAction && scanData) {
      if (selectedAction === 'report') {
        return (
          <React.Suspense fallback={<SuspenseFallback />}>
            <LazyProblemReport
              type={scanData.type}
              id={scanData.id}
              onBack={handleBack}
              onSuccess={handleSuccess}
              isOnline={isOnline}
            />
          </React.Suspense>
        )
      }
      return (
        <React.Suspense fallback={<SuspenseFallback />}>
          <LazyActionForm
            type={scanData.type}
            id={scanData.id}
            action={selectedAction}
            onBack={handleBack}
            onSuccess={handleSuccess}
            isOnline={isOnline}
          />
        </React.Suspense>
      )
    }

    if (currentView === 'tasks') {
      return (
        <React.Suspense fallback={<SuspenseFallback />}>
          <LazyTaskList
            userId={profile?.userId}
            onBack={handleBack}
            isOnline={isOnline}
          />
        </React.Suspense>
      )
    }

    if (scanData) {
      return (
        <React.Suspense fallback={<SuspenseFallback />}>
          <LazyScanPage
            type={scanData.type}
            id={scanData.id}
            onSelectAction={handleSelectAction}
          />
        </React.Suspense>
      )
    }

    // Welcome / scan prompt (home view)
    return (
      <div className="container">
        <div
          className="card"
          style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)' }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-4)' }}>🌾</div>
          <h2 className="card-title" style={{ marginBottom: 'var(--space-2)' }}>
            Farm Tracking
          </h2>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-4)'
            }}
          >
            สวัสดี {profile?.displayName}!
          </p>

          {!isOnline && (
            <div
              className="error"
              style={{
                marginBottom: 'var(--space-4)',
                background: 'var(--color-warning-bg)',
                color: 'var(--color-warning-dark)'
              }}
            >
              📴 อยู่ในโหมดออฟไลน์ — ข้อมูลจะถูกบันทึกเมื่อเชื่อมต่ออินเทอร์เน็ต
            </div>
          )}

          {pendingCount > 0 && (
            <div
              style={{
                background: 'var(--color-info-bg)',
                color: 'var(--color-info-dark)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--text-sm)',
                fontWeight: '500'
              }}
            >
              📤 มี {pendingCount} รายการรอ sync
            </div>
          )}

          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            สแกน QR Code บนต้นไม้หรือแปลงเพื่อเริ่มบันทึกกิจกรรม
          </p>

          <button
            className="btn btn-primary"
            style={{ marginTop: 'var(--space-5)' }}
            onClick={async () => {
              try {
                const result = await liff.scanCode()
                const match = result.value.match(/(?:scan\/)?([^\/]+)\/([^\/]+)$/)
                if (match) setScanData({ type: match[1], id: match[2] })
                else alert('QR Code ไม่ถูกต้อง')
              } catch (e) {
                console.error('Scan cancelled')
              }
            }}
          >
            📱 สแกน QR Code
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Offline status banner — polite live region for screen readers */}
      {!isOnline && (
        <div
          className="offline-banner"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label="สถานะการเชื่อมต่อ"
        >
          📴 ไม่มีการเชื่อมต่ออินเทอร์เน็ต
        </div>
      )}

      <Header
        title="Farm Tracking"
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      <main id="main-content">
        <React.Suspense fallback={<SuspenseFallback />}>
          {renderContent()}
        </React.Suspense>
      </main>
    </>
  )
}

export default App
