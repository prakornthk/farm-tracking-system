import { useState, useEffect, useCallback, useRef } from 'react'
import { syncOfflineQueue } from '../services/api'

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(() => {
    // Initialize from localStorage on mount
    try {
      const queue = JSON.parse(localStorage.getItem('farm_offline_queue') || '[]')
      return queue.length
    } catch {
      return 0
    }
  })
  
  const isSyncingRef = useRef(false)
  const mountedRef = useRef(true)

  const handleSync = useCallback(async () => {
    if (!navigator.onLine || isSyncingRef.current) return

    isSyncingRef.current = true
    setIsSyncing(true)
    try {
      const result = await syncOfflineQueue()
      if (mountedRef.current) {
        setPendingCount(result.remaining || 0)
      }
      return result
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      isSyncingRef.current = false
      if (mountedRef.current) {
        setIsSyncing(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    const handleOnline = () => {
      setIsOnline(true)
      // Auto sync when back online
      handleSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      mountedRef.current = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleSync])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    sync: handleSync
  }
}

export default useOffline
