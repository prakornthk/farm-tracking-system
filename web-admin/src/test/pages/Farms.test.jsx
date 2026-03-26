import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Farms from '../../pages/Farms';
import { AuthProvider } from '../../context/AuthContext';
import { farmsAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  farmsAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderFarms() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Farms />
      </AuthProvider>
    </MemoryRouter>
  );
}

const mockFarms = [
  { id: 1, name: 'ฟาร์มสตรอว์เบอร์รี', location: 'เชียงใหม่', description: 'ฟาร์มหลัก' },
  { id: 2, name: 'ฟาร์มมะเขือเทศ', location: 'ลำปาง', description: '' },
];

describe('Farms Page', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test', role: 'owner' }));
    localStorage.setItem('token', 'token');
  });

  it('renders farms page with title', async () => {
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: [] });

    renderFarms();

    await waitFor(() => {
      expect(screen.getByText('ฟาร์ม')).toBeInTheDocument();
      expect(screen.getByText('จัดการฟาร์มและพื้นที่เพาะปลูก')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows loading spinner while loading', () => {
    vi.mocked(farmsAPI.list).mockImplementation(() => new Promise(() => {}));
    renderFarms();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders empty state when no farms', async () => {
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: [] });

    renderFarms();

    await waitFor(() => {
      expect(screen.getByText('ยังไม่มีฟาร์ม')).toBeInTheDocument();
      expect(screen.getByText('เริ่มต้นโดยการเพิ่มฟาร์มใหม่')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders farm cards when data exists', async () => {
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: mockFarms });

    renderFarms();

    await waitFor(() => {
      expect(screen.getByText('ฟาร์มสตรอว์เบอร์รี')).toBeInTheDocument();
      expect(screen.getByText('เชียงใหม่')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders link to zones for each farm', async () => {
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: mockFarms });

    renderFarms();

    await waitFor(() => {
      const links = screen.getAllByText('ดูโซน');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', '/farms/1/zones');
    }, { timeout: 3000 });
  });

  it('shows add farm button for manager role', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Manager', role: 'manager' }));
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: [] });

    renderFarms();

    await waitFor(() => {
      expect(screen.getByText('เพิ่มฟาร์ม')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('does not show add farm button for worker role', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Worker', role: 'worker' }));
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: [] });

    renderFarms();

    await waitFor(() => {
      expect(screen.queryByText('เพิ่มฟาร์ม')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('opens create form when add farm button clicked', async () => {
    const user = userEvent.setup();
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Owner', role: 'owner' }));
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: [] });

    renderFarms();

    await waitFor(() => screen.getByText('เพิ่มฟาร์ม'), { timeout: 5000 });
    await user.click(screen.getByText('เพิ่มฟาร์ม'));

    await waitFor(() => {
      expect(screen.getByText('เพิ่มฟาร์มใหม่')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup();
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: [] });

    renderFarms();

    await waitFor(() => screen.getByText('เพิ่มฟาร์ม'), { timeout: 5000 });
    await user.click(screen.getByText('เพิ่มฟาร์ม'));

    await waitFor(() => expect(screen.getByLabelText('ชื่อฟาร์ม *')).toBeInTheDocument(), { timeout: 3000 });
    await user.click(screen.getByLabelText('ชื่อฟาร์ม *'));
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกชื่อฟาร์ม')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls farmsAPI.create with form data on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(farmsAPI.create).mockResolvedValue({ data: {} });

    renderFarms();

    await waitFor(() => screen.getByText('เพิ่มฟาร์ม'), { timeout: 5000 });
    await user.click(screen.getByText('เพิ่มฟาร์ม'));

    await waitFor(() => expect(screen.getByLabelText('ชื่อฟาร์ม *')).toBeInTheDocument(), { timeout: 3000 });
    await user.type(screen.getByLabelText('ชื่อฟาร์ม *'), 'ฟาร์มใหม่');
    await user.type(screen.getByLabelText('ที่อยู่/พื้นที่'), 'กรุงเทพ');
    await user.type(screen.getByLabelText('รายละเอียด'), 'รายละเอียดฟาร์ม');

    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() => {
      expect(vi.mocked(farmsAPI.create)).toHaveBeenCalledWith({
        name: 'ฟาร์มใหม่',
        location: 'กรุงเทพ',
        description: 'รายละเอียดฟาร์ม',
      });
    }, { timeout: 3000 });
  });

  it('opens edit form with existing data', async () => {
    const user = userEvent.setup();
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: mockFarms });

    renderFarms();

    await waitFor(() => screen.getByText('ฟาร์มสตรอว์เบอร์รี'), { timeout: 3000 });

    await user.click(screen.getByLabelText('แก้ไขฟาร์ม ฟาร์มสตรอว์เบอร์รี'));

    await waitFor(() => {
      expect(screen.getByText('แก้ไขฟาร์ม')).toBeInTheDocument();
      expect(screen.getByLabelText('ชื่อฟาร์ม *')).toHaveValue('ฟาร์มสตรอว์เบอร์รี');
    }, { timeout: 3000 });
  });

  it('opens delete confirmation modal', async () => {
    const user = userEvent.setup();
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: mockFarms });

    renderFarms();

    await waitFor(() => screen.getByText('ฟาร์มสตรอว์เบอร์รี'), { timeout: 3000 });

    await user.click(screen.getByLabelText('ลบฟาร์ม ฟาร์มสตรอว์เบอร์รี'));

    await waitFor(() => {
      expect(screen.getByText(/ต้องการลบฟาร์ม/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls farmsAPI.delete when confirming delete', async () => {
    const user = userEvent.setup();
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: mockFarms });
    vi.mocked(farmsAPI.delete).mockResolvedValue({ data: {} });

    renderFarms();

    await waitFor(() => screen.getByText('ฟาร์มสตรอว์เบอร์รี'), { timeout: 3000 });
    await user.click(screen.getByLabelText('ลบฟาร์ม ฟาร์มสตรอว์เบอร์รี'));

    await waitFor(() => screen.getByRole('button', { name: 'ยืนยัน' }), { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: 'ยืนยัน' }));

    await waitFor(() => {
      expect(vi.mocked(farmsAPI.delete)).toHaveBeenCalledWith(1);
    }, { timeout: 3000 });
  });

  it('closes form on cancel', async () => {
    const user = userEvent.setup();
    vi.mocked(farmsAPI.list).mockResolvedValue({ data: [] });

    renderFarms();

    await waitFor(() => screen.getByText('เพิ่มฟาร์ม'), { timeout: 5000 });
    await user.click(screen.getByText('เพิ่มฟาร์ม'));

    await waitFor(() => expect(screen.getByText('เพิ่มฟาร์มใหม่')).toBeInTheDocument(), { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: 'ยกเลิก' }));

    await waitFor(() => {
      expect(screen.queryByText('เพิ่มฟาร์มใหม่')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders error state from API', async () => {
    vi.mocked(farmsAPI.list).mockRejectedValue(new Error('Server error'));

    renderFarms();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
