import React, { useState, useEffect } from 'react'
import Loading from '../components/Loading'
import { getTasks, completeTask, addToOfflineQueue } from '../services/api'

const TYPE_ICONS = {
  plant: { icon: '🌿', bg: 'var(--color-primary-bg)' },
  plot:  { icon: '🗺️', bg: 'var(--color-info-bg)' }
}

const STATUS_CONFIG = {
  pending:     { label: 'รอดำเนินการ', className: 'pending' },
  'in-progress': { label: 'กำลังทำ',     className: 'in-progress' },
  completed:   { label: 'เสร็จแล้ว',    className: 'completed' }
}

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (loading) return <Loading message="กำลังโหลดงาน..." />

  return (
    <div className="container">
      <button className="back-btn" onClick={onBack}>← กลับ</button>

      {/* Page Title */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
          📋 งานที่ได้รับมอบหมาย
        </h2>
        {tasks.length > 0 && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
            {pendingTasks.length} งานที่ต้องทำ
          </p>
        )}
      </div>

      {error && (
        <div className="error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchTasks}
            style={{ marginTop: 'var(--space-2)', width: 'auto' }}
          >
            ลองใหม่
          </button>
        </div>
      )}

      {tasks.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">✅</div>
          <p className="empty-message">ไม่มีงานที่ได้รับมอบหมาย</p>
        </div>
      ) : (
        <>
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <ul className="task-list" aria-label="งานที่ต้องทำ">
              {pendingTasks.map(task => {
                const typeInfo = TYPE_ICONS[task.target_type] || TYPE_ICONS.plant
                const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending
                const isCompleting = completingId === task.id

                return (
                  <li key={task.id} className="task-item">
                    <div
                      className="task-icon"
                      style={{ background: typeInfo.bg }}
                      aria-hidden="true"
                    >
                      {typeInfo.icon}
                    </div>
                    <div className="task-body">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta">
                        <span>📍 {task.location || `${task.target_type} #${task.target_id}`}</span>
                        {task.due_date && (
                          <span>📅 กำหนด {formatDate(task.due_date)}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                        <span className={`status-badge ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    <div className="task-actions">
                      <button
                        className="complete-btn"
                        onClick={() => handleComplete(task.id)}
                        disabled={isCompleting}
                        aria-label={isCompleting ? 'กำลังดำเนินการ...' : `ทำเครื่องหมาย "${task.title}" เสร็จแล้ว`}
                        type="button"
                      >
                        {isCompleting ? '...' : '✓ เสร็จ'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div style={{ marginTop: 'var(--space-6)' }}>
              <div className="section-header">
                <span className="section-title">✓ เสร็จแล้ว ({completedTasks.length})</span>
              </div>
              <ul className="task-list" aria-label="งานที่เสร็จแล้ว">
                {completedTasks.map(task => {
                  const typeInfo = TYPE_ICONS[task.target_type] || TYPE_ICONS.plant

                  return (
                    <li key={task.id} className="task-item completed">
                      <div
                        className="task-icon"
                        style={{ background: typeInfo.bg, opacity: 0.6 }}
                        aria-hidden="true"
                      >
                        {typeInfo.icon}
                      </div>
                      <div className="task-body">
                        <div className="task-title" style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                          {task.title}
                        </div>
                        <div className="task-meta">
                          <span>📍 {task.location || `${task.target_type} #${task.target_id}`}</span>
                        </div>
                        <span className="status-badge completed">เสร็จแล้ว</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TaskList
