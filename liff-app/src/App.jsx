import React, { useState, useEffect, useMemo } from 'react'
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

  const { liff, isLoggedIn, isReady, profile, error: liffError, login, close } = useLiff()
  const { isOnline, pendingCount } = useOffline()

  // Parse URL for scan route
  useEffect(() => {
    const parseRoute = () => {
      const path = window.location.pathname
      const scanMatch = path.match(/^\/scan\/([^\/]+)\/([^\/]+)$/)
      
      if (scanMatch) {
        const [, type, id] = scanMatch
        setScanData({ type, id })
        setCurrentView('scan')
      }
    }

    parseRoute()
    
    // Listen for route changes (for SPA routing)
    window.addEventListener('popstate', parseRoute)
    return () => window.removeEventListener('popstate', parseRoute)
  }, [])

  const handleSelectAction = (action) => {
    setSelectedAction(action)
  }

  const handleBack = () => {
    setSelectedAction(null)
  }

  const handleSuccess = () => {
    setShowSuccess(true)
    setSelectedAction(null)
  }

  const handleNextScan = () => {
    setShowSuccess(false)
    setScanData(null)
    // Try to scan again
    if (liff) {
      liff.scanCode().then(result => {
        const value = result.value
        // Parse QR value (format: /scan/type/id or just type/id)
        const match = value.match(/(?:scan\/)?([^\/]+)\/([^\/]+)$/)
        if (match) {
          setScanData({ type: match[1], id: match[2] })
        }
      }).catch(() => {
        // User cancelled or scan failed
      })
    }
  }

  const handleClose = () => {
    if (liff) {
      liff.closeWindow()
    }
  }

  const handleLogin = () => {
    login()
  }

  // Not ready yet
  if (!isReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '12px', color: '#666' }}>กำลังเริ่มต้น...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} error={liffError} />
  }

  // Render views
  const renderContent = () => {
    // Success screen
    if (showSuccess) {
      return <SuccessPage onNextScan={handleNextScan} onClose={handleClose} />
    }

    // Action form
    if (selectedAction && scanData) {
      if (selectedAction === 'report') {
        return (
          <ProblemReport
            type={scanData.type}
            id={scanData.id}
            onBack={handleBack}
            onSuccess={handleSuccess}
            isOnline={isOnline}
          />
        )
      }

      return (
        <ActionForm
          type={scanData.type}
          id={scanData.id}
          action={selectedAction}
          onBack={handleBack}
          onSuccess={handleSuccess}
          isOnline={isOnline}
        />
      )
    }

    // Task view
    if (currentView === 'tasks') {
      return (
        <TaskList
          userId={profile?.userId}
          onBack={() => setCurrentView('scan')}
          isOnline={isOnline}
        />
      )
    }

    // Scan/Target view
    if (scanData) {
      return (
        <ScanPage
          type={scanData.type}
          id={scanData.id}
          onSelectAction={handleSelectAction}
        />
      )
    }

    // No scan data - show welcome or scan prompt
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌾</div>
          <h2>Farm Tracking</h2>
          <p style={{ color: '#666', margin: '16px 0' }}>
            สวัสดี {profile?.displayName}!
          </p>
          
          {!isOnline && (
            <div className="error" style={{ marginBottom: '16px', background: '#fff3e0' }}>
              📴 อยู่ในโหมดออฟไลน์ - ข้อมูลจะถูกบันทึกเมื่อเชื่อมต่ออินเทอร์เน็ต
            </div>
          )}
          
          {pendingCount > 0 && (
            <div style={{ 
              background: '#e3f2fd', 
              color: '#1976d2', 
              padding: '10px', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              📤 มี {pendingCount} รายการรอ sync
            </div>
          )}

          <p style={{ color: '#999', fontSize: '14px' }}>
            สแกน QR Code บนต้นไม้หรือแปลงเพื่อเริ่มบันทึกกิจกรรม
          </p>

          <button 
            className="btn btn-primary" 
            style={{ marginTop: '20px' }}
            onClick={async () => {
              try {
                const result = await liff.scanCode()
                const value = result.value
                const match = value.match(/(?:scan\/)?([^\/]+)\/([^\/]+)$/)
                if (match) {
                  setScanData({ type: match[1], id: match[2] })
                } else {
                  alert('QR Code ไม่ถูกต้อง')
                }
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
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">
          📴 ไม่มีการเชื่อมต่ออินเทอร์เน็ต
        </div>
      )}

      {/* Header */}
      <Header 
        title="Farm Tracking"
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'scan') {
            setScanData(null)
            setSelectedAction(null)
            setShowSuccess(false)
          }
          setCurrentView(view)
        }}
      />

      {/* Content */}
      <main style={{ paddingTop: scanData || selectedAction || showSuccess || currentView === 'tasks' ? 0 : 0 }}>
        {renderContent()}
      </main>
    </>
  )
}

export default App
