import React, { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ paddingTop: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <h2>เกิดข้อผิดพลาด</h2>
          <p style={{ color: '#666', margin: '16px 0' }}>
            กรุณาลองรีเฟรชหน้า หรือปิดและเปิดใหม่
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px' }}
          >
            รีเฟรช
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
