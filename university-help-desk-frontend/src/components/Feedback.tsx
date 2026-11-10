import type { ReactNode } from 'react';

export function Loading({ text = 'Загрузка…' }: { text?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" /> {text}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-small" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}

export function Notice({ tone, children }: { tone: 'success' | 'warning'; children: ReactNode }) {
  return (
    <div className={`alert alert-${tone}`} role="status">
      {children}
    </div>
  );
}
