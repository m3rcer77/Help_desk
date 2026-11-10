import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { ErrorBox, Loading } from '../components/Feedback';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useDebounced } from '../hooks/useDebounced';
import { useLoad } from '../hooks/useLoad';
import { formatDate } from '../lib/format';
import { PRIORITY_LABELS, PRIORITY_ORDER, STATUS_LABELS, STATUS_ORDER } from '../lib/labels';
import { api } from '../services/api';
import type { Priority, TicketStatus } from '../types';

export default function TicketsPage() {
  const { user } = useAuth();
  const isStaff = user?.role !== 'STUDENT';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const q = useDebounced(search.trim(), 300);

  const categories = useLoad(() => api.getCategories(), []);
  const { data: tickets, error, loading, reload } = useLoad(
    () => api.getTickets({ q, status, priority, categoryId, dateFrom, dateTo }),
    [q, status, priority, categoryId, dateFrom, dateTo],
  );

  const hasFilters = Boolean(search || status || priority || categoryId || dateFrom || dateTo);
  const reset = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setCategoryId('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">УПРАВЛЕНИЕ ОБРАЩЕНИЯМИ</div>
          <h1>{isStaff ? 'Все заявки' : 'Мои заявки'}</h1>
          <p className="muted">Просматривайте и отслеживайте обращения в службу поддержки.</p>
        </div>
        <Link to="/tickets/create" className="btn btn-primary">
          <Plus size={17} /> Новая заявка
        </Link>
      </div>

      <section className="panel">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={17} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Номер, заголовок, описание, аудитория…" aria-label="Поиск по заявкам" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus | '')} aria-label="Статус">
            <option value="">Все статусы</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | '')} aria-label="Приоритет">
            <option value="">Все приоритеты</option>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')} aria-label="Категория">
            <option value="">Все категории</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <label className="date-filter">
            с <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} aria-label="Дата от" />
          </label>
          <label className="date-filter">
            по <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} aria-label="Дата до" />
          </label>
          {hasFilters && (
            <button type="button" className="btn btn-outline btn-small" onClick={reset}>
              Сбросить
            </button>
          )}
        </div>

        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !tickets && <Loading />}

        {tickets && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ЗАЯВКА</th>
                    <th>КАТЕГОРИЯ / АУДИТОРИЯ</th>
                    <th>ИСПОЛНИТЕЛЬ</th>
                    <th>ПРИОРИТЕТ</th>
                    <th>СТАТУС</th>
                    <th>ДАТА</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <Link className="table-ticket-title" to={`/tickets/${t.id}`}>{t.title}</Link>
                        <span className="table-sub">#{t.id} · {t.creator.fullName}</span>
                      </td>
                      <td>
                        {t.category.name}
                        <span className="table-sub">{t.room ? `Ауд. ${t.room}` : 'Аудитория не указана'}</span>
                      </td>
                      <td>{t.assignedTo?.fullName ?? <span className="muted">Не назначен</span>}</td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td><StatusBadge status={t.status} /></td>
                      <td>{formatDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tickets.length === 0 && (
                <div className="empty-state">
                  {hasFilters ? 'По заданным условиям заявки не найдены. Измените или сбросьте фильтры.' : 'Заявок пока нет. Создайте первую заявку.'}
                </div>
              )}
            </div>
            <div className="table-footer">
              Показано заявок: <strong>{tickets.length}</strong>
              {loading && ' · обновляем…'}
            </div>
          </>
        )}
      </section>
    </>
  );
}
