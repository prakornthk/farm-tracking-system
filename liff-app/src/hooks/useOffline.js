import { useState, useEffect, useCallback } from 'react'
import { syncOfflineQueue } from '../services/api'

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
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
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return

    setIsSyncing(true)
    try {
      const result = await syncOfflineQueue()
      setPendingCount(result.remaining || 0)
      return result
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    sync: handleSync
  }
}

export default useOffline
