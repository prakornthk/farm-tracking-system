import React, { useState, useEffect } from 'react'
import ActionButton from '../components/ActionButton'
import ActivityItem from '../components/ActivityItem'
import Loading from '../components/Loading'
import { getTargetInfo, getActivities } from '../services/api'

const TYPE_CONFIG = {
  plant: { icon: '🌿', label: 'ต้นไม้', bg: 'var(--color-primary-bg)', color: 'var(--color-primary)' },
  plot:  { icon: '🗺️', label: 'แปลง',   bg: 'var(--color-info-bg)',    color: 'var(--color-info-dark)' }
}

const ScanPage = ({ type, id, onSelectAction }) => {
  const [target, setTarget] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [targetRes, activitiesRes] = await Promise.all([
          getTargetInfo(type, id),
          getActivities(type, id, 5)
        ])
        setTarget(targetRes.data)
        setActivities(activitiesRes.data?.data || [])
      } catch (err) {
        console.error('Fetch error:', err)
        if (err.offline) {
          setTarget({ name: id, type, location: 'แปลง A', status: 'active' })
          setActivities([])
        } else {
          setError('ไม่สามารถโหลดข้อมูลได้')
        }
      } finally {
        setLoading(false)
      }
    }
    if (type && id) fetchData()
  }, [type, id])

  if (loading) return <Loading message="กำลังโหลดข้อมูล..." />

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>ลองใหม่</button>
      </div>
    )
  }

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.plant

  return (
    <div className="container">
      {/* Target Info — asymmetric layout, left-aligned */}
      <div className="card card-padded target-header">
        <div className="target-icon" aria-hidden="true" style={{ background: config.bg }}>
          {config.icon}
        </div>
        <div className="target-info">
          <h2 className="target-name">{target?.name || id}</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
            <span className="type-badge">{config.label} #{id}</span>
            {target?.status && (
              <span className={`badge ${target.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                {target.status === 'active' ? '● พร้อมใช้งาน' : target.status}
              </span>
            )}
          </div>
          {target?.location && (
            <p className="target-location">📍 {target.location}</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-header" style={{ marginBottom: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
        <span className="section-title">ดำเนินการด่วน</span>
      </div>
      <div className="action-grid">
        <ActionButton action="water"     onClick={onSelectAction} />
        <ActionButton action="fertilize" onClick={onSelectAction} />
        <ActionButton action="prune"     onClick={onSelectAction} />
        <ActionButton action="spraying"  onClick={onSelectAction} />
        <ActionButton action="inspect"   onClick={onSelectAction} />
        <ActionButton action="harvest"   onClick={onSelectAction} />
        <ActionButton action="report"    onClick={onSelectAction} />
      </div>

      {/* Recent Activities */}
      <div className="card card-padded">
        <div className="section-header" style={{ marginBottom: 'var(--space-2)' }}>
          <span className="section-title">กิจกรรมล่าสุด</span>
        </div>
        {activities.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-6) 0' }} role="status">
            <div className="empty-icon" aria-hidden="true">📋</div>
            <p className="empty-message">ยังไม่มีกิจกรรม</p>
          </div>
        ) : (
          <div role="list" aria-label="กิจกรรมล่าสุด">
            {activities.map((activity, index) => (
              <ActivityItem key={activity.id || index} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ScanPage
