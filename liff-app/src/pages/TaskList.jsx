import React, { useState, useEffect } from 'react'
import Loading from '../components/Loading'
import { getTasks, completeTask, addToOfflineQueue } from '../services/api'

const TaskList = ({ userId, onBack, isOnline }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completingId, setCompletingId] = useState(null)

  useEffect(() => { fetchTasks() }, [userId])

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await getTasks(userId)
      setTasks(res.data || [])
    } catch (err) {
      console.error('Fetch tasks error:', err)
      if (err.offline) {
        setTasks([
          { id: 'task-1', title: 'รดน้ำต้นมะม่วง', target_type: 'plant', target_id: 'M-001', location: 'แปลง A', status: 'pending', due_date: new Date().toISOString() },
          { id: 'task-2', title: 'ตรวจสอบแปลงทดลอง', target_type: 'plot', target_id: 'P-101', location: 'แปลง B', status: 'in-progress', due_date: new Date().toISOString() }
        ])
      } else {
        setError('ไม่สามารถโหลดงานได้')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (taskId) => {
    setCompletingId(taskId)
    try {
      if (!isOnline) {
        await addToOfflineQueue('task_complete', { taskId })
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
        setCompletingId(null)
        return
      }
      await completeTask(taskId)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
    } catch (err) {
      console.error('Complete task error:', err)
      if (err.offline) {
        await addToOfflineQueue('task_complete', { taskId })
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
      }
    } finally {
      setCompletingId(null)
    }
  }

  const getTaskIcon = (type) => {
    const icons = { plant: '🌿', plot: '🗺️' }
    return icons[type] || '📋'
  }

  const getIconBg = (type) => {
    const bgs = {
      plant: 'var(--color-primary-bg)',
      plot:  'var(--color-info-bg)'
    }
    return bgs[type] || 'var(--color-border)'
  }

  const getStatusLabel = { pending: 'รอดำเนินการ', 'in-progress': 'กำลังทำ', completed: 'เสร็จแล้ว' }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (loading) return <Loading message="กำลังโหลดงาน..." />

  return (
    <div className="container">
      <button className="back-btn" onClick={onBack}>← กลับ</button>

      <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
        📋 งานที่ได้รับมอบหมาย
      </h2>

      {error && (
        <div className="error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
          <button className="btn btn-secondary" onClick={fetchTasks}
            style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', width: 'auto' }}>
            ลองใหม่
          </button>
        </div>
      )}

      {tasks.length === 0 && !error ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <p className="empty-message">ไม่มีงานที่ได้รับมอบหมาย</p>
        </div>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <ul className="task-list">
              {pendingTasks.map(task => (
                <li key={task.id} className="task-item">
                  <div className="task-icon" style={getIconBg(task.target_type)}>
                    {getTaskIcon(task.target_type)}
                  </div>
                  <div className="task-body">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      📍 {task.location || `${task.target_type} #${task.target_id}`}
                      {task.due_date && ` • กำหนด ${formatDate(task.due_date)}`}
                    </div>
                    <span className={`status-badge ${task.status === 'in-progress' ? 'in-progress' : 'pending'}`}>
                      {getStatusLabel[task.status]}
                    </span>
                  </div>
                  <div className="task-actions">
                    <button className="complete-btn"
                      onClick={() => handleComplete(task.id)}
                      disabled={completingId === task.id}
                      aria-label={completingId === task.id ? 'กำลังดำเนินการ...' : `ทำเครื่องหมายงาน "${task.title}" เสร็จแล้ว`}
                    >
                      {completingId === task.id ? '...' : 'เสร็จ'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {completedTasks.length > 0 && (
            <div style={{ marginTop: 'var(--space-6)' }}>
              <div className="section-header">
                <span className="section-title">✓ เสร็จแล้ว ({completedTasks.length})</span>
              </div>
              <ul className="task-list">
                {completedTasks.map(task => (
                  <li key={task.id} className="task-item" style={{ opacity: 0.55 }}>
                    <div className="task-icon" style={getIconBg(task.target_type)}>
                      {getTaskIcon(task.target_type)}
                    </div>
                    <div className="task-body">
                      <div className="task-title" style={{ textDecoration: 'line-through' }}>
                        {task.title}
                      </div>
                      <div className="task-meta">
                        📍 {task.location || `${task.target_type} #${task.target_id}`}
                      </div>
                      <span className="status-badge completed">เสร็จแล้ว</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TaskList
