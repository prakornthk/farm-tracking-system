import React from 'react'

const Header = React.memo(({ title = 'Farm Tracking', subtitle, currentView, onViewChange }) => {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo" aria-hidden="true">🌱</div>
        <div className="header-text">
          <h1>{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      <nav className="header-nav" aria-label="เมนูหลัก">
        <button
          className={`header-nav-btn${currentView === 'scan' ? ' active' : ''}`}
          onClick={() => onViewChange('scan')}
          aria-current={currentView === 'scan' ? 'page' : undefined}
        >
          <span aria-hidden="true">📱</span>
          สแกน
        </button>
        <button
          className={`header-nav-btn${currentView === 'tasks' ? ' active' : ''}`}
          onClick={() => onViewChange('tasks')}
          aria-current={currentView === 'tasks' ? 'page' : undefined}
        >
          <span aria-hidden="true">📋</span>
          งาน
        </button>
      </nav>
    </header>
  )
})

export default Header
