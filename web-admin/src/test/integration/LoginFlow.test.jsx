import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import ProtectedRoute from '../../components/ProtectedRoute';
import Layout from '../../components/Layout';
import { authAPI } from '../../services/api';

vi.mock('../../services/api', () => ({
  authAPI: {
    lineLogin: vi.fn(),
    logout: vi.fn(),
  },
  dashboardAPI: {
    todayStats: vi.fn(),
  },
}));

function renderWithRouter(ui, { initialEntries = ['/login'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login Flow Integration', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Login Page Rendering', () => {
    it('renders login page with LINE login button', () => {
      renderWithRouter(
        <Routes><Route path="/login" element={<Login />} /></Routes>,
        { initialEntries: ['/login'] }
      );

      expect(screen.getByText('Farm Admin')).toBeInTheDocument();
      expect(screen.getByText('เข้าสู่ระบบด้วย LINE')).toBeInTheDocument();
    });

    it('renders app description', () => {
      renderWithRouter(
        <Routes><Route path="/login" element={<Login />} /></Routes>,
        { initialEntries: ['/login'] }
      );

      expect(screen.getByText('ระบบจัดการฟาร์มอัจฉริยะ')).toBeInTheDocument();
      expect(screen.getByText('กรุณาเข้าสู่ระบบด้วยบัญชี LINE ที่ลงทะเบียนไว้กับฟาร์ม')).toBeInTheDocument();
    });

    it('renders LINE SVG icon', () => {
      renderWithRouter(
        <Routes><Route path="/login" element={<Login />} /></Routes>,
        { initialEntries: ['/login'] }
      );

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has LINE button with correct accessibility', () => {
      renderWithRouter(
        <Routes><Route path="/login" element={<Login />} /></Routes>,
        { initialEntries: ['/login'] }
      );

      const button = screen.getByRole('button', { name: /เข้าสู่ระบบด้วย LINE/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('ProtectedRoute Navigation', () => {
    it('redirects to login when user is not authenticated', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div>Login Page</div>} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div>Dashboard</div>
                </ProtectedRoute>
              } />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders protected content when user is authenticated', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test', role: 'owner' }));
      localStorage.setItem('token', 'test-token');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div>Login Page</div>} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div>Dashboard</div>
                </ProtectedRoute>
              } />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('redirects to dashboard when role not allowed', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Worker', role: 'worker' }));
      localStorage.setItem('token', 'test-token');

      render(
        <MemoryRouter initialEntries={['/users']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div>Login Page</div>} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
              <Route path="/users" element={
                <ProtectedRoute roles={['owner']}>
                  <div>Users</div>
                </ProtectedRoute>
              } />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Navigation Flow', () => {
    it('redirects unknown routes to dashboard when authenticated', () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test', role: 'owner' }));
      localStorage.setItem('token', 'test-token');

      render(
        <MemoryRouter initialEntries={['/unknown-route']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div>Login</div>} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
              <Route path="*" element={<div>Default</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // With localStorage set, the default route (*/dashboard redirect) should trigger
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Login Form Submission', () => {
    it('calls lineLogin and navigates on success', async () => {
      const mockUser = { id: 1, name: 'ผู้ใช้ LINE', role: 'owner' };
      vi.mocked(authAPI.lineLogin).mockResolvedValue({
        data: { token: 'mock-token', user: mockUser },
      });

      render(
        <MemoryRouter initialEntries={['/login?code=ABC123&state=xyz']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(vi.mocked(authAPI.lineLogin)).toHaveBeenCalledWith('ABC123');
    });

    it('stores token and user in localStorage after login', async () => {
      const mockUser = { id: 1, name: 'ผู้ใช้ LINE', role: 'owner' };
      vi.mocked(authAPI.lineLogin).mockResolvedValue({
        data: { token: 'mock-token', user: mockUser },
      });

      render(
        <MemoryRouter initialEntries={['/login?code=ABC123&state=xyz']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('mock-token');
      }, { timeout: 5000 });
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(mockUser);
    });

    it('redirects to login when state mismatch (CSRF)', async () => {
      sessionStorage.setItem('oauth_state', 'correct-state');

      render(
        <MemoryRouter initialEntries={['/login?code=ABC123&state=wrong-state']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Farm Admin')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(vi.mocked(authAPI.lineLogin)).not.toHaveBeenCalled();
    });

    it('redirects to login when login fails', async () => {
      vi.mocked(authAPI.lineLogin).mockRejectedValue(new Error('Login failed'));

      render(
        <MemoryRouter initialEntries={['/login?code=ABC123&state=xyz']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Farm Admin')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('does not execute login when no code in URL', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(vi.mocked(authAPI.lineLogin)).not.toHaveBeenCalled();
    });
  });

  describe('Logout Flow', () => {
    it('clears auth data on logout via Layout', async () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test', role: 'owner' }));
      localStorage.setItem('token', 'test-token');
      vi.mocked(authAPI.logout).mockResolvedValue({});

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div>Login</div>} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              } />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      }, { timeout: 3000 });

      await act(async () => {
        await screen.getByLabelText('ออกจากระบบ').click();
      });

      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
