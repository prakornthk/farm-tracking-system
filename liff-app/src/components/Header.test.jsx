import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import Header from '../components/Header'

const defaultProps = {
  title: 'Farm Tracking',
  currentView: 'scan',
  onViewChange: vi.fn()
}

const renderHeader = (props = {}) =>
  render(<Header {...defaultProps} {...props} />)

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title', () => {
    renderHeader()
    expect(screen.getByRole('heading', { name: 'Farm Tracking' })).toBeInTheDocument()
  })

  it('renders custom title', () => {
    renderHeader({ title: 'My Farm' })
    expect(screen.getByRole('heading', { name: 'My Farm' })).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    renderHeader({ subtitle: 'แปลง A' })
    expect(screen.getByText('แปลง A')).toBeInTheDocument()
  })

  it('renders scan and tasks nav buttons', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /สแกน/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /งาน/ })).toBeInTheDocument()
  })

  it('scan button has active class when currentView=scan', () => {
    renderHeader({ currentView: 'scan' })
    const scanBtn = screen.getByRole('button', { name: /สแกน/ })
    expect(scanBtn.className).toContain('active')
    expect(scanBtn).toHaveAttribute('aria-current', 'page')
  })

  it('tasks button has active class when currentView=tasks', () => {
    renderHeader({ currentView: 'tasks' })
    const tasksBtn = screen.getByRole('button', { name: /งาน/ })
    expect(tasksBtn.className).toContain('active')
    expect(tasksBtn).toHaveAttribute('aria-current', 'page')
  })

  it('calls onViewChange with scan when scan button clicked', async () => {
    const onViewChange = vi.fn()
    renderHeader({ onViewChange })
    await userEvent.click(screen.getByRole('button', { name: /สแกน/ }))
    expect(onViewChange).toHaveBeenCalledWith('scan')
  })

  it('calls onViewChange with tasks when tasks button clicked', async () => {
    const onViewChange = vi.fn()
    renderHeader({ currentView: 'scan', onViewChange })
    await userEvent.click(screen.getByRole('button', { name: /งาน/ }))
    expect(onViewChange).toHaveBeenCalledWith('tasks')
  })

  it('renders logo emoji', () => {
    renderHeader()
    expect(screen.getByText('🌱')).toBeInTheDocument()
  })

  it('nav has accessible label', () => {
    renderHeader()
    expect(screen.getByRole('navigation', { name: /เมนูหลัก/ })).toBeInTheDocument()
  })
})
