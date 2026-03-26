import { useState, useEffect, useCallback } from 'react'
import liffMock from '../services/liffMock'

// Use mock LIFF for development
// In production with @line/liff-2 installed, replace with:
// import liff from '@line/liff-2'
const liff = liffMock

const initialLiffState = {
  liff: null,
  isLoggedIn: false,
  isReady: false,
  profile: null,
  error: null
}

export const useLiff = (liffId = import.meta.env.VITE_LIFF_ID) => {
  const [state, setState] = useState(initialLiffState)

  useEffect(() => {
    let mounted = true

    const initLiff = async () => {
      try {
        // Initialize LIFF
        await liff.init({ liffId })
        
        if (!mounted) return

        const isLoggedIn = liff.isLoggedIn()
        
        let profile = null
        if (isLoggedIn) {
          try {
            profile = await liff.getProfile()
          } catch (e) {
            console.warn('Could not get profile:', e)
          }
        }

        setState({
          liff,
          isLoggedIn,
          isReady: true,
          profile,
          error: null
        })
      } catch (error) {
        console.error('LIFF init error:', error)
        if (mounted) {
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
      mounted = false
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
