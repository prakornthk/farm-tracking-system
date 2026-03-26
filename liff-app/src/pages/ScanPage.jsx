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
        // Fetch target info and activities in parallel
        const [targetRes, activitiesRes] = await Promise.all([
          getTargetInfo(type, id),
          getActivities(type, id, 5)
        ])
        
        setTarget(targetRes.data)
        setActivities(activitiesRes.data || [])
      } catch (err) {
        console.error('Fetch error:', err)
        if (err.offline) {
          // Use mock data for offline demo
          setTarget({
            name: id,
            type: type,
            location: 'แปลง A',
            status: 'active'
          })
          setActivities([])
        } else {
          setError('ไม่สามารถโหลดข้อมูลได้')
        }
      } finally {
        setLoading(false)
      }
    }

    if (type && id) {
      fetchData()
    }
  }, [type, id])

  if (loading) {
    return <Loading message="กำลังโหลดข้อมูล..." />
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
          ลองใหม่
        </button>
      </div>
    )
  }

  const getTargetIcon = () => {
    if (!target) return '🌱'
    switch (type) {
      case 'plant': return '🌿'
      case 'plot': return '🗺️'
      default: return '🌱'
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'plant': return 'ต้นไม้'
      case 'plot': return 'แปลง'
      default: return type
    }
  }

  return (
    <div className="container">
      {/* Target Info Card */}
      <div className="card target-info">
        <div className="icon">{getTargetIcon()}</div>
        <h2>{target?.name || id}</h2>
        <span className="type-badge">{getTypeLabel()}</span>
        {target?.location && (
          <p style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
            📍 {target.location}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#666' }}>
          ดำเนินการด่วน
        </h3>
        <div className="action-grid">
          <ActionButton action="water" onClick={onSelectAction} />
          <ActionButton action="fertilize" onClick={onSelectAction} />
          <ActionButton action="prune" onClick={onSelectAction} />
          <ActionButton action="inspect" onClick={onSelectAction} />
          <ActionButton action="harvest" onClick={onSelectAction} />
          <ActionButton action="report" onClick={onSelectAction} />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card activities">
        <h3>กิจกรรมล่าสุด</h3>
        {activities.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
            ยังไม่มีกิจกรรม
          </p>
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
