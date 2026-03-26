import React, { useState, useEffect } from 'react'
import Loading from '../components/Loading'
import { getTasks, completeTask, addToOfflineQueue } from '../services/api'

const TaskList = ({ userId, onBack, isOnline }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completingId, setCompletingId] = useState(null)

  useEffect(() => {
    fetchTasks()
  }, [userId])

  const fetchTasks = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await getTasks(userId)
      setTasks(res.data || [])
    } catch (err) {
      console.error('Fetch tasks error:', err)
      if (err.offline) {
        // Mock data for offline
        setTasks([
          {
            id: 'task-1',
            title: 'รดน้ำต้นมะม่วง',
            target_type: 'plant',
            target_id: 'M-001',
            location: 'แปลง A',
            status: 'pending',
            due_date: new Date().toISOString()
          },
          {
            id: 'task-2',
            title: 'ตรวจสอบแปลงทดลอง',
            target_type: 'plot',
            target_id: 'P-101',
            location: 'แปลง B',
            status: 'in-progress',
            due_date: new Date().toISOString()
          }
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
        addToOfflineQueue('task_complete', { taskId })
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'completed' } : t
        ))
        setCompletingId(null)
        return
      }

      await completeTask(taskId)
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'completed' } : t
      ))
    } catch (err) {
      console.error('Complete task error:', err)
      if (err.offline) {
        addToOfflineQueue('task_complete', { taskId })
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'completed' } : t
        ))
      }
    } finally {
      setCompletingId(null)
    }
  }

  const getTaskIcon = (type) => {
    switch (type) {
      case 'plant': return '🌿'
      case 'plot': return '🗺️'
      default: return '📋'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ'
      case 'in-progress': return 'กำลังทำ'
      case 'completed': return 'เสร็จแล้ว'
      default: return status
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'pending'
      case 'in-progress': return 'in-progress'
      case 'completed': return 'completed'
      default: return ''
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (loading) {
    return <Loading message="กำลังโหลดงาน..." />
  }

  return (
    <div className="container">
      <button className="back-btn" onClick={onBack}>
        ← กลับ
      </button>

      <h2 style={{ marginBottom: '16px' }}>📋 งานที่ได้รับมอบหมาย</h2>

      {error && (
        <div className="error" style={{ marginBottom: '16px' }}>
          {error}
          <button 
            className="btn btn-secondary" 
            onClick={fetchTasks}
            style={{ marginTop: '10px', padding: '8px 16px' }}
          >
            ลองใหม่
          </button>
        </div>
      )}

      {tasks.length === 0 && !error ? (
        <div className="empty-state">
          <div className="icon">✅</div>
          <p>ไม่มีงานที่ได้รับมอบหมาย</p>
        </div>
      ) : (
        <>
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <ul className="task-list">
              {pendingTasks.map(task => (
                <li key={task.id} className="task-item">
                  <span className="task-icon">{getTaskIcon(task.target_type)}</span>
                  <div className="task-content">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      📍 {task.location || `${task.target_type} #${task.target_id}`}
                      {task.due_date && ` • กำหนด ${formatDate(task.due_date)}`}
                    </div>
                    <span className={`status-badge ${getStatusClass(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                  <div className="task-actions">
                    <button
                      className="complete-btn"
                      onClick={() => handleComplete(task.id)}
                      disabled={completingId === task.id}
                    >
                      {completingId === task.id ? '...' : 'เสร็จ'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                ✓ เสร็จแล้ว ({completedTasks.length})
              </h3>
              <ul className="task-list">
                {completedTasks.map(task => (
                  <li key={task.id} className="task-item" style={{ opacity: 0.6 }}>
                    <span className="task-icon">{getTaskIcon(task.target_type)}</span>
                    <div className="task-content">
                      <div className="task-title" style={{ textDecoration: 'line-through' }}>
                        {task.title}
                      </div>
                      <div className="task-meta">
                        📍 {task.location || `${task.target_type} #${task.target_id}`}
                      </div>
                      <span className={`status-badge ${getStatusClass(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
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
