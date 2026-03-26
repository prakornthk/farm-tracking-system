import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ActivityItem from '../components/ActivityItem'

const defaultProps = {
  activity: {
    id: 'act-1',
    action_type: 'water',
    action_display: 'รดน้ำ',
    created_at: new Date().toISOString(),
    user_name: 'สมชาย',
    notes: null
  }
}

const renderActivityItem = (props = {}) =>
  render(<ActivityItem {...defaultProps} {...props} />)

describe('ActivityItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('renders activity data', () => {
    it('renders action display text', () => {
      renderActivityItem()
      expect(screen.getByText('รดน้ำ')).toBeInTheDocument()
    })

    it('renders user name when provided', () => {
      renderActivityItem()
      expect(screen.getByText('สมชาย')).toBeInTheDocument()
    })

    it('renders notes when provided', () => {
      renderActivityItem({
        activity: { ...defaultProps.activity, notes: 'รดน้ำเช้าวันจันทร์' }
      })
      expect(screen.getByText('รดน้ำเช้าวันจันทร์')).toBeInTheDocument()
    })

    it('does not render notes section when notes is null', () => {
      renderActivityItem({
        activity: { ...defaultProps.activity, notes: null }
      })
      const textContent = screen.getByRole('listitem').textContent
      expect(textContent).not.toContain('รดน้ำเช้า')
    })
  })

  describe('date formatting', () => {
    it('shows "เพิ่งทำ" for very recent activities', () => {
      renderActivityItem({
        activity: { ...defaultProps.activity, created_at: new Date().toISOString() }
      })
      expect(screen.getByText('เพิ่งทำ')).toBeInTheDocument()
    })

    it('shows minutes ago for recent activities', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      renderActivityItem({ activity: { ...defaultProps.activity, created_at: fiveMinsAgo } })
      expect(screen.getByText('5 นาทีที่แล้ว')).toBeInTheDocument()
    })

    it('shows hours ago for same-day activities', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      renderActivityItem({ activity: { ...defaultProps.activity, created_at: twoHoursAgo } })
      expect(screen.getByText('2 ชั่วโมงที่แล้ว')).toBeInTheDocument()
    })

    it('shows days ago for recent week', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      renderActivityItem({ activity: { ...defaultProps.activity, created_at: threeDaysAgo } })
      expect(screen.getByText('3 วันที่แล้ว')).toBeInTheDocument()
    })
  })

  describe('icon and color mapping', () => {
    it.each([
      ['water',     '💧'],
      ['fertilize', '🌿'],
      ['prune',     '✂️'],
      ['inspect',   '🔍'],
      ['harvest',   '🍎'],
      ['report',    '⚠️'],
      ['plant',     '🌱'],
      ['create',    '➕']
    ])('renders %s icon as %s', (actionType, expectedIcon) => {
      renderActivityItem({ activity: { ...defaultProps.activity, action_type: actionType } })
      expect(screen.getByText(expectedIcon)).toBeInTheDocument()
    })

    it('falls back to 📝 for unknown action type', () => {
      renderActivityItem({ activity: { ...defaultProps.activity, action_type: 'unknown' } })
      expect(screen.getByText('📝')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has role=listitem', () => {
      renderActivityItem()
      expect(screen.getByRole('listitem')).toBeInTheDocument()
    })

    it('has aria-label attribute with action label on the activity div', () => {
      renderActivityItem()
      // The aria-label is on the div with class "activity-item"
      const activityDiv = document.querySelector('.activity-item')
      expect(activityDiv).toHaveAttribute('aria-label', 'การดำเนินการ: รดน้ำ')
    })
  })
})
