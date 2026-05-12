'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic data-fetching hook with cancellation, loading, and error states.
 *
 * Captures the pattern repeated across TripDetailView / ProfileView /
 * RecapVoyageView: setLoading(true) → fetch → if-cancelled-bail → setData /
 * setError → setLoading(false), with a return-cleanup that flips `cancelled`.
 *
 * @param fetcher  async function that runs the actual fetch. Receives an
 *                 AbortSignal so HTTP calls can be aborted cleanly.
 * @param deps     dependency list — when any value changes, re-fetch.
 * @param options.enabled  set to false to skip fetching (e.g. waiting for an id).
 */
export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
  options: { enabled?: boolean } = {},
): UseFetchResult<T> {
  const enabled = options.enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Erreur réseau ou serveur.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refetchTick, ...deps]);

  const refetch = useCallback(() => {
    setRefetchTick((tick) => tick + 1);
  }, []);

  return { data, loading, error, refetch };
}
