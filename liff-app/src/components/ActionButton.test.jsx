import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ActionButton from '../components/ActionButton'
import { ACTION_CONFIG } from '../components/ActionButton'

const defaultProps = {
  action: 'water',
  onClick: vi.fn()
}

const renderActionButton = (props = {}) =>
  render(<ActionButton {...defaultProps} {...props} />)

describe('ActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['water',     '💧', 'รดน้ำ'],
    ['fertilize', '🌿', 'ใส่ปุ๋ย'],
    ['prune',     '✂️', 'ตัดแต่ง'],
    ['inspect',   '🔍', 'ตรวจสอบ'],
    ['harvest',   '🍎', 'เก็บเกี่ยว'],
    ['report',    '⚠️', 'แจ้งปัญหา']
  ])('renders %s action with correct icon and label', (action, icon, label) => {
    renderActionButton({ action })
    expect(screen.getByText(icon)).toBeInTheDocument()
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('renders unknown action with fallback icon', () => {
    renderActionButton({ action: 'unknown-action' })
    expect(screen.getByText('❓')).toBeInTheDocument()
  })

  it('calls onClick with action when clicked', async () => {
    const onClick = vi.fn()
    renderActionButton({ action: 'water', onClick })
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledWith('water')
  })

  it('has aria-label with the action label', () => {
    renderActionButton({ action: 'water' })
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'รดน้ำ')
  })

  it('report action gets report modifier class', () => {
    renderActionButton({ action: 'report' })
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('report')
  })

  it('has type=button to prevent form submission', () => {
    renderActionButton({ action: 'water' })
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})

describe('ACTION_CONFIG', () => {
  it('exports config for all 6 action types', () => {
    expect(ACTION_CONFIG).toHaveProperty('water')
    expect(ACTION_CONFIG).toHaveProperty('fertilize')
    expect(ACTION_CONFIG).toHaveProperty('prune')
    expect(ACTION_CONFIG).toHaveProperty('inspect')
    expect(ACTION_CONFIG).toHaveProperty('harvest')
    expect(ACTION_CONFIG).toHaveProperty('report')
  })

  it('each config has icon and label', () => {
    Object.entries(ACTION_CONFIG).forEach(([key, config]) => {
      expect(config).toHaveProperty('icon')
      expect(config).toHaveProperty('label')
      expect(config.icon.length).toBeGreaterThan(0)
      expect(config.label.length).toBeGreaterThan(0)
    })
  })
})
