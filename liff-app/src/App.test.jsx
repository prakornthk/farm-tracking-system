import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ── Pre-declare mutable refs so vi.mock factory can access them (no TDZ) ───
let liffHookReturns = {
  liff: null,
  isLoggedIn: false,
  isReady: false,
  profile: null,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  close: vi.fn(),
  scanCode: vi.fn()
}

let offlineHookReturns = {
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  sync: vi.fn()
}

// ── Mocks (hoisted by Vitest) ─────────────────────────────────────────────
vi.mock('./hooks/useLiff', () => ({
  default: () => liffHookReturns
}))

vi.mock('./hooks/useOffline', () => ({
  default: () => offlineHookReturns
}))

vi.mock('./services/api', () => ({
  loginWithLineAccessToken: vi.fn().mockResolvedValue({ data: { token: 'mock-token' } }),
  setDemoMode: vi.fn(),
  setAuthToken: vi.fn()
}))

// Suppress the debug fetch calls that App.js makes to localhost:7352
vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }))

// ── Helpers ────────────────────────────────────────────────────────────────
const renderApp = async () => {
  const { default: App } = await import('./App')
  render(<App />)
}

// Reset hooks to defaults before each test
beforeEach(() => {
  liffHookReturns = {
    liff: null,
    isLoggedIn: false,
    isReady: false,
    profile: null,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    close: vi.fn(),
    scanCode: vi.fn()
  }
  offlineHookReturns = {
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    sync: vi.fn()
  }
  localStorage.clear()
})

// ── Tests ──────────────────────────────────────────────────────────────────
describe('App — loading state', () => {
  it('shows spinner while LIFF is initializing', async () => {
    // Default state is loading (isReady=false)
    await renderApp()
    expect(document.querySelector('.spinner')).toBeInTheDocument()
  })
})

describe('App — login state', () => {
  it('renders LoginPage when isLoggedIn=false and isReady=true', async () => {
    liffHookReturns = { ...liffHookReturns, isReady: true, isLoggedIn: false }
    await renderApp()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /เข้าสู่ระบบด้วย LINE/ })).toBeInTheDocument()
    })
  })

  it('passes liffError to LoginPage when provided', async () => {
    liffHookReturns = {
      ...liffHookReturns,
      isReady: true,
      isLoggedIn: false,
      error: 'ไม่สามารถเริ่มต้น LIFF ได้'
    }
    await renderApp()
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('ไม่สามารถเริ่มต้น LIFF ได้')
    })
  })

  it('calls login when login button is clicked', async () => {
    const loginMock = vi.fn()
    liffHookReturns = { ...liffHookReturns, isReady: true, isLoggedIn: false, login: loginMock }
    await renderApp()
    await waitFor(() => screen.getByRole('button', { name: /เข้าสู่ระบบด้วย LINE/ }))
    await userEvent.click(screen.getByRole('button', { name: /เข้าสู่ระบบด้วย LINE/ }))
    expect(loginMock).toHaveBeenCalled()
  })
})

describe('App — authenticated home view', () => {
  beforeEach(() => {
    liffHookReturns = {
      liff: { getAccessToken: () => 'token', scanCode: vi.fn(), closeWindow: vi.fn() },
      isLoggedIn: true,
      isReady: true,
      profile: { userId: 'U-001', displayName: 'สมชาย', pictureUrl: null },
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      close: vi.fn(),
      scanCode: vi.fn()
    }
  })

  it('shows welcome message with displayName', async () => {
    await renderApp()
    await waitFor(() => {
      expect(screen.getByText(/สวัสดี สมชาย/)).toBeInTheDocument()
    })
  })

  it('shows offline warning banner when isOnline=false', async () => {
    offlineHookReturns = { isOnline: false, isSyncing: false, pendingCount: 0, sync: vi.fn() }
    await renderApp()
    await waitFor(() => {
      expect(screen.getByText(/อยู่ในโหมดออฟไลน์/)).toBeInTheDocument()
    })
  })

  it('shows pending sync count when offline queue has items', async () => {
    offlineHookReturns = { isOnline: true, isSyncing: false, pendingCount: 3, sync: vi.fn() }
    await renderApp()
    await waitFor(() => {
      expect(screen.getByText(/มี 3 รายการรอ sync/)).toBeInTheDocument()
    })
  })

  it('renders scan QR Code button in home view', async () => {
    await renderApp()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /สแกน QR Code/ })).toBeInTheDocument()
    })
  })
})

describe('App — Header navigation', () => {
  beforeEach(() => {
    liffHookReturns = {
      liff: { getAccessToken: () => 'token', scanCode: vi.fn(), closeWindow: vi.fn() },
      isLoggedIn: true,
      isReady: true,
      profile: { userId: 'U-001', displayName: 'สมชาย', pictureUrl: null },
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      close: vi.fn(),
      scanCode: vi.fn()
    }
  })

  it('renders Header with scan and tasks nav buttons', async () => {
    await renderApp()
    await waitFor(() => {
      // Use getAllBy since both header nav and home view scan button may exist
      const scanBtns = screen.getAllByRole('button', { name: /สแกน/ })
      expect(scanBtns.length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByRole('button', { name: /งาน/ }).length).toBeGreaterThanOrEqual(1)
    })
  })
})
