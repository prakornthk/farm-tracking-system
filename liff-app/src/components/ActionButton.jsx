import React from 'react'

const ACTION_CONFIG = {
  water:     { icon: '💧', label: 'รดน้ำ',       color: '#3b82f6' },
  fertilize: { icon: '🌿', label: 'ใส่ปุ๋ย',      color: '#22c55e' },
  prune:     { icon: '✂️', label: 'ตัดแต่ง',      color: '#8b5cf6' },
  inspect:   { icon: '🔍', label: 'ตรวจสอบ',     color: '#f59e0b' },
  harvest:   { icon: '🍎', label: 'เก็บเกี่ยว',   color: '#ef4444' },
  spraying:  { icon: '🔬', label: 'พ่นยา',       color: '#10b981' },
  report:    { icon: '⚠️', label: 'แจ้งปัญหา',   color: '#ef4444' }
}

const ActionButton = ({ action, onClick }) => {
  const config = ACTION_CONFIG[action] || { icon: '❓', label: action, color: '#78716c' }
  const isReport = action === 'report'

  return (
    <button
      className={`action-btn${isReport ? ' report' : ''}`}
      onClick={() => onClick(action)}
      aria-label={config.label}
      type="button"
    >
      <span className="icon-wrapper" aria-hidden="true">{config.icon}</span>
      <span className="label">{config.label}</span>
    </button>
  )
}

export { ACTION_CONFIG }
export default ActionButton
