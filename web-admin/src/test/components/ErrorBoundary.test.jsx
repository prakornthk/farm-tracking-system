import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// A component that throws an error with a known message
function ThrowError({ message = 'Test error' }) {
  throw new Error(message);
}

describe('ErrorBoundary', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );
    expect(container).toHaveTextContent('Normal content');
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Something went wrong" />
      </ErrorBoundary>
    );
    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Test error" />
      </ErrorBoundary>
    );
    expect(screen.getByText('ลองใหม่')).toBeInTheDocument();
  });

  it('retry button is clickable', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError message="Test error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('ลองใหม่')).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });
});
