import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import React from 'react'
import useLiff from '../hooks/useLiff'

// ── Mock liffMock service ──────────────────────────────────────
vi.mock('../services/liffMock', () => ({
  createLiffMock: vi.fn()
}))

// ── Helper: create a configurable mock LIFF instance ───────────
const makeMockLiff = (overrides = {}) => ({
  init:         vi.fn().mockResolvedValue(undefined),
  isLoggedIn:   vi.fn().mockReturnValue(false),
  login:        vi.fn(),
  logout:       vi.fn(),
  closeWindow:  vi.fn(),
  getProfile:   vi.fn().mockResolvedValue({
    userId: 'U-001',
    displayName: 'สมชาย',
    pictureUrl: null
  }),
  scanCode:     vi.fn().mockResolvedValue({ value: 'scan/plant/P-001' }),
  ...overrides
})

// Module-level reference so tests can inspect mocks
let currentMockLiff = null

describe('useLiff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentMockLiff = null
    // Each test re-mocks createLiffMock in the test body
  })

  afterEach(() => {
    // Verify no unexpected calls on logout (cross-test pollution check)
    if (currentMockLiff) {
      // Reset logout spy so it doesn't affect next test
      currentMockLiff.logout.mockClear()
    }
  })

  // ── Initial state ────────────────────────────────────────────────

  it('initial state: isReady=false while initializing', async () => {
    const mockLiff = makeMockLiff({
      init: vi.fn(() => new Promise(() => {})) // hangs
    })
    const { liffMockModule } = await import('../services/liffMock')
    liffMockModule.createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    expect(result.current.isReady).toBe(false)
    expect(result.current.isLoggedIn).toBe(false)
    expect(result.current.profile).toBeNull()
    expect(result.current.error).toBeNull()
  })

  // ── Successful init ─────────────────────────────────────────────

  it('sets isReady=true after successful init', async () => {
    const mockLiff = makeMockLiff()
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    await waitFor(() => expect(result.current.isReady).toBe(true))
  })

  it('sets isLoggedIn=true when user is already logged in', async () => {
    const mockLiff = makeMockLiff({ isLoggedIn: vi.fn().mockReturnValue(true) })
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    await waitFor(() => expect(result.current.isLoggedIn).toBe(true))
  })

  it('fetches and stores profile when logged in', async () => {
    const mockLiff = makeMockLiff({ isLoggedIn: vi.fn().mockReturnValue(true) })
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    await waitFor(() => {
      expect(result.current.profile).not.toBeNull()
      expect(result.current.profile?.displayName).toBe('สมชาย')
    })
  })

  it('skips profile fetch and sets profile=null when getProfile throws', async () => {
    const mockLiff = makeMockLiff({
      isLoggedIn: vi.fn().mockReturnValue(true),
      getProfile: vi.fn().mockRejectedValue(new Error('Profile error'))
    })
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
      expect(result.current.profile).toBeNull()
    })
  })

  // ── Init error ──────────────────────────────────────────────────

  it('sets error message when init fails', async () => {
    const mockLiff = makeMockLiff({
      init: vi.fn().mockRejectedValue(new Error('Init failed'))
    })
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.isReady).toBe(true)
    })
  })

  // ── login / logout / close ──────────────────────────────────────

  it('login() calls liff.login()', async () => {
    const mockLiff = makeMockLiff()
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    await waitFor(() => result.current.isReady)

    await act(async () => { result.current.login() })
    expect(mockLiff.login).toHaveBeenCalled()
    // Reset so next test doesn't see this call
    mockLiff.login.mockClear()
  })

  it('logout() calls liff.logout()', async () => {
    const mockLiff = makeMockLiff()
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    await waitFor(() => result.current.isReady)

    await act(async () => { result.current.logout() })
    expect(mockLiff.logout).toHaveBeenCalled()
    mockLiff.logout.mockClear()
  })

  it('close() calls liff.closeWindow()', async () => {
    const mockLiff = makeMockLiff()
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    await waitFor(() => result.current.isReady)

    await act(async () => { result.current.close() })
    expect(mockLiff.closeWindow).toHaveBeenCalled()
  })

  // ── scanCode ─────────────────────────────────────────────────────

  it('scanCode() returns result from liff.scanCode()', async () => {
    const mockLiff = makeMockLiff()
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    await waitFor(() => result.current.isReady)

    let scanResult
    await act(async () => {
      scanResult = await result.current.scanCode()
    })
    expect(mockLiff.scanCode).toHaveBeenCalled()
    expect(scanResult).toEqual({ value: 'scan/plant/P-001' })
  })

  it('scanCode() throws if liff.scanCode() throws', async () => {
    const mockLiff = makeMockLiff({
      scanCode: vi.fn().mockRejectedValue(new Error('Scan cancelled'))
    })
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    const { result } = renderHook(() => useLiff())
    await waitFor(() => result.current.isReady)

    await expect(result.current.scanCode()).rejects.toThrow('Scan cancelled')
  })

  // ── liffId parameter ────────────────────────────────────────────

  it('passes custom liffId to init()', async () => {
    let capturedLiffId
    const mockLiff = makeMockLiff({
      init: vi.fn(({ liffId }) => {
        capturedLiffId = liffId
        return Promise.resolve()
      })
    })
    const { createLiffMock } = await import('../services/liffMock')
    createLiffMock.mockReturnValue(mockLiff)
    currentMockLiff = mockLiff

    renderHook(() => useLiff('my-custom-liff-id'))
    await waitFor(() => expect(capturedLiffId).toBe('my-custom-liff-id'))
  })
})
