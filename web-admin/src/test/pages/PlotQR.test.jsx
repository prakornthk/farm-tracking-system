import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlotQR from '../../pages/PlotQR';
import { AuthProvider } from '../../context/AuthContext';
import { plotsAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  plotsAPI: {
    get: vi.fn(),
  },
}));

function renderPlotQR(plotId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/plots/${plotId}/qr`]}>
      <Routes>
        <Route path="/plots/:id/qr" element={
          <AuthProvider><PlotQR /></AuthProvider>
        } />
      </Routes>
    </MemoryRouter>
  );
}

describe('PlotQR Page', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Owner', role: 'owner' }));
    localStorage.setItem('token', 'token');
  });

  it('renders QR page title', async () => {
    vi.mocked(plotsAPI.get).mockResolvedValue({
      data: { id: 1, name: 'แปลง A1', plant_type: 'สตรอว์เบอร์รี' },
    });

    renderPlotQR();

    await waitFor(() => {
      expect(screen.getByText('QR Code แปลง #1')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders QR code SVG', async () => {
    vi.mocked(plotsAPI.get).mockResolvedValue({
      data: { id: 1, name: 'แปลง A1', plant_type: '' },
    });

    renderPlotQR();

    await waitFor(() => {
      expect(document.querySelector('svg')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders plot name in QR card', async () => {
    vi.mocked(plotsAPI.get).mockResolvedValue({
      data: { id: 1, name: 'แปลง A1', plant_type: 'สตรอว์เบอร์รี' },
    });

    renderPlotQR();

    await waitFor(() => {
      expect(screen.getByText('แปลง A1')).toBeInTheDocument();
      expect(screen.getByText('🌱 สตรอว์เบอร์รี')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders download and print buttons', async () => {
    vi.mocked(plotsAPI.get).mockResolvedValue({
      data: { id: 1, name: 'แปลง A1', plant_type: '' },
    });

    renderPlotQR();

    await waitFor(() => {
      expect(screen.getByText('ดาวน์โหลด')).toBeInTheDocument();
      expect(screen.getByText('พิมพ์')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders back navigation button', async () => {
    vi.mocked(plotsAPI.get).mockResolvedValue({
      data: { id: 1, name: 'แปลง A1', plant_type: '' },
    });

    renderPlotQR();

    await waitFor(() => {
      expect(screen.getByLabelText('กลับ')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders loading state', () => {
    vi.mocked(plotsAPI.get).mockImplementation(() => new Promise(() => {}));

    renderPlotQR();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    vi.mocked(plotsAPI.get).mockRejectedValue(new Error('Server error'));

    renderPlotQR();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
