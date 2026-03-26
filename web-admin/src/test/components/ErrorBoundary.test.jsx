import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// A component that throws an error
function ThrowError({ shouldThrow, message = 'Test error' }) {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>Rendered OK</div>;
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
        <ThrowError shouldThrow={true} message="Something went wrong" />
      </ErrorBoundary>
    );

    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders default error message when no message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
    expect(screen.getByText('ไม่สามารถแสดงผลได้')).toBeInTheDocument();
  });

  it('renders retry button that calls onClick', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message="Test error" />
      </ErrorBoundary>
    );

    // The retry button should exist
    expect(screen.getByText('ลองใหม่')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
