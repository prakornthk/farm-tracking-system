import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

// Component to test the context
function TestConsumer() {
  const { user, login, logout, loading, hasRole, isOwner, isManager, isWorker } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="user">{JSON.stringify(user)}</span>
      <span data-testid="hasRole-owner">{hasRole('owner').toString()}</span>
      <span data-testid="hasRole-manager">{hasRole('manager').toString()}</span>
      <span data-testid="hasRole-worker">{hasRole('worker').toString()}</span>
      <span data-testid="isOwner">{isOwner().toString()}</span>
      <span data-testid="isManager">{isManager().toString()}</span>
      <span data-testid="isWorker">{isWorker().toString()}</span>
      <button onClick={() => login('test-code')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

// Mock the entire api module
vi.mock('../../services/api', () => ({
  authAPI: {
    lineLogin: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('AuthContext', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('loads user from localStorage on mount', async () => {
    const mockUser = { id: 1, name: 'ผู้ใช้ทดสอบ', role: 'manager' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-token');

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
  });

  it('sets loading to true initially then false', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    // Initially might be true, then becomes false after useEffect
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('does not load user when no token in localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    // no token

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  it('login stores user and token in localStorage', async () => {
    const mockUser = { id: 1, name: 'ผู้ใช้ทดสอบ', role: 'owner' };
    authAPI.lineLogin.mockResolvedValue({
      data: { token: 'abc123', user: mockUser },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await act(async () => {
      await screen.getByText('login').click();
    });

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('abc123');
    });
    expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(mockUser);
  });

  it('logout removes token and user from localStorage', async () => {
    const mockUser = { id: 1, name: 'ผู้ใช้ทดสอบ', role: 'owner' };
    localStorage.setItem('token', 'abc123');
    localStorage.setItem('user', JSON.stringify(mockUser));
    authAPI.logout).mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      await screen.getByText('logout').click();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  describe('hasRole', () => {
    it('returns true when user has matching role', async () => {
      const mockUser = { id: 1, name: 'ผู้จัดการ', role: 'manager' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'token');

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('hasRole-manager')).toHaveTextContent('true');
      expect(screen.getByTestId('hasRole-owner')).toHaveTextContent('false');
    });

    it('returns false when user is null', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('hasRole-owner')).toHaveTextContent('false');
    });
  });

  describe('role helpers', () => {
    function RoleTestConsumer() {
      const { user, isOwner, isManager, isWorker } = useAuth();
      return (
        <div>
          <span data-testid="role">{user?.role || 'null'}</span>
          <span data-testid="isOwner">{isOwner().toString()}</span>
          <span data-testid="isManager">{isManager().toString()}</span>
          <span data-testid="isWorker">{isWorker().toString()}</span>
        </div>
      );
    }

    it('isOwner returns true only for owner role', async () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'O', role: 'owner' }));
      localStorage.setItem('token', 'token');

      render(
        <AuthProvider>
          <RoleTestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('isOwner')).toHaveTextContent('true');
      expect(screen.getByTestId('isManager')).toHaveTextContent('true'); // owner also isManager
      expect(screen.getByTestId('isWorker')).toHaveTextContent('true');  // owner also isWorker
    });

    it('isManager returns true for owner and manager', async () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'M', role: 'manager' }));
      localStorage.setItem('token', 'token');

      render(
        <AuthProvider>
          <RoleTestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('isOwner')).toHaveTextContent('false');
      expect(screen.getByTestId('isManager')).toHaveTextContent('true');
      expect(screen.getByTestId('isWorker')).toHaveTextContent('true');
    });

    it('isWorker returns true for all roles', async () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'W', role: 'worker' }));
      localStorage.setItem('token', 'token');

      render(
        <AuthProvider>
          <RoleTestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('isOwner')).toHaveTextContent('false');
      expect(screen.getByTestId('isManager')).toHaveTextContent('false');
      expect(screen.getByTestId('isWorker')).toHaveTextContent('true');
    });
  });
});
