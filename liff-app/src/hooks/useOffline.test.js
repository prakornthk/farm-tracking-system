import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import React from 'react'
import useOffline from '../hooks/useOffline'
import * as api from '../services/api'

vi.mock('../services/api', () => ({
  syncOfflineQueue: vi.fn(),
  setDemoMode: vi.fn(),
  loginWithLineAccessToken: vi.fn(),
  setAuthToken: vi.fn()
}))

describe('useOffline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage mock
    localStorage.clear()
    localStorage.getItem.mockClear()
    localStorage.setItem.mockClear()
  })

  describe('initial state', () => {
    it('returns isOnline=true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      const { result } = renderHook(() => useOffline())
      expect(result.current.isOnline).toBe(true)
    })

    it('returns isOnline=false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      const { result } = renderHook(() => useOffline())
      expect(result.current.isOnline).toBe(false)
    })

    it('initializes pendingCount from localStorage queue', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify([
        { id: 'q1', action: 'activity' },
        { id: 'q2', action: 'problem' }
      ]))
      const { result } = renderHook(() => useOffline())
      expect(result.current.pendingCount).toBe(2)
    })

    it('returns isSyncing=false initially', () => {
      const { result } = renderHook(() => useOffline())
      expect(result.current.isSyncing).toBe(false)
    })
  })

  describe('online/offline event listeners', () => {
    it('updates isOnline to true on online event', async () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      const { result } = renderHook(() => useOffline())

      act(() => {
        window.dispatchEvent(new Event('online'))
      })

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true)
      })
    })

    it('updates isOnline to false on offline event', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
      const { result } = renderHook(() => useOffline())

      act(() => {
        window.dispatchEvent(new Event('offline'))
      })

      expect(result.current.isOnline).toBe(false)
    })
  })

  describe('sync functionality', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue('[]')
    })

    it('sync calls syncOfflineQueue API', async () => {
      vi.mocked(api.syncOfflineQueue).mockResolvedValue({ synced: 1, remaining: 0 })
      const { result } = renderHook(() => useOffline())

      await act(async () => {
        await result.current.sync()
      })

      expect(api.syncOfflineQueue).toHaveBeenCalled()
    })

    it('sync updates pendingCount with remaining from API response', async () => {
      vi.mocked(api.syncOfflineQueue).mockResolvedValue({ synced: 2, remaining: 3 })
      const { result } = renderHook(() => useOffline())

      await act(async () => {
        await result.current.sync()
      })

      await waitFor(() => {
        expect(result.current.pendingCount).toBe(3)
      })
    })

    it('sync sets isSyncing=true while syncing', async () => {
      vi.mocked(api.syncOfflineQueue).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 50))
      )
      const { result } = renderHook(() => useOffline())

      act(() => {
        result.current.sync()
      })

      // Immediately after calling sync, isSyncing should be true
      expect(result.current.isSyncing).toBe(true)
    })

    it('sync does not run when offline', () => {
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })
      const { result } = renderHook(() => useOffline())

      act(() => {
        result.current.sync()
      })

      expect(api.syncOfflineQueue).not.toHaveBeenCalled()
    })

    it('sync does not run if already syncing (idempotent)', async () => {
      vi.mocked(api.syncOfflineQueue).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ synced: 0, remaining: 0 }), 100))
      )
      const { result } = renderHook(() => useOffline())

      // Call sync twice rapidly
      await act(async () => {
        result.current.sync()
        result.current.sync()
      })

      // Only one call should be made
      expect(api.syncOfflineQueue).toHaveBeenCalledTimes(1)
    })
  })

  describe('auto-sync on reconnect', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue('[]')
    })

    it('triggers sync automatically when coming back online', async () => {
      vi.mocked(api.syncOfflineQueue).mockResolvedValue({ synced: 0, remaining: 0 })
      Object.defineProperty(navigator, 'onLine', { writable: true, value: false })

      renderHook(() => useOffline())

      // Simulate coming back online
      act(() => {
        Object.defineProperty(navigator, 'onLine', { writable: true, value: true })
        window.dispatchEvent(new Event('online'))
      })

      await waitFor(() => {
        expect(api.syncOfflineQueue).toHaveBeenCalled()
      })
    })
  })

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      Object.defineProperty(navigator, 'onLine', { writable: true, value: true })

      const { unmount } = renderHook(() => useOffline())
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    })
  })
})
