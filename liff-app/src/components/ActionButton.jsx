import React from 'react'

const ACTION_CONFIG = {
  water: { icon: '💧', label: 'รดน้ำ', color: '#2196F3' },
  fertilize: { icon: '🌿', label: 'ใส่ปุ๋ย', color: '#4CAF50' },
  prune: { icon: '✂️', label: 'ตัดแต่ง', color: '#9C27B0' },
  inspect: { icon: '🔍', label: 'ตรวจสอบ', color: '#FF9800' },
  harvest: { icon: '🍎', label: 'เก็บเกี่ยว', color: '#f44336' },
  report: { icon: '⚠️', label: 'แจ้งปัญหา', color: '#f44336' }
}

const ActionButton = React.memo(({ action, onClick }) => {
  const config = ACTION_CONFIG[action] || { icon: '❓', label: action, color: '#666' }
  const isReport = action === 'report'

  return (
    <button
      className={`action-btn ${isReport ? 'report' : ''}`}
      onClick={() => onClick(action)}
      style={{ borderColor: isReport ? config.color : undefined }}
    >
      <span className="icon">{config.icon}</span>
      <span className="label">{config.label}</span>
    </button>
  )
})

export { ACTION_CONFIG }
export default ActionButton
