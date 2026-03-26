import React from 'react'

const Header = ({ title = 'Farm Tracking', currentView, onViewChange }) => {
  return (
    <header className="header">
      <h1>{title}</h1>
      <nav className="header-nav">
        <button
          className={currentView === 'scan' ? 'active' : ''}
          onClick={() => onViewChange('scan')}
        >
          📱 สแกน
        </button>
        <button
          className={currentView === 'tasks' ? 'active' : ''}
          onClick={() => onViewChange('tasks')}
        >
          📋 งาน
        </button>
      </nav>
    </header>
  )
}

export default Header
