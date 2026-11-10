import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../lib/format';

interface LoadState<T> {
  data: T | null;
  error: string;
  loading: boolean;
}

/**
 * Загрузка данных с состояниями loading/error, защитой от гонок запросов и ручным reload().
 * Пока идёт повторная загрузка, прежние данные остаются на экране.
 */
export function useLoad<T>(loader: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<LoadState<T>>({ data: null, error: '', loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    loader()
      .then((data) => !cancelled && setState({ data, error: '', loading: false }))
      .catch((e) => !cancelled && setState((s) => ({ ...s, error: errorMessage(e), loading: false })));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
