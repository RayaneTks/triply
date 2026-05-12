import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFetch } from '../useFetch';

describe('useFetch', () => {
  it('returns data on successful fetch', async () => {
    const fetcher = vi.fn(async () => 'hello');
    const { result } = renderHook(() => useFetch(fetcher, []));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe('hello');
    expect(result.current.error).toBeNull();
  });

  it('sets error state on rejection', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('boom');
    });
    const { result } = renderHook(() => useFetch(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('boom');
  });

  it('does not fetch when enabled=false', async () => {
    const fetcher = vi.fn(async () => 'data');
    const { result } = renderHook(() => useFetch(fetcher, [], { enabled: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it('refetch triggers a new fetch', async () => {
    let callCount = 0;
    const fetcher = vi.fn(async () => `call-${++callCount}`);
    const { result } = renderHook(() => useFetch(fetcher, []));

    await waitFor(() => expect(result.current.data).toBe('call-1'));

    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.data).toBe('call-2'));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('aborts in-flight request on unmount', async () => {
    const fetcher = vi.fn(async (signal: AbortSignal) => {
      return new Promise<string>((_, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });

    const { unmount } = renderHook(() => useFetch(fetcher, []));
    expect(fetcher).toHaveBeenCalledTimes(1);
    const signal = fetcher.mock.calls[0][0];
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
