import React, { useState, useEffect } from 'react'
import ActionButton from '../components/ActionButton'
import ActivityItem from '../components/ActivityItem'
import Loading from '../components/Loading'
import { getTargetInfo, getActivities } from '../services/api'

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
        const scanResult = { type, plant_id: type === 'plant' ? id : null, plot_id: type === 'plot' ? id : null }
        const [targetRes, activitiesRes] = await Promise.all([
          getTargetInfo(scanResult),
          getActivities(scanResult, 5)
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
      } finally { setLoading(false) }
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

  const getTargetIcon = () => ({ plant: '🌿', plot: '🗺️' }[type] || '🌱')
  const getTypeLabel = () => ({ plant: 'ต้นไม้', plot: 'แปลง' }[type] || type)

  return (
    <div className="container">
      {/* Target Info Card */}
      <div className="card target-info">
        <span className="target-icon">{getTargetIcon()}</span>
        <h2 className="target-name">{target?.name || id}</h2>
        <span className="type-badge">{getTypeLabel()}</span>
        {target?.location && (
          <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            📍 {target.location}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 'var(--space-3)' }}>
          <span className="section-title">ดำเนินการด่วน</span>
        </div>
        <div className="action-grid">
          <ActionButton action="water"     onClick={onSelectAction} />
          <ActionButton action="fertilize" onClick={onSelectAction} />
          <ActionButton action="prune"     onClick={onSelectAction} />
          <ActionButton action="inspect"   onClick={onSelectAction} />
          <ActionButton action="harvest"   onClick={onSelectAction} />
          <ActionButton action="report"    onClick={onSelectAction} />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 'var(--space-2)' }}>
          <span className="section-title">กิจกรรมล่าสุด</span>
        </div>
        {activities.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-5) 0' }}>
            <span className="empty-icon">📋</span>
            <p className="empty-message">ยังไม่มีกิจกรรม</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <ActivityItem key={activity.id || index} activity={activity} />
          ))
        )}
      </div>
    </div>
  )
}

export default ScanPage
