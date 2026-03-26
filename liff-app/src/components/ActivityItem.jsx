import React, { useMemo } from 'react'

const ACTION_ICONS = {
  water:     '💧',
  fertilize: '🌿',
  prune:     '✂️',
  inspect:   '🔍',
  harvest:   '🍎',
  report:    '⚠️',
  plant:     '🌱',
  create:    '➕'
}

const ACTION_BG = {
  water:     'var(--color-info-bg)',
  fertilize: 'var(--color-success-bg)',
  prune:     'var(--color-primary-bg)',
  inspect:   'var(--color-warning-bg)',
  harvest:   'var(--color-danger-bg)',
  report:    'var(--color-danger-bg)',
}

const ActivityItem = React.memo(({ activity }) => {
  const icon = ACTION_ICONS[activity.action_type] || '📝'
  const iconBg = ACTION_BG[activity.action_type] || 'var(--color-border)'

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

  const formattedDate = useMemo(() => formatDate(activity.created_at), [activity.created_at])

  return (
    <div className="activity-item">
      <div className="activity-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="activity-body">
        <div className="activity-action">{activity.action_display || activity.action_type}</div>
        <div className="activity-meta">
          <span>{formattedDate}</span>
          {activity.user_name && <span>{activity.user_name}</span>}
        </div>
        {activity.notes && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', lineHeight: 'var(--leading-relaxed)' }}>
            {activity.notes}
          </p>
        )}
      </div>
    </div>
  )
})

export default ActivityItem
