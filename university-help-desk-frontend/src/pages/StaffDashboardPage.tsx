import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChartNoAxesColumn, CheckCircle2, ClipboardList, Clock3 } from 'lucide-react';
import { ErrorBox, Loading } from '../components/Feedback';
import { PriorityBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useLoad } from '../hooks/useLoad';
import { errorMessage } from '../lib/format';
import { PRIORITY_WEIGHT } from '../lib/labels';
import { api } from '../services/api';
import type { ReactNode } from 'react';
import type { TicketSummary } from '../types';

type Tab = 'new' | 'mine' | 'all';

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="stat-card">
      <div className="stat-icon blue">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const byUrgency = (a: TicketSummary, b: TicketSummary) =>
  PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const { data: tickets, error, loading, reload } = useLoad(() => api.getTickets(), []);
  const [tab, setTab] = useState<Tab>('new');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const list = tickets ?? [];
  const fresh = list.filter((t) => t.status === 'NEW').sort(byUrgency);
  const working = list.filter((t) => t.status === 'IN_PROGRESS').sort(byUrgency);
  const mine = working.filter((t) => t.assignedTo?.id === user?.id);
  const done = list.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const shown = tab === 'new' ? fresh : tab === 'mine' ? mine : working;

  const take = async (id: number) => {
    setBusyId(id);
    setActionError('');
    try {
      await api.updateTicket(id, { status: 'IN_PROGRESS' });
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">РАБОЧЕЕ МЕСТО</div>
          <h1>Панель сотрудника</h1>
          <p className="muted">Очередь обращений, требующих внимания команды поддержки.</p>
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !tickets && <Loading />}

      {tickets && (
        <>
          <div className="stats-grid">
            <MiniStat icon={<ClipboardList />} label="Всего заявок" value={list.length} />
            <MiniStat icon={<Clock3 />} label="Новые" value={fresh.length} />
            <MiniStat icon={<ChartNoAxesColumn />} label="В работе" value={working.length} />
            <MiniStat icon={<CheckCircle2 />} label="Решены / закрыты" value={done} />
          </div>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Очередь заявок</h3>
                <p>Сначала самые срочные и самые старые.</p>
              </div>
              <Link to="/tickets" className="text-link">Все заявки →</Link>
            </div>

            <div className="tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'new'} className={tab === 'new' ? 'tab active' : 'tab'} onClick={() => setTab('new')}>Новые ({fresh.length})</button>
              <button role="tab" aria-selected={tab === 'mine'} className={tab === 'mine' ? 'tab active' : 'tab'} onClick={() => setTab('mine')}>Мои в работе ({mine.length})</button>
              <button role="tab" aria-selected={tab === 'all'} className={tab === 'all' ? 'tab active' : 'tab'} onClick={() => setTab('all')}>Все в работе ({working.length})</button>
            </div>

            {actionError && <p className="error-text" role="alert">{actionError}</p>}

            {shown.map((t) => (
              <div className="ticket-row" key={t.id}>
                <div className="ticket-symbol"><ClipboardList size={18} /></div>
                <Link className="ticket-main" to={`/tickets/${t.id}`}>
                  <strong>{t.title}</strong>
                  <span>
                    #{t.id} · {t.category.name}
                    {t.room ? ` · Ауд. ${t.room}` : ''} · {t.assignedTo ? t.assignedTo.fullName : 'не назначен'}
                  </span>
                </Link>
                <div className="ticket-badges">
                  <PriorityBadge priority={t.priority} />
                </div>
                {t.status === 'NEW' && (
                  <button className="btn btn-primary btn-small" disabled={busyId === t.id} onClick={() => take(t.id)}>
                    {busyId === t.id ? '…' : 'Взять в работу'}
                  </button>
                )}
              </div>
            ))}
            {shown.length === 0 && (
              <div className="empty-state">
                {tab === 'new' ? 'Новых заявок нет.' : tab === 'mine' ? 'У вас нет заявок в работе.' : 'Сейчас ничего не в работе.'}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
