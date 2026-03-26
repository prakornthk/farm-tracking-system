import { useState, useEffect, useCallback, useRef } from 'react'

// NOTE: In production, install @line/liff-2 and use the real SDK:
// import liff from '@line/liff-2'
// 
// For development without LIFF SDK, this mock is used.
// To test real LIFF: npm install @line/liff-2 then update imports
import { createLiffMock } from '../services/liffMock'

const getLiff = () => {
  // Check if we have a real LIFF SDK
  // eslint-disable-next-line no-undef
  if (typeof liff !== 'undefined') {
    return liff
  }
  // Fall back to mock for development
  return createLiffMock()
}

const initialLiffState = {
  liff: null,
  isLoggedIn: false,
  isReady: false,
  profile: null,
  error: null
}

export const useLiff = (liffId = import.meta.env.VITE_LIFF_ID) => {
  const [state, setState] = useState(initialLiffState)
  const initRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    initRef.current = false

    const initLiff = async () => {
      if (initRef.current) return // Prevent double init
      initRef.current = true

      try {
        const liffInstance = getLiff()
        await liffInstance.init({ liffId })
        
        if (!mountedRef.current) return // Unmounted during init

        const isLoggedIn = liffInstance.isLoggedIn()
        
        let profile = null
        if (isLoggedIn) {
          try {
            profile = await liffInstance.getProfile()
          } catch (e) {
            console.warn('Could not get profile:', e)
          }
        }

        if (mountedRef.current) {
          setState({
            liff: liffInstance,
            isLoggedIn,
            isReady: true,
            profile,
            error: null
          })
        }
      } catch (error) {
        console.error('LIFF init error:', error)
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            isReady: true,
            error: 'ไม่สามารถเริ่มต้น LIFF ได้'
          }))
        }
      }
    }

    initLiff()

    return () => {
      mountedRef.current = false
    }
  }, [liffId])

  const login = useCallback(() => {
    if (state.liff) {
      state.liff.login()
    }
  }, [state.liff])

  const logout = useCallback(() => {
    if (state.liff) {
      state.liff.logout()
    }
  }, [state.liff])

  const close = useCallback(() => {
    if (state.liff) {
      state.liff.closeWindow()
    }
  }, [state.liff])

  const scanCode = useCallback(async () => {
    if (state.liff) {
      try {
        return await state.liff.scanCode()
      } catch (error) {
        console.error('Scan code error:', error)
        throw error
      }
    }
    throw new Error('LIFF not initialized')
  }, [state.liff])

  return {
    ...state,
    login,
    logout,
    close,
    scanCode
  }
}

export default useLiff
