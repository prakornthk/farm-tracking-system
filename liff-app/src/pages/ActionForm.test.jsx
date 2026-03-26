import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ActionForm from '../pages/ActionForm'
import * as api from '../services/api'

vi.mock('../services/api', () => ({
  logActivity: vi.fn(),
  addToOfflineQueue: vi.fn(),
  setDemoMode: vi.fn(),
  loginWithLineAccessToken: vi.fn(),
  setAuthToken: vi.fn()
}))

const defaultProps = {
  type: 'plant',
  id: 'P-001',
  action: 'water',
  onBack: vi.fn(),
  onSuccess: vi.fn(),
  isOnline: true
}

const renderActionForm = (props = {}) =>
  render(<ActionForm {...defaultProps} {...props} />)

describe('ActionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('renders correctly', () => {
    it('renders back button', () => {
      renderActionForm()
      expect(screen.getByRole('button', { name: /กลับ/ })).toBeInTheDocument()
    })

    it('renders action icon and label in header', () => {
      renderActionForm({ action: 'water' })
      expect(screen.getByText('รดน้ำ')).toBeInTheDocument()
    })

    it('renders type badge with correct type and id', () => {
      renderActionForm({ type: 'plant', id: 'P-001' })
      expect(screen.getByText(/🌱 ต้นไม้.*P-001/)).toBeInTheDocument()
    })

    it('renders textarea for notes', () => {
      renderActionForm()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders submit and cancel buttons', () => {
      renderActionForm()
      expect(screen.getByRole('button', { name: /บันทึก/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ยกเลิก/ })).toBeInTheDocument()
    })

    it('shows character counter starting at 0/500', () => {
      renderActionForm()
      expect(screen.getByText('0/500')).toBeInTheDocument()
    })

    it('does not show PhotoUpload for non-report actions', () => {
      renderActionForm({ action: 'water' })
      expect(screen.queryByLabelText(/อัพโหลดรูป/)).not.toBeInTheDocument()
    })

    it('shows PhotoUpload when action is report', () => {
      renderActionForm({ action: 'report' })
      expect(screen.getByLabelText(/อัพโหลดรูป/)).toBeInTheDocument()
    })
  })

  describe('notes textarea', () => {
    it('updates notes value on change', async () => {
      renderActionForm()
      const textarea = screen.getByRole('textbox')
      await userEvent.type(textarea, 'ทดสอบการรดน้ำ')
      expect(textarea).toHaveValue('ทดสอบการรดน้ำ')
    })

    it('updates character counter as user types', async () => {
      renderActionForm()
      const textarea = screen.getByRole('textbox')
      await userEvent.type(textarea, 'ABC')
      expect(screen.getByText('3/500')).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('calls logActivity with correct data on submit', async () => {
      vi.mocked(api.logActivity).mockResolvedValue({ data: {} })
      renderActionForm({ action: 'water', type: 'plant', id: 'P-001' })
      await userEvent.type(screen.getByRole('textbox'), 'รดน้ำเช้า')
      await userEvent.click(screen.getByRole('button', { name: /บันทึก/ }))
      await waitFor(() => {
        expect(api.logActivity).toHaveBeenCalledOnce()
        const formData = vi.mocked(api.logActivity).mock.calls[0][0]
        expect(formData.get('activitable_type')).toBe('App\\Models\\Plant')
        expect(formData.get('activitable_id')).toBe('P-001')
        expect(formData.get('type')).toBe('water')
        expect(formData.get('notes')).toBe('รดน้ำเช้า')
      })
    })

    it('calls onSuccess after successful submission', async () => {
      vi.mocked(api.logActivity).mockResolvedValue({ data: {} })
      const onSuccess = vi.fn()
      renderActionForm({ onSuccess })
      await userEvent.click(screen.getByRole('button', { name: /บันทึก/ }))
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows loading text while submitting', async () => {
      vi.mocked(api.logActivity).mockImplementation(
        () => new Promise(() => {})
      )
      renderActionForm()
      await userEvent.click(screen.getByRole('button', { name: /บันทึก/ }))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /กำลังบันทึก/ })).toBeInTheDocument()
      })
    })

    it('disables buttons while loading', async () => {
      vi.mocked(api.logActivity).mockImplementation(
        () => new Promise(() => {})
      )
      renderActionForm()
      await userEvent.click(screen.getByRole('button', { name: /บันทึก/ }))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /บันทึก/ })).toBeDisabled()
      })
    })
  })

  describe('offline submission', () => {
    it('queues to offline storage when isOnline is false', async () => {
      vi.mocked(api.addToOfflineQueue).mockResolvedValue(undefined)
      renderActionForm({ isOnline: false })
      await userEvent.click(screen.getByRole('button', { name: /บันทึก/ }))
      await waitFor(() => {
        expect(api.addToOfflineQueue).toHaveBeenCalledWith('activity', expect.any(Object))
      })
    })

    it('calls onSuccess after offline queue', async () => {
      vi.mocked(api.addToOfflineQueue).mockResolvedValue(undefined)
      const onSuccess = vi.fn()
      renderActionForm({ isOnline: false, onSuccess })
      await userEvent.click(screen.getByRole('button', { name: /บันทึก/ }))
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('shows error when API call fails', async () => {
      vi.mocked(api.logActivity).mockRejectedValue(new Error('Network error'))
      renderActionForm()
      await userEvent.click(screen.getByRole('button', { name: /บันทึก/ }))
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('ไม่สามารถบันทึกได้ กรุณาลองใหม่')
      })
    })

    it('falls back to offline queue when error has offline flag', async () => {
      vi.mocked(api.addToOfflineQueue).mockResolvedValue(undefined)
      vi.mocked(api.logActivity).mockRejectedValue({ offline: true })
      const onSuccess = vi.fn()
      renderActionForm({ onSuccess })
      await userEvent.click(screen.getByRole('button', { name: /บันทึก/ }))
      await waitFor(() => {
        expect(api.addToOfflineQueue).toHaveBeenCalled()
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('back button', () => {
    it('calls onBack when back button is clicked', async () => {
      const onBack = vi.fn()
      renderActionForm({ onBack })
      await userEvent.click(screen.getByRole('button', { name: /กลับ/ }))
      expect(onBack).toHaveBeenCalled()
    })
  })
})
