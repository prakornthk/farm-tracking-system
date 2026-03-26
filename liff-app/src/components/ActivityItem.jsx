import React, { useMemo } from 'react'

const ACTION_ICONS = {
  water: '💧',
  fertilize: '🌿',
  prune: '✂️',
  inspect: '🔍',
  harvest: '🍎',
  report: '⚠️',
  plant: '🌱',
  create: '➕'
}

const ActivityItem = React.memo(({ activity }) => {
  const icon = ACTION_ICONS[activity.action_type] || '📝'
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'เพิ่งทำ'
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`
    return date.toLocaleDateString('th-TH')
  }

  const formattedDate = useMemo(() => 
    formatDate(activity.created_at),
    [activity.created_at]
  )

  return (
    <div className="activity-item">
      <span className="activity-icon">{icon}</span>
      <div className="activity-details">
        <div className="action">{activity.action_display || activity.action_type}</div>
        <div className="meta">
          {formattedDate}
          {activity.user_name && ` • ${activity.user_name}`}
        </div>
        {activity.notes && (
          <div className="notes" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {activity.notes}
          </div>
        )}
      </div>
    </div>
  )
})

export default ActivityItem
