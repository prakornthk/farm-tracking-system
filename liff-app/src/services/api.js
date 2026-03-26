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
  return withRetry(() => api.post('/activities', data))
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
  return withRetry(() => api.patch(`/tasks/${taskId}/complete`))
}

// Problem Reports
export const submitProblemReport = async (formData) => {
  return withRetry(() => api.post('/problems', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }))
}

// ── Offline Queue ─────────────────────────────────────────────
// Photos are too large for localStorage and File objects cannot be JSON-serialized.
// We use IndexedDB (via idb-keyval-like API) to persist photo Blobs separately,
// keyed by the same photoId used in the queue.
//
// Storage budget: ~5MB localStorage for queue metadata, unlimited IndexedDB for photos.

const OFFLINE_QUEUE_KEY = 'farm_offline_queue'

// ── IndexedDB wrapper for photo blob storage ──
const DB_NAME = 'farm_liff_db'
const DB_VERSION = 1
const PHOTO_STORE = 'photos'

const openPhotoDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, DB_VERSION)
  req.onerror = () => reject(req.error)
  req.onsuccess = () => resolve(req.result)
  req.onupgradeneeded = (e) => {
    const db = e.target.result
    if (!db.objectStoreNames.contains(PHOTO_STORE)) {
      db.createObjectStore(PHOTO_STORE, { keyPath: 'id' })
    }
  }
})

const photoDBGet = async (id) => {
  const db = await openPhotoDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readonly')
    const store = tx.objectStore(PHOTO_STORE)
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const photoDBPut = async ({ id, blob, timestamp }) => {
  const db = await openPhotoDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite')
    const store = tx.objectStore(PHOTO_STORE)
    const req = store.put({ id, blob, timestamp })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const photoDBDelete = async (id) => {
  const db = await openPhotoDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite')
    const store = tx.objectStore(PHOTO_STORE)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

const photoDBClear = async () => {
  const db = await openPhotoDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite')
    const store = tx.objectStore(PHOTO_STORE)
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// ── Queue operations ──

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

// Serialize queue item — store File/Blob photos in IndexedDB, keep only the reference in localStorage queue
const serializeQueueItem = async (action, data) => {
  const serialized = { ...data }
  const photoIdsToCleanup = []

  if (serialized.photo && serialized.photo instanceof File) {
    const photoId = generateId()
    serialized._photoId = photoId
    // Store blob in IndexedDB (persists across page refreshes)
    try {
      await photoDBPut({ id: photoId, blob: serialized.photo, timestamp: Date.now() })
    } catch (e) {
      console.error('Failed to store photo in IndexedDB:', e)
      // If storage fails (quota exceeded, private browsing, etc.),
      // remove photo from queued data so the action still syncs without the photo.
      // The user will need to re-add the photo when back online.
      delete serialized.photo
      delete serialized._photoId
    }
    delete serialized.photo
  }

  return {
    id: generateId(),
    action,
    data: serialized,
    timestamp: Date.now()
  }
}

// Restore Blob from IndexedDB back into a File-like object for FormData upload
const restorePhotoFromDB = async (photoId) => {
  try {
    const record = await photoDBGet(photoId)
    if (!record) return null
    // Reconstruct a File from the stored Blob (Blob is File's parent, acceptable for FormData)
    return record.blob
  } catch (e) {
    console.error('Failed to restore photo from IndexedDB:', e)
    return null
  }
}

export const addToOfflineQueue = async (action, data) => {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
  try {
    const serializedItem = await serializeQueueItem(action, data)
    queue.push(serializedItem)
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  } catch (e) {
    console.error('Failed to serialize queue item:', e)
    throw e
  }
}

export const getOfflineQueue = () => {
  return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
}

export const clearOfflineQueue = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
  // Also clear photo blobs from IndexedDB
  photoDBClear().catch(console.error)
}

export const syncOfflineQueue = async () => {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
  if (queue.length === 0) return { synced: 0, remaining: 0 }

  let synced = 0
  const failedItems = []
  const syncedPhotoIds = []

  for (const item of queue) {
    try {
      // Restore photo Blob from IndexedDB if needed
      const itemData = { ...item.data }
      if (itemData._photoId) {
        const restoredPhoto = await restorePhotoFromDB(itemData._photoId)
        if (restoredPhoto) {
          itemData.photo = restoredPhoto
        }
        delete itemData._photoId
      }

      switch (item.action) {
        case 'activity': {
          const formData = new FormData()
          const { photo, ...rest } = itemData
          for (const [key, value] of Object.entries(rest)) {
            if (value != null) formData.append(key, value)
          }
          if (photo) formData.append('photo', photo)
          await logActivity(formData)
          break
        }
        case 'problem': {
          const formData = new FormData()
          const { photo, ...rest } = itemData
          for (const [key, value] of Object.entries(rest)) {
            if (value != null) formData.append(key, value)
          }
          if (photo) formData.append('photo', photo)
          await submitProblemReport(formData)
          break
        }
        case 'task_complete':
          await completeTask(itemData.taskId)
          break
      }

      // Clean up IndexedDB entry for successfully synced photos
      if (item.data._photoId) {
        syncedPhotoIds.push(item.data._photoId)
      }
      synced++
    } catch (e) {
      console.error('Sync failed for item:', item.id, e)
      failedItems.push(item)
    }
  }

  // Remove synced photo blobs from IndexedDB
  await Promise.all(syncedPhotoIds.map(id => photoDBDelete(id).catch(() => {})))

  if (failedItems.length === 0) {
    clearOfflineQueue()
  } else {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems))
  }

  return { synced, remaining: failedItems.length }
}

export default api
