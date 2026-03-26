import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Zones from '../../pages/Zones';
import { AuthProvider } from '../../context/AuthContext';
import { zonesAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  zonesAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderZones(farmId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/farms/${farmId}/zones`]}>
      <Routes>
        <Route path="/farms/:id/zones" element={
          <AuthProvider><Zones /></AuthProvider>
        } />
      </Routes>
    </MemoryRouter>
  );
}

const mockZones = [
  { id: 1, name: 'โซน A', description: 'โซนผัก leafy' },
  { id: 2, name: 'โซน B', description: 'โซนสตรอว์เบอร์รี' },
];

describe('Zones Page', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Owner', role: 'owner' }));
    localStorage.setItem('token', 'token');
  });

  it('renders zones page', async () => {
    vi.mocked(zonesAPI.list).mockResolvedValue({ data: [] });

    renderZones();

    await waitFor(() => {
      expect(screen.getByText('โซนในฟาร์ม')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders zone cards', async () => {
    vi.mocked(zonesAPI.list).mockResolvedValue({ data: mockZones });

    renderZones();

    await waitFor(() => {
      expect(screen.getByText('โซน A')).toBeInTheDocument();
      expect(screen.getByText('โซนผัก leafy')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders link to plots', async () => {
    vi.mocked(zonesAPI.list).mockResolvedValue({ data: mockZones });

    renderZones();

    await waitFor(() => {
      const links = screen.getAllByText('ดูแปลง');
      expect(links[0]).toHaveAttribute('href', '/zones/1/plots');
    }, { timeout: 3000 });
  });

  it('opens create zone form', async () => {
    const user = userEvent.setup();
    vi.mocked(zonesAPI.list).mockResolvedValue({ data: [] });

    renderZones();

    await waitFor(() => screen.getByText('เพิ่มโซน'), { timeout: 5000 });
    await user.click(screen.getByText('เพิ่มโซน'));

    await waitFor(() => {
      expect(screen.getByText('เพิ่มโซนใหม่')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows validation error for empty zone name', async () => {
    const user = userEvent.setup();
    vi.mocked(zonesAPI.list).mockResolvedValue({ data: [] });

    renderZones();

    await waitFor(() => screen.getByText('เพิ่มโซน'), { timeout: 5000 });
    await user.click(screen.getByText('เพิ่มโซน'));

    await waitFor(() => expect(screen.getByLabelText('ชื่อโซน *')).toBeInTheDocument(), { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกชื่อโซน')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders back navigation', async () => {
    vi.mocked(zonesAPI.list).mockResolvedValue({ data: [] });

    renderZones();

    await waitFor(() => {
      expect(screen.getByLabelText('กลับ')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders empty state', async () => {
    vi.mocked(zonesAPI.list).mockResolvedValue({ data: [] });

    renderZones();

    await waitFor(() => {
      expect(screen.getByText('ยังไม่มีโซน')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls zonesAPI.create with form data', async () => {
    const user = userEvent.setup();
    vi.mocked(zonesAPI.list).mockResolvedValue({ data: [] });
    vi.mocked(zonesAPI.create).mockResolvedValue({ data: {} });

    renderZones();

    await waitFor(() => screen.getByText('เพิ่มโซน'), { timeout: 5000 });
    await user.click(screen.getByText('เพิ่มโซน'));

    await waitFor(() => expect(screen.getByLabelText('ชื่อโซน *')).toBeInTheDocument(), { timeout: 3000 });
    await user.type(screen.getByLabelText('ชื่อโซน *'), 'โซนใหม่');
    await user.type(screen.getByLabelText('รายละเอียด'), 'รายละเอียดโซน');

    await user.click(screen.getByRole('button', { name: 'บันทึก' }));

    await waitFor(() => {
      expect(vi.mocked(zonesAPI.create)).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ name: 'โซนใหม่', description: 'รายละเอียดโซน' })
      );
    }, { timeout: 3000 });
  });

  it('renders error state', async () => {
    vi.mocked(zonesAPI.list).mockRejectedValue(new Error('Server error'));

    renderZones();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
