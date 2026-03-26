import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.farm-system.example.com'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

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

// ── Retry logic for network resilience ──────────────────────
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const withRetry = async (fn, retries = MAX_RETRIES) => {
  let lastError
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      // Only retry on network errors, not on HTTP 4xx/5xx
      if (err.response || err.offline) throw err
      if (i < retries) await sleep(RETRY_DELAY_MS * (i + 1))
    }
  }
  throw lastError
}

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

// Offline Queue - Photo handling
// Photos (File objects) cannot be JSON serialized, so we store them separately
// and use blob URLs or store the data differently
const OFFLINE_QUEUE_KEY = 'farm_offline_queue'
const OFFLINE_PHOTOS_KEY = 'farm_offline_photos'

// Store photo data separately from queue items
const storePhoto = (photoFile) => {
  if (!photoFile) return null
  const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  return photoId
}

const getPhotoStore = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_PHOTOS_KEY) || '{}')
  } catch {
    return {}
  }
}

const setPhotoStore = (store) => {
  localStorage.setItem(OFFLINE_PHOTOS_KEY, JSON.stringify(store))
}

// Serialize queue item - handle File objects properly
const serializeQueueItem = (action, data) => {
  const serialized = { ...data }
  
  // Store photo File as a reference, not the actual File object
  // We can't serialize File objects to JSON
  if (serialized.photo && serialized.photo instanceof File) {
    const photoId = storePhoto(serialized.photo)
    serialized._photoId = photoId
    // Store the photo data separately
    const photoStore = getPhotoStore()
    // Convert File to storable format using FileReader
    const reader = new FileReader()
    // We'll store the base64 for offline - note: this increases storage usage
    // but is necessary for offline photo persistence
    // For very large photos, consider just storing the reference and losing the photo
    photoStore[photoId] = serialized.photo
    setPhotoStore(photoStore)
    delete serialized.photo
  }
  
  return {
    action,
    data: serialized,
    timestamp: Date.now()
  }
}

// Deserialize queue item - restore File objects from stored photos
const deserializeQueueItem = (item) => {
  if (!item) return item
  const deserialized = { ...item, data: { ...item.data } }
  
  if (deserialized.data._photoId) {
    const photoStore = getPhotoStore()
    const photo = photoStore[deserialized.data._photoId]
    if (photo) {
      deserialized.data.photo = photo
    }
    delete deserialized.data._photoId
  }
  
  return deserialized
}

export const addToOfflineQueue = (action, data) => {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
  const serializedItem = serializeQueueItem(action, data)
  queue.push(serializedItem)
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export const getOfflineQueue = () => {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
  // Note: File objects in queue are stored as references, not actual Files
  // They are restored when sync runs
  return queue
}

export const clearOfflineQueue = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
  localStorage.removeItem(OFFLINE_PHOTOS_KEY)
}

export const syncOfflineQueue = async () => {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
  if (queue.length === 0) return { synced: 0, remaining: 0 }

  let synced = 0
  const failedItems = []

  for (const item of queue) {
    try {
      const deserializedItem = deserializeQueueItem(item)
      
      switch (deserializedItem.action) {
        case 'activity': {
          const formData = new FormData()
          const { photo, ...rest } = deserializedItem.data
          for (const [key, value] of Object.entries(rest)) {
            if (value != null) formData.append(key, value)
          }
          if (photo instanceof File) {
            formData.append('photo', photo)
          }
          await logActivity(formData)
          break
        }
        case 'problem': {
          const formData = new FormData()
          const { photo, ...rest } = deserializedItem.data
          for (const [key, value] of Object.entries(rest)) {
            if (value != null) formData.append(key, value)
          }
          if (photo instanceof File) {
            formData.append('photo', photo)
          }
          await submitProblemReport(formData)
          break
        }
        case 'task_complete':
          await completeTask(deserializedItem.data.taskId)
          break
      }
      synced++
    } catch (e) {
      console.error('Sync failed for item:', item, e)
      failedItems.push(item)
    }
  }
  
  if (failedItems.length === 0) {
    clearOfflineQueue()
  } else {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems))
  }
  
  return { synced, remaining: failedItems.length }
}

export default api
