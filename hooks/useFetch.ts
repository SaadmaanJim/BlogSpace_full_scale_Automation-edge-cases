'use client';
import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, getErrorStatus } from '@/lib/errors';

interface FetchState<T> { data: T | null; error: string | null; status: number | null; loading: boolean }

/** Loading / error / data for any GET. Aborts the in-flight request when deps change or on unmount. */
export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<FetchState<T>>({ data: null, error: null, status: null, loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null, status: null }));
    fetcher(controller.signal)
      .then((data) => setState({ data, error: null, status: null, loading: false }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ data: null, error: getErrorMessage(error), status: getErrorStatus(error), loading: false });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater: (prev: T | null) => T | null) => setState((s) => ({ ...s, data: updater(s.data) })), []);
  return { ...state, reload, setData };
}
