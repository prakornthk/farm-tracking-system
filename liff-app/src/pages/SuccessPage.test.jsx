import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import SuccessPage from '../pages/SuccessPage'

const defaultProps = {
  onNextScan: vi.fn(),
  onClose: vi.fn()
}

const renderSuccessPage = (props = {}) =>
  render(<SuccessPage {...defaultProps} {...props} />)

describe('SuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders success icon', () => {
    renderSuccessPage()
    expect(screen.getByText('✅')).toBeInTheDocument()
  })

  it('renders success title', () => {
    renderSuccessPage()
    expect(screen.getByText('บันทึกสำเร็จ!')).toBeInTheDocument()
  })

  it('renders success message', () => {
    renderSuccessPage()
    expect(screen.getByText('ข้อมูลถูกบันทึกเรียบร้อยแล้ว')).toBeInTheDocument()
  })

  it('renders next scan button', () => {
    renderSuccessPage()
    expect(screen.getByRole('button', { name: /สแกนต่อ/ })).toBeInTheDocument()
  })

  it('renders close button', () => {
    renderSuccessPage()
    expect(screen.getByRole('button', { name: /ปิด/ })).toBeInTheDocument()
  })

  it('calls onNextScan when scan button is clicked', async () => {
    const onNextScan = vi.fn()
    renderSuccessPage({ onNextScan })
    await userEvent.click(screen.getByRole('button', { name: /สแกนต่อ/ }))
    expect(onNextScan).toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    renderSuccessPage({ onClose })
    await userEvent.click(screen.getByRole('button', { name: /ปิด/ }))
    expect(onClose).toHaveBeenCalled()
  })

  it('has role=status for screen reader announcements', () => {
    renderSuccessPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has aria-live=polite', () => {
    renderSuccessPage()
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('has aria-atomic=true', () => {
    renderSuccessPage()
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true')
  })
})
