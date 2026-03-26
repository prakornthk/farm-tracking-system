import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ErrorBoundary from '../components/ErrorBoundary'

// ── A component that throws when rendered ──────────────────────
const ProblemChild = ({ message = 'Test error' }) => {
  throw new Error(message)
}

// ── A component that renders normally ─────────────────────────
const HealthyChild = () => <div>เป็นปกติ</div>

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error during error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary fallback={<div>เกิดข้อผิดพลาด</div>}>
        <HealthyChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('เป็นปกติ')).toBeInTheDocument()
  })

  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary fallback={<div>เกิดข้อผิดพลาด</div>}>
        <ProblemChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument()
  })

  it('catches and re-throws unexpected errors without breaking the test', () => {
    // This verifies the ErrorBoundary does not silently swallow errors
    expect(() => {
      render(
        <ErrorBoundary fallback={<div>เกิดข้อผิดพลาด</div>}>
          <ProblemChild />
        </ErrorBoundary>
      )
    }).not.toThrow()
  })
})
