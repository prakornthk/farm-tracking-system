import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi } from '../../hooks/useApi';

// Mock api function
const mockApiFn = vi.fn();

describe('useApi Hook', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with null data, false loading, and null error', () => {
    const { result } = renderHook(() => useApi(mockApiFn));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('executes API call and sets data on success', async () => {
    const mockData = [{ id: 1, name: 'ฟาร์ม A' }];
    mockApiFn.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useApi(mockApiFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error and throws on API failure', async () => {
    const error = new Error('Server error');
    mockApiFn.mockRejectedValue(error);

    const { result } = renderHook(() => useApi(mockApiFn));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        // expected to throw
      }
    });

    expect(result.current.error).toBe('Server error');
    expect(result.current.loading).toBe(false);
  });

  it('extracts error message from response.data.message', async () => {
    const apiError = {
      name: 'AxiosError',
      response: { data: { message: 'ไม่มีสิทธิ์เข้าถึง' } },
      message: 'Request failed',
    };
    mockApiFn.mockRejectedValue(apiError);

    const { result } = renderHook(() => useApi(mockApiFn));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        // expected
      }
    });

    expect(result.current.error).toBe('ไม่มีสิทธิ์เข้าถึง');
  });

  it('resets state via reset()', async () => {
    mockApiFn.mockResolvedValue({ data: [{ id: 1 }] });
    const { result } = renderHook(() => useApi(mockApiFn));

    await act(async () => { await result.current.execute(); });
    expect(result.current.data).not.toBeNull();

    act(() => { result.current.reset(); });
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('ignores AbortError on unmount', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockApiFn.mockRejectedValue(abortError);

    const { result, unmount } = renderHook(() => useApi(mockApiFn));

    unmount();

    // Should not throw
    await act(async () => {
      await result.current.execute().catch(() => {});
    });

    // Error should be cleared silently
    expect(result.current.error).toBeNull();
  });

  it('handles ERR_CANCELED error code silently', async () => {
    const canceledError = new Error('Canceled');
    canceledError.code = 'ERR_CANCELED';
    mockApiFn.mockRejectedValue(canceledError);

    const { result } = renderHook(() => useApi(mockApiFn));

    await act(async () => {
      await result.current.execute().catch(() => {});
    });

    // Should be silently ignored
    expect(result.current.error).toBeNull();
  });

  it('calls the latest apiFn when deps change', async () => {
    const apiFn1 = vi.fn().mockResolvedValue({ data: [1] });
    const apiFn2 = vi.fn().mockResolvedValue({ data: [2] });

    const { result, rerender } = renderHook(
      ({ fn }) => useApi(fn),
      { initialProps: { fn: apiFn1 } }
    );

    await act(async () => { await result.current.execute(); });
    expect(apiFn1).toHaveBeenCalled();

    rerender({ fn: apiFn2 });
    await act(async () => { await result.current.execute(); });
    expect(apiFn2).toHaveBeenCalled();
  });

  it('returns data from execute() call', async () => {
    const mockData = { items: ['a', 'b'] };
    mockApiFn.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useApi(mockApiFn));

    let returned;
    await act(async () => {
      returned = await result.current.execute();
    });

    expect(returned).toEqual(mockData);
  });

  it('throws original error after setting error state', async () => {
    const error = new Error('Original error');
    mockApiFn.mockRejectedValue(error);

    const { result } = renderHook(() => useApi(mockApiFn));

    let thrown;
    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        thrown = e;
      }
    });

    expect(thrown).toBe(error);
  });
});
