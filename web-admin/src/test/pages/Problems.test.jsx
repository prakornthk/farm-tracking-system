import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Problems from '../../pages/Problems';
import { AuthProvider } from '../../context/AuthContext';
import { problemsAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  problemsAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderProblems() {
  return render(
    <MemoryRouter initialEntries={['/problems']}>
      <AuthProvider>
        <Problems />
      </AuthProvider>
    </MemoryRouter>
  );
}

const mockProblems = [
  { id: 1, title: 'ใบเหลืองผิดปกติ', severity: 'high', description: 'พบในแปลง A1', plot_name: 'แปลง A1', reporter_name: 'ผู้ใช้ A' },
  { id: 2, title: 'แมลงรบกวน', severity: 'medium', description: '', plot_name: '', reporter_name: 'ผู้ใช้ B' },
];

describe('Problems Page', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test', role: 'owner' }));
    localStorage.setItem('token', 'token');
  });

  it('renders problems page with title', async () => {
    vi.mocked(problemsAPI.list).mockResolvedValue({ data: [] });

    renderProblems();

    await waitFor(() => {
      expect(screen.getByText('รายงานปัญหา')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders problem cards with data', async () => {
    vi.mocked(problemsAPI.list).mockResolvedValue({ data: mockProblems });

    renderProblems();

    await waitFor(() => {
      expect(screen.getByText('ใบเหลืองผิดปกติ')).toBeInTheDocument();
      expect(screen.getByText('แมลงรบกวน')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders severity badges', async () => {
    vi.mocked(problemsAPI.list).mockResolvedValue({ data: mockProblems });

    renderProblems();

    await waitFor(() => {
      expect(screen.getAllByText('ด่วน')).toHaveLength(1);
      expect(screen.getAllByText('ปานกลาง')).toHaveLength(1);
    }, { timeout: 3000 });
  });

  it('renders empty state when no problems', async () => {
    vi.mocked(problemsAPI.list).mockResolvedValue({ data: [] });

    renderProblems();

    await waitFor(() => {
      expect(screen.getByText('ไม่มีปัญหาที่รายงาน')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('opens create problem form', async () => {
    const user = userEvent.setup();
    vi.mocked(problemsAPI.list).mockResolvedValue({ data: [] });

    renderProblems();

    await waitFor(() => screen.getByText('แจ้งปัญหา'), { timeout: 5000 });
    await user.click(screen.getByText('แจ้งปัญหา'));

    await waitFor(() => {
      expect(screen.getByText('แจ้งปัญหาใหม่')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows validation error for empty title', async () => {
    const user = userEvent.setup();
    vi.mocked(problemsAPI.list).mockResolvedValue({ data: [] });

    renderProblems();

    await waitFor(() => screen.getByText('แจ้งปัญหา'), { timeout: 5000 });
    await user.click(screen.getByText('แจ้งปัญหา'));

    await waitFor(() => expect(screen.getByLabelText('หัวข้อปัญหา *')).toBeInTheDocument(), { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกหัวข้อปัญหา')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls problemsAPI.create on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(problemsAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(problemsAPI.create).mockResolvedValue({ data: {} });

    renderProblems();

    await waitFor(() => screen.getByText('แจ้งปัญหา'), { timeout: 5000 });
    await user.click(screen.getByText('แจ้งปัญหา'));

    await waitFor(() => expect(screen.getByLabelText('หัวข้อปัญหา *')).toBeInTheDocument(), { timeout: 3000 });
    await user.type(screen.getByLabelText('หัวข้อปัญหา *'), 'ปัญหาใหม่');
    await user.type(screen.getByLabelText('รายละเอียด'), 'รายละเอียดเพิ่มเติม');

    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() => {
      expect(vi.mocked(problemsAPI.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'ปัญหาใหม่',
          description: 'รายละเอียดเพิ่มเติม',
        })
      );
    }, { timeout: 3000 });
  });

  it('opens edit form with existing data', async () => {
    const user = userEvent.setup();
    vi.mocked(problemsAPI.list).mockResolvedValue({ data: mockProblems });

    renderProblems();

    await waitFor(() => screen.getByText('ใบเหลืองผิดปกติ'), { timeout: 3000 });

    await user.click(screen.getByLabelText('แก้ไขปัญหา ใบเหลืองผิดปกติ'));

    await waitFor(() => {
      expect(screen.getByText('แก้ไขปัญหา')).toBeInTheDocument();
      expect(screen.getByLabelText('หัวข้อปัญหา *')).toHaveValue('ใบเหลืองผิดปกติ');
    }, { timeout: 3000 });
  });

  it('opens delete confirmation modal', async () => {
    const user = userEvent.setup();
    vi.mocked(problemsAPI.list).mockResolvedValue({ data: mockProblems });

    renderProblems();

    await waitFor(() => screen.getByText('ใบเหลืองผิดปกติ'), { timeout: 3000 });

    await user.click(screen.getByLabelText('ลบปัญหา ใบเหลืองผิดปกติ'));

    await waitFor(() => {
      expect(screen.getByText(/ต้องการลบปัญหา/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders error state', async () => {
    vi.mocked(problemsAPI.list).mockRejectedValue(new Error('Server error'));

    renderProblems();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders show edit/delete buttons for manager role', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Manager', role: 'manager' }));
    vi.mocked(problemsAPI.list).mockResolvedValue({ data: mockProblems });

    renderProblems();

    await waitFor(() => screen.getByText('ใบเหลืองผิดปกติ'), { timeout: 3000 });

    const editButtons = screen.getAllByLabelText(/แก้ไขปัญหา/i);
    expect(editButtons.length).toBeGreaterThan(0);
  });
});
