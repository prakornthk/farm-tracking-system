import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Tasks from '../../pages/Tasks';
import { AuthProvider } from '../../context/AuthContext';
import { tasksAPI, usersAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  tasksAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    complete: vi.fn(),
  },
  usersAPI: {
    list: vi.fn(),
  },
}));

function renderTasks() {
  return render(
    <MemoryRouter initialEntries={['/tasks']}>
      <AuthProvider>
        <Tasks />
      </AuthProvider>
    </MemoryRouter>
  );
}

const mockTasks = [
  { id: 1, title: 'ฉีดพ่นยาฆ่าแมลง', status: 'pending', priority: 'high', description: 'ใช้ยาชนิด X', assignments: [{ user_id: 1, user: { name: 'ผู้ใช้ A' } }], due_date: '2026-03-30' },
  { id: 2, title: 'รดน้ำต้นไม้', status: 'in_progress', priority: 'medium', assignments: [], due_date: '2026-03-26' },
  { id: 3, title: 'เก็บเกี่ยว', status: 'completed', priority: 'low', assignments: [], due_date: '' },
];

describe('Tasks Page', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test', role: 'owner' }));
    localStorage.setItem('token', 'token');
  });

  it('renders tasks page with title', async () => {
    vi.mocked(tasksAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderTasks();

    await waitFor(() => {
      expect(screen.getByText('งาน')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders task cards with correct data', async () => {
    vi.mocked(tasksAPI.list).mockResolvedValue({ data: mockTasks });
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderTasks();

    await waitFor(() => {
      expect(screen.getByText('ฉีดพ่นยาฆ่าแมลง')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('รดน้ำต้นไม้')).toBeInTheDocument();
  });

  it('renders status badges', async () => {
    vi.mocked(tasksAPI.list).mockResolvedValue({ data: mockTasks });
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderTasks();

    await waitFor(() => {
      expect(screen.getByText('รอดำเนินการ')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('กำลังทำ')).toBeInTheDocument();
    expect(screen.getByText('เสร็จแล้ว')).toBeInTheDocument();
  });

  it('renders priority badge for high priority', async () => {
    vi.mocked(tasksAPI.list).mockResolvedValue({ data: mockTasks });
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderTasks();

    await waitFor(() => {
      expect(screen.getByText('ด่วน')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders filters section', async () => {
    vi.mocked(tasksAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderTasks();

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /ทุกสถานะ/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('opens create task form', async () => {
    const user = userEvent.setup();
    vi.mocked(tasksAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderTasks();

    await waitFor(() => screen.getByText('สร้างงาน'), { timeout: 3000 });
    await user.click(screen.getByText('สร้างงาน'));

    await waitFor(() => {
      expect(screen.getByText('สร้างงานใหม่')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows validation error for empty task name', async () => {
    const user = userEvent.setup();
    vi.mocked(tasksAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderTasks();

    await waitFor(() => screen.getByText('สร้างงาน'), { timeout: 3000 });
    await user.click(screen.getByText('สร้างงาน'));

    await waitFor(() => expect(screen.getByLabelText('ชื่องาน *')).toBeInTheDocument(), { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกชื่องาน')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls complete task API when checkbox clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(tasksAPI.list).mockResolvedValue({ data: mockTasks });
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(tasksAPI.complete).mockResolvedValue({ data: {} });

    renderTasks();

    await waitFor(() => screen.getByText('ฉีดพ่นยาฆ่าแมลง'), { timeout: 3000 });

    await user.click(screen.getByLabelText('ทำเครื่องหมายว่าเสร็จแล้ว'));

    await waitFor(() => {
      expect(vi.mocked(tasksAPI.complete)).toHaveBeenCalledWith(1);
    }, { timeout: 3000 });
  });

  it('renders empty state when no tasks', async () => {
    vi.mocked(tasksAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderTasks();

    await waitFor(() => {
      expect(screen.getByText('ไม่มีงาน')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('hides create button for worker role', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Worker', role: 'worker' }));
    vi.mocked(tasksAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderTasks();

    await waitFor(() => {
      expect(screen.queryByText('สร้างงาน')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders error alert when API fails', async () => {
    vi.mocked(tasksAPI.list).mockRejectedValue(new Error('Server error'));
    vi.mocked(usersAPI.list).mockRejectedValue(new Error('Server error'));

    renderTasks();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
