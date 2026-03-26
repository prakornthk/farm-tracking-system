import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Users from '../../pages/Users';
import { AuthProvider } from '../../context/AuthContext';
import { usersAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  usersAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderUsers() {
  return render(
    <MemoryRouter initialEntries={['/users']}>
      <AuthProvider>
        <Users />
      </AuthProvider>
    </MemoryRouter>
  );
}

const mockUsers = [
  { id: 1, name: 'เจ้าของฟาร์ม', email: 'owner@farm.com', role: 'owner' },
  { id: 2, name: 'ผู้จัดการ', email: 'manager@farm.com', role: 'manager' },
  { id: 3, name: 'พนักงาน A', email: 'worker@farm.com', role: 'worker' },
];

describe('Users Page', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Owner', role: 'owner' }));
    localStorage.setItem('token', 'token');
  });

  it('renders users page with title for owner', async () => {
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('ผู้ใช้งาน')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('เพิ่มผู้ใช้')).toBeInTheDocument();
  });

  it('renders user table with data', async () => {
    vi.mocked(usersAPI.list).mockResolvedValue({ data: mockUsers });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('เจ้าของฟาร์ม')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('ผู้จัดการ')).toBeInTheDocument();
    expect(screen.getByText('พนักงาน A')).toBeInTheDocument();
  });

  it('renders role badges correctly', async () => {
    vi.mocked(usersAPI.list).mockResolvedValue({ data: mockUsers });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('เจ้าของฟาร์ม')).toBeInTheDocument();
    }, { timeout: 3000 });
    const ownerBadges = screen.getAllByText('เจ้าของ');
    expect(ownerBadges.length).toBeGreaterThan(0);
  });

  it('renders email addresses', async () => {
    vi.mocked(usersAPI.list).mockResolvedValue({ data: mockUsers });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('owner@farm.com')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows access denied message for non-owner', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Worker', role: 'worker' }));
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows access denied message for manager', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Manager', role: 'manager' }));
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('opens create user form', async () => {
    const user = userEvent.setup();
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderUsers();

    await waitFor(() => screen.getByText('เพิ่มผู้ใช้'), { timeout: 3000 });
    await user.click(screen.getByText('เพิ่มผู้ใช้'));

    await waitFor(() => {
      expect(screen.getByText('เพิ่มผู้ใช้ใหม่')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup();
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderUsers();

    await waitFor(() => screen.getByText('เพิ่มผู้ใช้'), { timeout: 3000 });
    await user.click(screen.getByText('เพิ่มผู้ใช้'));

    await waitFor(() => expect(screen.getByLabelText('ชื่อ *')).toBeInTheDocument(), { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกชื่อ')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls usersAPI.create with form data', async () => {
    const user = userEvent.setup();
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(usersAPI.create).mockResolvedValue({ data: {} });

    renderUsers();

    await waitFor(() => screen.getByText('เพิ่มผู้ใช้'), { timeout: 3000 });
    await user.click(screen.getByText('เพิ่มผู้ใช้'));

    await waitFor(() => expect(screen.getByLabelText('ชื่อ *')).toBeInTheDocument(), { timeout: 3000 });
    await user.type(screen.getByLabelText('ชื่อ *'), 'ผู้ใช้ใหม่');
    await user.type(screen.getByLabelText('อีเมล'), 'new@farm.com');

    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() => {
      expect(vi.mocked(usersAPI.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ผู้ใช้ใหม่',
          email: 'new@farm.com',
          role: 'worker',
          line_user_id: '',
        })
      );
    }, { timeout: 3000 });
  });

  it('opens edit form with existing user data', async () => {
    const user = userEvent.setup();
    vi.mocked(usersAPI.list).mockResolvedValue({ data: mockUsers });

    renderUsers();

    await waitFor(() => screen.getByText('เจ้าของฟาร์ม'), { timeout: 3000 });
    await user.click(screen.getByLabelText('แก้ไขผู้ใช้ เจ้าของฟาร์ม'));

    await waitFor(() => {
      expect(screen.getByText('แก้ไขผู้ใช้')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByLabelText('ชื่อ *')).toHaveValue('เจ้าของฟาร์ม');
  });

  it('opens delete confirmation modal', async () => {
    const user = userEvent.setup();
    vi.mocked(usersAPI.list).mockResolvedValue({ data: mockUsers });

    renderUsers();

    await waitFor(() => screen.getByText('เจ้าของฟาร์ม'), { timeout: 3000 });
    await user.click(screen.getByLabelText('ลบผู้ใช้ เจ้าของฟาร์ม'));

    await waitFor(() => {
      expect(screen.getByText(/ต้องการลบผู้ใช้/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders empty state when no users', async () => {
    vi.mocked(usersAPI.list).mockResolvedValue({ data: [] });

    renderUsers();

    await waitFor(() => {
      expect(screen.getByText('ยังไม่มีผู้ใช้')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders loading spinner', () => {
    vi.mocked(usersAPI.list).mockImplementation(() => new Promise(() => {}));

    renderUsers();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    vi.mocked(usersAPI.list).mockRejectedValue(new Error('Server error'));

    renderUsers();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
