import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import PhotoUpload from '../components/PhotoUpload'

const defaultProps = {
  onPhotoSelected: vi.fn(),
  photoPreview: null,
  onRemove: vi.fn()
}

const renderPhotoUpload = (props = {}) =>
  render(<PhotoUpload {...defaultProps} {...props} />)

describe('PhotoUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('upload state (no photo selected)', () => {
    it('renders upload prompt', () => {
      renderPhotoUpload()
      expect(screen.getByText(/แตะเพื่อถ่ายรูปหรือเลือกรูปภาพ/)).toBeInTheDocument()
    })

    it('renders supported formats hint', () => {
      renderPhotoUpload()
      expect(screen.getByText(/รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB/)).toBeInTheDocument()
    })

    it('renders camera icon', () => {
      renderPhotoUpload()
      expect(screen.getByText('📷')).toBeInTheDocument()
    })

    it('has role=button with accessible label', () => {
      renderPhotoUpload()
      expect(screen.getByRole('button', { name: /อัพโหลดรูป/ })).toBeInTheDocument()
    })

    it('is focusable via keyboard', () => {
      renderPhotoUpload()
      const uploadEl = screen.getByRole('button', { name: /อัพโหลดรูป/ })
      uploadEl.focus()
      expect(uploadEl).toHaveFocus()
    })

    it('calls onPhotoSelected when file input changes with valid image', async () => {
      const onPhotoSelected = vi.fn()
      renderPhotoUpload({ onPhotoSelected })
      const file = new File(['fake-image'], 'test.jpg', { type: 'image/jpeg' })
      const input = document.querySelector('input[type="file"]')
      await userEvent.upload(input, file)
      expect(onPhotoSelected).toHaveBeenCalledWith(file)
    })

    it('alerts when file exceeds 5MB', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      renderPhotoUpload()
      const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
      const input = document.querySelector('input[type="file"]')
      await userEvent.upload(input, bigFile)
      expect(alertSpy).toHaveBeenCalledWith('ไฟล์มีขนาดใหญ่เกิน 5MB')
      alertSpy.mockRestore()
    })

    it('alerts when file type does not start with image/', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      renderPhotoUpload()
      // Create a file with non-image type - use plain Blob to avoid type issues
      const nonImageFile = new File(['hello world'], 'readme.txt', { type: 'text/plain' })
      const input = document.querySelector('input[type="file"]')
      // Directly dispatch a change event with the fake file
      const changeEvent = new Event('change', { bubbles: true })
      Object.defineProperty(changeEvent, 'target', { value: { files: [nonImageFile] } })
      input.dispatchEvent(changeEvent)
      expect(alertSpy).toHaveBeenCalledWith('กรุณาเลือกไฟล์รูปภาพ')
      alertSpy.mockRestore()
    })

    it('accepts environment capture attribute on file input', () => {
      renderPhotoUpload()
      const input = document.querySelector('input[type="file"]')
      expect(input).toHaveAttribute('capture', 'environment')
    })
  })

  describe('preview state (photo selected)', () => {
    it('renders preview image when photoPreview is provided', () => {
      renderPhotoUpload({ photoPreview: 'blob:preview-url' })
      const img = screen.getByAltText('ตัวอย่างรูปภาพ')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'blob:preview-url')
    })

    it('renders remove button when preview is shown', () => {
      renderPhotoUpload({ photoPreview: 'blob:preview-url' })
      expect(screen.getByRole('button', { name: /ลบรูปภาพ/ })).toBeInTheDocument()
    })

    it('calls onRemove when remove button is clicked', async () => {
      const onRemove = vi.fn()
      renderPhotoUpload({ photoPreview: 'blob:preview-url', onRemove })
      await userEvent.click(screen.getByRole('button', { name: /ลบรูปภาพ/ }))
      expect(onRemove).toHaveBeenCalled()
    })
  })
})
