import axios from 'axios'

const AUTH_TOKEN_KEY = 'liff_auth_token'
const DEMO_MODE_KEY = 'liff_demo_mode'

const envApiBase = import.meta.env.VITE_API_BASE
const API_BASE = (typeof envApiBase === 'string' && envApiBase.startsWith('/api')) ? envApiBase : '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY)

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

export const setDemoMode = (enabled) => {
  if (enabled) {
    localStorage.setItem(DEMO_MODE_KEY, '1')
  } else {
    localStorage.removeItem(DEMO_MODE_KEY)
  }
}

export const isDemoMode = () => localStorage.getItem(DEMO_MODE_KEY) === '1'

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isDemoMode()) {
      return Promise.reject({ offline: true, message: 'DEMO_MODE' })
    }
    if (!navigator.onLine) {
      return Promise.reject({ offline: true, message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต' })
    }
    return Promise.reject(error)
  }
)

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const loginWithLineAccessToken = async (accessToken) => {
  const res = await api.post('/auth/line/login', { access_token: accessToken })
  const token = res?.data?.data?.token || null
  if (token) {
    setAuthToken(token)
    setDemoMode(false)
  }
  return res
}

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const withRetry = async (fn, retries = MAX_RETRIES) => {
  let lastError
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (err.response || err.offline) throw err
      if (i < retries) await sleep(RETRY_DELAY_MS * (i + 1))
    }
  }
  throw lastError
}

export const logActivity = async (data) => {
  return withRetry(() => api.post('/activities', data))
}

export const getActivities = async (type, id, limit = 10) => {
  return api.get(`/targets/${type}/${id}/activities`, { params: { limit } })
}

export const getTargetInfo = async (type, id) => {
  return api.get(`/targets/${type}/${id}`)
}

export const getTasks = async (userId) => {
  return api.get('/tasks', { params: { user_id: userId } })
}

export const completeTask = async (taskId) => {
  return withRetry(() => api.patch(`/tasks/${taskId}/complete`))
}

export const submitProblemReport = async (formData) => {
  return withRetry(() => api.post('/problems', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }))
}

const OFFLINE_QUEUE_KEY = 'farm_offline_queue'

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

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

const serializeQueueItem = async (action, data) => {
  const serialized = { ...data }

  if (serialized.photo && serialized.photo instanceof File) {
    const photoId = generateId()
    serialized._photoId = photoId
    try {
      await photoDBPut({ id: photoId, blob: serialized.photo, timestamp: Date.now() })
    } catch (e) {
      console.error('Failed to store photo in IndexedDB:', e)
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

const restorePhotoFromDB = async (photoId) => {
  try {
    const record = await photoDBGet(photoId)
    if (!record) return null
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

      if (item.data._photoId) {
        syncedPhotoIds.push(item.data._photoId)
      }
      synced++
    } catch (e) {
      console.error('Sync failed for item:', item.id, e)
      failedItems.push(item)
    }
  }

  await Promise.all(syncedPhotoIds.map((id) => photoDBDelete(id).catch(() => {})))

  if (failedItems.length === 0) {
    clearOfflineQueue()
  } else {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems))
  }

  return { synced, remaining: failedItems.length }
}

export default api
