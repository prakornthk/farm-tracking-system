import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.farm-system.example.com'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('liff_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for offline handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!navigator.onLine) {
      return Promise.reject({ offline: true, message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต' })
    }
    return Promise.reject(error)
  }
)

// Activity Actions
export const logActivity = async (data) => {
  return api.post('/activities', data)
}

export const getActivities = async (type, id, limit = 10) => {
  return api.get(`/targets/${type}/${id}/activities`, { params: { limit } })
}

// Target Info
export const getTargetInfo = async (type, id) => {
  return api.get(`/targets/${type}/${id}`)
}

// Tasks
export const getTasks = async (userId) => {
  return api.get('/tasks', { params: { user_id: userId } })
}

export const completeTask = async (taskId) => {
  return api.patch(`/tasks/${taskId}/complete`)
}

// Problem Reports
export const submitProblemReport = async (formData) => {
  return api.post('/problems', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Offline Queue
const OFFLINE_QUEUE_KEY = 'farm_offline_queue'

export const addToOfflineQueue = (action, data) => {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
  queue.push({ action, data, timestamp: Date.now() })
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export const getOfflineQueue = () => {
  return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
}

export const clearOfflineQueue = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
}

export const syncOfflineQueue = async () => {
  const queue = getOfflineQueue()
  if (queue.length === 0) return { synced: 0 }

  let synced = 0
  for (const item of queue) {
    try {
      switch (item.action) {
        case 'activity':
          await logActivity(item.data)
          break
        case 'problem':
          await submitProblemReport(item.data)
          break
        case 'task_complete':
          await completeTask(item.data.taskId)
          break
      }
      synced++
    } catch (e) {
      console.error('Sync failed for item:', item)
    }
  }
  
  if (synced === queue.length) {
    clearOfflineQueue()
  }
  
  return { synced, remaining: queue.length - synced }
}

export default api
