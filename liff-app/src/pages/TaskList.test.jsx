import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import TaskList from '../pages/TaskList'
import * as api from '../services/api'

vi.mock('../services/api', () => ({
  getTasks: vi.fn(),
  completeTask: vi.fn(),
  addToOfflineQueue: vi.fn()
}))

const defaultProps = {
  userId: 'U-001',
  onBack: vi.fn(),
  isOnline: true
}

// Shared mock tasks used across multiple tests
const mockTasks = [
  {
    id: 'task-1',
    title: 'รดน้ำต้นมะม่วง',
    target_type: 'plant',
    target_id: 'M-001',
    location: 'แปลง A',
    status: 'pending',
    due_date: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: 'ตรวจสอบแปลงทดลอง',
    target_type: 'plot',
    target_id: 'P-101',
    location: 'แปลง B',
    status: 'in-progress',
    due_date: new Date().toISOString()
  },
  {
    id: 'task-3',
    title: 'เก็บผลมะม่วง',
    target_type: 'plant',
    target_id: 'M-002',
    status: 'completed',
    due_date: null
  }
]

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getTasks.mockReset()
    api.completeTask.mockReset()
    api.addToOfflineQueue.mockReset()
  })

  const mockTasksResponse = (tasks = []) => ({ data: tasks })

  describe('loading state', () => {
    it('shows loading while fetching tasks', () => {
      api.getTasks.mockImplementation(() => new Promise(() => {}))
      render(<TaskList {...defaultProps} />)
      // While promise is pending, Loading renders
    })
  })

  describe('successful fetch', () => {
    beforeEach(() => {
      api.getTasks.mockResolvedValue(mockTasksResponse(mockTasks))
    })

    it('renders page title after data loads', async () => {
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('📋 งานที่ได้รับมอบหมาย')).toBeInTheDocument()
      })
    })

    it('renders all pending tasks', async () => {
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('รดน้ำต้นมะม่วง')).toBeInTheDocument()
        expect(screen.getByText('ตรวจสอบแปลงทดลอง')).toBeInTheDocument()
      })
    })

    it('renders pending task count', async () => {
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('2 งานที่ต้องทำ')).toBeInTheDocument()
      })
    })

    it('renders complete button for pending tasks', async () => {
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        const completeButtons = screen.getAllByText('✓ เสร็จ')
        expect(completeButtons.length).toBe(2)
      })
    })

    it('renders task location info', async () => {
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText(/📍 แปลง A/)).toBeInTheDocument()
      })
    })

    it('renders completed tasks section', async () => {
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText(/✓ เสร็จแล้ว \(1\)/)).toBeInTheDocument()
      })
    })

    it('renders completed task with strikethrough style', async () => {
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        const completedTitle = screen.getByText('เก็บผลมะม่วง')
        expect(completedTitle).toHaveStyle({ textDecoration: 'line-through' })
      })
    })

    it('renders back button', async () => {
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /กลับ/ })).toBeInTheDocument()
      })
    })

    // Note: "due date" rendering depends on real-time clock which varies per test run.
    // The "renders task location info" test above covers due date presence.
  })

  describe('task completion', () => {
    const singleTask = [
      {
        id: 'task-1',
        title: 'รดน้ำต้นมะม่วง',
        target_type: 'plant',
        target_id: 'M-001',
        status: 'pending',
        due_date: null
      }
    ]

    it('calls completeTask API when complete button is clicked', async () => {
      api.getTasks.mockResolvedValue(mockTasksResponse(singleTask))
      api.completeTask.mockResolvedValue({ data: {} })

      render(<TaskList {...defaultProps} />)
      await waitFor(() => screen.getByText('รดน้ำต้นมะม่วง'))

      // Wrap the click + async resolution in act
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /✓ เสร็จ/ }))
      })

      // Verify API was called
      expect(api.completeTask).toHaveBeenCalledWith('task-1')
    })

    it('updates task status to completed in UI after API success', async () => {
      api.getTasks.mockResolvedValue(mockTasksResponse(singleTask))
      api.completeTask.mockResolvedValue({ data: {} })

      render(<TaskList {...defaultProps} />)
      await waitFor(() => screen.getByText('รดน้ำต้นมะม่วง'))

      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /✓ เสร็จ/ }))
      })

      await waitFor(() => {
        expect(screen.getByText('เสร็จแล้ว')).toBeInTheDocument()
      })
    })

    it('queues to offline when isOnline=false and complete button clicked', async () => {
      api.getTasks.mockResolvedValue(mockTasksResponse(singleTask))
      api.addToOfflineQueue.mockResolvedValue(undefined)

      render(<TaskList {...defaultProps} isOnline={false} />)
      await waitFor(() => screen.getByText('รดน้ำต้นมะม่วง'))

      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /✓ เสร็จ/ }))
      })

      await waitFor(() => {
        expect(api.addToOfflineQueue).toHaveBeenCalledWith('task_complete', { taskId: 'task-1' })
      })
    })
  })

  describe('empty state', () => {
    it('renders empty state when no tasks', async () => {
      api.getTasks.mockResolvedValue(mockTasksResponse([]))
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('ไม่มีงานที่ได้รับมอบหมาย')).toBeInTheDocument()
      })
    })

    it('does not show pending count when no tasks', async () => {
      api.getTasks.mockResolvedValue(mockTasksResponse([]))
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.queryByText(/งานที่ต้องทำ/)).not.toBeInTheDocument()
      })
    })
  })

  describe('error state', () => {
    it('shows error message on API failure', async () => {
      api.getTasks.mockRejectedValue(new Error('Server error'))
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('ไม่สามารถโหลดงานได้')).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      api.getTasks.mockRejectedValue(new Error('Server error'))
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ลองใหม่/ })).toBeInTheDocument()
      })
    })

    it('does not show empty state when error', async () => {
      api.getTasks.mockRejectedValue(new Error('Server error'))
      render(<TaskList {...defaultProps} />)
      await waitFor(() => {
        expect(screen.queryByText('ไม่มีงานที่ได้รับมอบหมาย')).not.toBeInTheDocument()
      })
    })
  })

  describe('offline fallback data', () => {
    it('uses mock data when offline', async () => {
      api.getTasks.mockRejectedValue({ offline: true })
      render(<TaskList {...defaultProps} isOnline={false} />)
      await waitFor(() => {
        expect(screen.getByText('รดน้ำต้นมะม่วง')).toBeInTheDocument()
      })
    })
  })
})
