import { useEffect, useState } from 'react';
import { api } from '../services/api';

/** Периодически проверяет /api/health, чтобы индикатор «Система работает» был настоящим. */
export function useHealth(intervalMs = 30000): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    const check = () => api.health().then((value) => !cancelled && setOk(value));
    check();
    const timer = window.setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs]);
  return ok;
}
