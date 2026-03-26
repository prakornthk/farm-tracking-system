import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import Loading from '../components/Loading'

describe('Loading', () => {
  it('renders default loading message', () => {
    render(<Loading />)
    expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument()
  })

  it('renders custom message when provided', () => {
    render(<Loading message="กรุณารอสักครู่..." />)
    expect(screen.getByText('กรุณารอสักครู่...')).toBeInTheDocument()
  })

  it('renders spinner element', () => {
    render(<Loading />)
    expect(document.querySelector('.spinner')).toBeInTheDocument()
  })

  it('renders inside loading container', () => {
    render(<Loading />)
    expect(document.querySelector('.loading')).toBeInTheDocument()
  })
})
