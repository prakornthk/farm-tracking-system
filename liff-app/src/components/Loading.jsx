import React from 'react'

const Loading = ({ message = 'กำลังโหลด...' }) => {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  )
}

export default Loading
