import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ProblemReport from '../pages/ProblemReport'
import * as api from '../services/api'

vi.mock('../services/api', () => ({
  submitProblemReport: vi.fn(),
  addToOfflineQueue: vi.fn(),
  setDemoMode: vi.fn(),
  loginWithLineAccessToken: vi.fn(),
  setAuthToken: vi.fn()
}))

const defaultProps = {
  type: 'plant',
  id: 'P-001',
  onBack: vi.fn(),
  onSuccess: vi.fn(),
  isOnline: true
}

const renderProblemReport = (props = {}) =>
  render(<ProblemReport {...defaultProps} {...props} />)

describe('ProblemReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('renders correctly', () => {
    it('renders warning icon and title', () => {
      renderProblemReport()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('แจ้งปัญหา')).toBeInTheDocument()
    })

    it('renders back button', () => {
      renderProblemReport()
      expect(screen.getByRole('button', { name: /กลับ/ })).toBeInTheDocument()
    })

    it('renders type badge', () => {
      renderProblemReport({ type: 'plant', id: 'P-001' })
      expect(screen.getByText(/🌱 ต้นไม้.*P-001/)).toBeInTheDocument()
    })

    it('renders problem type select dropdown', () => {
      renderProblemReport()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders all 6 problem type options', () => {
      renderProblemReport()
      const select = screen.getByRole('combobox')
      const options = Array.from(select.querySelectorAll('option'))
      expect(options.length).toBe(7) // 1 empty + 6 types
    })

    it('renders description textarea', () => {
      renderProblemReport()
      const textareas = screen.getAllByRole('textbox')
      expect(textareas.length).toBeGreaterThan(0)
    })

    it('renders description character counter starting at 0/1000', () => {
      renderProblemReport()
      expect(screen.getByText('0/1000')).toBeInTheDocument()
    })

    it('renders PhotoUpload component', () => {
      renderProblemReport()
      expect(screen.getByLabelText(/อัพโหลดรูป/)).toBeInTheDocument()
    })

    it('renders submit and cancel buttons', () => {
      renderProblemReport()
      expect(screen.getByRole('button', { name: /ส่งรายงานปัญหา/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ยกเลิก/ })).toBeInTheDocument()
    })
  })

  describe('severity selector', () => {
    it('renders three severity buttons', () => {
      renderProblemReport()
      const buttons = screen.getAllByRole('button', { name: /ต่ำ|ปานกลาง|สูง/ })
      expect(buttons.length).toBe(3)
    })

    it('defaults to medium severity', () => {
      renderProblemReport()
      const mediumBtn = screen.getByRole('button', { name: /ปานกลาง/ })
      expect(mediumBtn).toHaveAttribute('aria-pressed', 'true')
    })

    it('changes severity when different button is clicked', async () => {
      renderProblemReport()
      await userEvent.click(screen.getByRole('button', { name: /สูง/ }))
      const highBtn = screen.getByRole('button', { name: /สูง/ })
      expect(highBtn).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('form validation', () => {
    it('shows error when submitting without problem type', async () => {
      vi.mocked(api.submitProblemReport).mockResolvedValue({ data: {} })
      renderProblemReport()
      await userEvent.click(screen.getByRole('button', { name: /ส่งรายงานปัญหา/ }))
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('กรุณาเลือกประเภทปัญหา')
      })
    })

    it('shows error when submitting without description', async () => {
      vi.mocked(api.submitProblemReport).mockResolvedValue({ data: {} })
      renderProblemReport()
      // Select a problem type
      await userEvent.selectOptions(screen.getByRole('combobox'), 'pest')
      await userEvent.click(screen.getByRole('button', { name: /ส่งรายงานปัญหา/ }))
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('กรุณาอธิบายปัญหา')
      })
    })
  })

  describe('successful submission', () => {
    beforeEach(() => {
      vi.mocked(api.submitProblemReport).mockResolvedValue({ data: {} })
    })

    it('calls submitProblemReport with correct data', async () => {
      renderProblemReport({ type: 'plant', id: 'P-001' })
      await userEvent.selectOptions(screen.getByRole('combobox'), 'pest')
      await userEvent.type(screen.getByLabelText(/อธิบายปัญหา/), 'พบหนอนกินใบ')
      await userEvent.click(screen.getByRole('button', { name: /ส่งรายงานปัญหา/ }))
      await waitFor(() => {
        expect(api.submitProblemReport).toHaveBeenCalledOnce()
        const formData = vi.mocked(api.submitProblemReport).mock.calls[0][0]
        expect(formData.get('plant_id')).toBe('P-001')
        expect(formData.get('problem_type')).toBe('pest')
        expect(formData.get('severity')).toBe('medium')
        expect(formData.get('description')).toBe('พบหนอนกินใบ')
      })
    })

    it('calls onSuccess after successful submission', async () => {
      const onSuccess = vi.fn()
      renderProblemReport({ onSuccess })
      await userEvent.selectOptions(screen.getByRole('combobox'), 'pest')
      await userEvent.type(screen.getByLabelText(/อธิบายปัญหา/), 'พบหนอนกินใบ')
      await userEvent.click(screen.getByRole('button', { name: /ส่งรายงานปัญหา/ }))
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows loading text while submitting', async () => {
      vi.mocked(api.submitProblemReport).mockImplementation(() => new Promise(() => {}))
      renderProblemReport()
      await userEvent.selectOptions(screen.getByRole('combobox'), 'pest')
      await userEvent.type(screen.getByLabelText(/อธิบายปัญหา/), 'ทดสอบ')
      await userEvent.click(screen.getByRole('button', { name: /ส่งรายงานปัญหา/ }))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /กำลังส่ง/ })).toBeInTheDocument()
      })
    })
  })

  describe('offline submission', () => {
    it('queues to offline storage when isOnline is false', async () => {
      vi.mocked(api.addToOfflineQueue).mockResolvedValue(undefined)
      renderProblemReport({ isOnline: false })
      await userEvent.selectOptions(screen.getByRole('combobox'), 'disease')
      await userEvent.type(screen.getByLabelText(/อธิบายปัญหา/), 'โรคใบจุด')
      await userEvent.click(screen.getByRole('button', { name: /ส่งรายงานปัญหา/ }))
      await waitFor(() => {
        expect(api.addToOfflineQueue).toHaveBeenCalledWith('problem', expect.any(Object))
      })
    })

    it('calls onSuccess after offline queue', async () => {
      vi.mocked(api.addToOfflineQueue).mockResolvedValue(undefined)
      const onSuccess = vi.fn()
      renderProblemReport({ isOnline: false, onSuccess })
      await userEvent.selectOptions(screen.getByRole('combobox'), 'disease')
      await userEvent.type(screen.getByLabelText(/อธิบายปัญหา/), 'โรคใบจุด')
      await userEvent.click(screen.getByRole('button', { name: /ส่งรายงานปัญหา/ }))
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('shows error when API call fails', async () => {
      vi.mocked(api.submitProblemReport).mockRejectedValue(new Error('Network error'))
      renderProblemReport()
      await userEvent.selectOptions(screen.getByRole('combobox'), 'pest')
      await userEvent.type(screen.getByLabelText(/อธิบายปัญหา/), 'ทดสอบ')
      await userEvent.click(screen.getByRole('button', { name: /ส่งรายงานปัญหา/ }))
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('ไม่สามารถส่งรายงานได้ กรุณาลองใหม่')
      })
    })

    it('falls back to offline queue when error has offline flag', async () => {
      vi.mocked(api.addToOfflineQueue).mockResolvedValue(undefined)
      vi.mocked(api.submitProblemReport).mockRejectedValue({ offline: true })
      const onSuccess = vi.fn()
      renderProblemReport({ onSuccess })
      await userEvent.selectOptions(screen.getByRole('combobox'), 'pest')
      await userEvent.type(screen.getByLabelText(/อธิบายปัญหา/), 'ทดสอบ')
      await userEvent.click(screen.getByRole('button', { name: /ส่งรายงานปัญหา/ }))
      await waitFor(() => {
        expect(api.addToOfflineQueue).toHaveBeenCalled()
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('back button', () => {
    it('calls onBack when back button is clicked', async () => {
      const onBack = vi.fn()
      renderProblemReport({ onBack })
      await userEvent.click(screen.getByRole('button', { name: /กลับ/ }))
      expect(onBack).toHaveBeenCalled()
    })
  })
})
