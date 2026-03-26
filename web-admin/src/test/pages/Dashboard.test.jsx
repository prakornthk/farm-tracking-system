import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import { AuthProvider } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  dashboardAPI: {
    todayStats: vi.fn(),
  },
}));

function renderDashboard(initialEntries = ['/dashboard']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Dashboard', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test', role: 'owner' }));
    localStorage.setItem('token', 'test-token');
  });

  it('renders page title', async () => {
    vi.mocked(dashboardAPI.todayStats).mockResolvedValue({ data: {} });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('แดชบอร์ด')).toBeInTheDocument();
    });
  });

  it('renders loading skeleton while loading', async () => {
    vi.mocked(dashboardAPI.todayStats).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    renderDashboard();

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  it('renders stats cards with data from API', async () => {
    vi.mocked(dashboardAPI.todayStats).mockResolvedValue({
      data: {
        activities_today: 5,
        pending_tasks: 10,
        completed_tasks_today: 3,
        overdue_tasks: 2,
        open_problems: 1,
        my_tasks_today: 4,
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders correct stat labels', async () => {
    vi.mocked(dashboardAPI.todayStats).mockResolvedValue({
      data: {
        activities_today: 0,
        pending_tasks: 0,
        completed_tasks_today: 0,
        open_problems: 0,
        my_tasks_today: 0,
        overdue_tasks: 0,
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('กิจกรรมวันนี้')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('งานค้าง')).toBeInTheDocument();
    expect(screen.getByText('งานเสร็จวันนี้')).toBeInTheDocument();
    expect(screen.getByText('ปัญหาเปิด')).toBeInTheDocument();
  });

  it('shows overdue alert when overdue_tasks > 0', async () => {
    vi.mocked(dashboardAPI.todayStats).mockResolvedValue({
      data: {
        activities_today: 0, pending_tasks: 0, completed_tasks_today: 0,
        open_problems: 0, my_tasks_today: 0, overdue_tasks: 3,
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('งานที่เกินกำหนด')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('3 งานที่ต้องดำเนินการด่วน')).toBeInTheDocument();
  });

  it('does not show overdue alert when no overdue tasks', async () => {
    vi.mocked(dashboardAPI.todayStats).mockResolvedValue({
      data: {
        activities_today: 0, pending_tasks: 0, completed_tasks_today: 0,
        open_problems: 0, my_tasks_today: 0, overdue_tasks: 0,
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('แดชบอร์ด')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.queryByText('งานที่เกินกำหนด')).not.toBeInTheDocument();
  });

  it('renders quick links section', async () => {
    vi.mocked(dashboardAPI.todayStats).mockResolvedValue({
      data: {
        activities_today: 0, pending_tasks: 0, completed_tasks_today: 0,
        open_problems: 0, my_tasks_today: 0, overdue_tasks: 0,
      },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('งานทั้งหมด')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('ปัญหา')).toBeInTheDocument();
    expect(screen.getByText('ฟาร์ม')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    vi.mocked(dashboardAPI.todayStats).mockRejectedValue(
      new Error('Network error')
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('calls execute on mount', async () => {
    vi.mocked(dashboardAPI.todayStats).mockResolvedValue({ data: {} });

    renderDashboard();

    await waitFor(() => {
      expect(vi.mocked(dashboardAPI.todayStats)).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
