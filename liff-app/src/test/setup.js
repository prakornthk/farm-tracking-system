import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ── Mock window.matchMedia ──────────────────────────────────────
// jsdom does not implement matchMedia; stub it to return { matches: false }
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// ── Mock IntersectionObserver ──────────────────────────────────
// Needed by some components that use scroll-based visibility
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
window.IntersectionObserver = MockIntersectionObserver

// ── Mock URL.createObjectURL / revokeObjectURL ─────────────────
// Avoid real Blob URL leaks in tests
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
})

// ── Mock navigator.onLine ──────────────────────────────────────
const originalNavigator = { ...navigator }

beforeEach(() => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
  })
})

afterEach(() => {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: originalNavigator.onLine
  })
})

// ── Mock localStorage ───────────────────────────────────────────
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn(key => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = value }),
    removeItem: vi.fn(key => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length }
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// ── Mock indexedDB ──────────────────────────────────────────────
// Simplified mock for the photo blob storage used by offline queue
const indexedDBMock = {
  _stores: {},
  open: vi.fn(() => Promise.resolve({
    objectStoreNames: { contains: vi.fn(name => !!indexedDBMock._stores[name]) },
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null
  }))
}
Object.defineProperty(window, 'indexedDB', { value: indexedDBMock })
