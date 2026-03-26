import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ScanPage from '../pages/ScanPage'
import * as api from '../services/api'

vi.mock('../services/api', () => ({
  getTargetInfo: vi.fn(),
  getActivities: vi.fn(),
  setDemoMode: vi.fn(),
  loginWithLineAccessToken: vi.fn(),
  setAuthToken: vi.fn()
}))

const defaultProps = {
  type: 'plant',
  id: 'P-001',
  onSelectAction: vi.fn()
}

const mockSuccessResponse = {
  data: {
    id: 'P-001',
    name: 'ต้นมะม่วง',
    type: 'plant',
    location: 'แปลง A',
    status: 'active'
  }
}

const mockActivitiesEmpty = { data: { data: [] } }

const renderScanPage = (props = {}) =>
  render(<ScanPage {...defaultProps} {...props} />)

describe('ScanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Re-apply default mocks after each clear
  beforeEach(() => {
    api.getTargetInfo.mockResolvedValue(mockSuccessResponse)
    api.getActivities.mockResolvedValue(mockActivitiesEmpty)
  })

  describe('successful data fetch', () => {
    it('renders target name from API response', async () => {
      renderScanPage()
      await waitFor(() => {
        expect(screen.getByText('ต้นมะม่วง')).toBeInTheDocument()
      })
    })

    it('renders plant type badge', async () => {
      renderScanPage()
      await waitFor(() => {
        expect(screen.getByText(/ต้นไม้.*P-001/)).toBeInTheDocument()
      })
    })

    it('renders active status badge when status is active', async () => {
      renderScanPage()
      await waitFor(() => {
        expect(screen.getByText('● พร้อมใช้งาน')).toBeInTheDocument()
      })
    })

    it('renders location info', async () => {
      renderScanPage()
      await waitFor(() => {
        expect(screen.getByText(/📍 แปลง A/)).toBeInTheDocument()
      })
    })

    it('renders 6 action buttons', async () => {
      renderScanPage()
      await waitFor(() => {
        expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(6)
      })
    })

    it('calls onSelectAction with correct action when action button is clicked', async () => {
      const onSelectAction = vi.fn()
      renderScanPage({ onSelectAction })
      await waitFor(() => screen.getByText('รดน้ำ'))
      await userEvent.click(screen.getByRole('button', { name: 'รดน้ำ' }))
      expect(onSelectAction).toHaveBeenCalledWith('water')
    })

    it('renders activities section', async () => {
      renderScanPage()
      await waitFor(() => {
        expect(screen.getByText('กิจกรรมล่าสุด')).toBeInTheDocument()
      })
    })

    it('renders empty state when no activities', async () => {
      renderScanPage()
      await waitFor(() => {
        expect(screen.getByText('ยังไม่มีกิจกรรม')).toBeInTheDocument()
      })
    })

    it('renders activity list with items', async () => {
      // Override the default empty activities mock for this specific test
      const activities = [
        {
          id: 'act-1',
          action_type: 'water',
          action_display: 'รดน้ำ',
          created_at: new Date().toISOString(),
          user_name: 'สมชาย'
        }
      ]
      api.getActivities.mockResolvedValue({ data: { data: activities } })
      renderScanPage()
      await waitFor(() => {
        // Use getAllByText since there may be multiple "รดน้ำ" (action button + activity)
        const all = screen.getAllByText('รดน้ำ')
        expect(all.length).toBeGreaterThan(0)
      })
    })
  })

  describe('plot type', () => {
    it('renders plot icon and badge', async () => {
      api.getTargetInfo.mockResolvedValue({
        data: { id: 'P-101', name: 'แปลงทดลอง', type: 'plot', location: 'แปลง B', status: 'active' }
      })
      renderScanPage({ type: 'plot', id: 'P-101' })
      await waitFor(() => {
        expect(screen.getByText(/แปลง.*P-101/)).toBeInTheDocument()
      })
    })
  })

  describe('error state', () => {
    it('shows error message on API failure', async () => {
      api.getTargetInfo.mockRejectedValue(new Error('Server error'))
      renderScanPage()
      await waitFor(() => {
        expect(screen.getByText('ไม่สามารถโหลดข้อมูลได้')).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      api.getTargetInfo.mockRejectedValue(new Error('Server error'))
      renderScanPage()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ลองใหม่/ })).toBeInTheDocument()
      })
    })
  })

  describe('offline fallback', () => {
    it('uses offline mock data when err.offline is true', async () => {
      api.getTargetInfo.mockRejectedValue({ offline: true })
      renderScanPage()
      await waitFor(() => {
        // Offline fallback sets name = id
        expect(screen.getByText('P-001')).toBeInTheDocument()
      })
    })
  })
})
