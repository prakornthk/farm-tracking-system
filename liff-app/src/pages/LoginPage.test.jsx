import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../pages/LoginPage'

const renderLoginPage = (props = {}) => {
  const defaults = { onLogin: vi.fn(), error: null }
  return render(<LoginPage {...defaults} {...props} />)
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders app title and description', () => {
    renderLoginPage()
    expect(screen.getByText('Farm Tracking')).toBeInTheDocument()
    expect(screen.getByText('ระบบติดตามและบันทึกกิจกรรมในไร่')).toBeInTheDocument()
  })

  it('renders LINE login button', () => {
    renderLoginPage()
    const btn = screen.getByRole('button', { name: /เข้าสู่ระบบด้วย LINE/i })
    expect(btn).toBeInTheDocument()
  })

  it('calls onLogin when login button is clicked', async () => {
    const onLogin = vi.fn()
    renderLoginPage({ onLogin })
    await userEvent.click(screen.getByRole('button', { name: /เข้าสู่ระบบด้วย LINE/i }))
    expect(onLogin).toHaveBeenCalledOnce()
  })

  it('shows error message when error prop is provided', () => {
    renderLoginPage({ error: 'ไม่สามารถเข้าสู่ระบบได้' })
    expect(screen.getByRole('alert')).toHaveTextContent('ไม่สามารถเข้าสู่ระบบได้')
  })

  it('does not render error when error prop is null', () => {
    renderLoginPage({ error: null })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('has correct aria-label on login button', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: /เข้าสู่ระบบด้วย LINE/i })).toHaveAttribute(
      'aria-label',
      'เข้าสู่ระบบด้วย LINE'
    )
  })

  it('shows privacy note text', () => {
    renderLoginPage()
    expect(screen.getByText(/กรุณาเข้าสู่ระบบเพื่อใช้งาน/)).toBeInTheDocument()
  })
})
