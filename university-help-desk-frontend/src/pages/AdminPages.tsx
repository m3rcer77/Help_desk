import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChartNoAxesColumn, CheckCircle2, ClipboardList, Clock3, Tags, UserX, Users } from 'lucide-react';
import { ErrorBox, Loading } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { useLoad } from '../hooks/useLoad';
import { errorMessage, formatDate } from '../lib/format';
import { PRIORITY_LABELS, PRIORITY_ORDER, ROLE_LABELS, STATUS_LABELS, STATUS_ORDER } from '../lib/labels';
import { api } from '../services/api';
import type { Role } from '../types';

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="stat-card">
      <div className="stat-icon blue">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Header({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="page-title-row">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="muted">{text}</p>
      </div>
    </div>
  );
}

/** /admin — вход в панель администратора. */
export function AdminHomePage() {
  const { data: stats, error, loading, reload } = useLoad(() => api.getStats(), []);
  const sections = [
    { to: '/admin/users', icon: <Users size={18} />, title: 'Пользователи', text: 'Роли и доступ к системе' },
    { to: '/admin/categories', icon: <Tags size={18} />, title: 'Категории', text: 'Типы обращений для заявок' },
    { to: '/admin/statistics', icon: <ChartNoAxesColumn size={18} />, title: 'Статистика', text: 'Сводка по заявкам' },
  ];
  return (
    <>
      <Header eyebrow="АДМИНИСТРИРОВАНИЕ" title="Панель администратора" text="Управление пользователями, категориями и отчётами." />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !stats && <Loading />}
      {stats && (
        <div className="stats-grid">
          <MiniStat icon={<ClipboardList />} label="Всего заявок" value={stats.total} />
          <MiniStat icon={<Clock3 />} label="Открытых" value={stats.open} />
          <MiniStat icon={<Users />} label="Без исполнителя" value={stats.unassigned} />
          <MiniStat icon={<CheckCircle2 />} label="Закрыто" value={stats.byStatus.CLOSED} />
        </div>
      )}
      <section className="panel">
        {sections.map((s) => (
          <Link className="ticket-row" to={s.to} key={s.to}>
            <div className="ticket-symbol">{s.icon}</div>
            <div className="ticket-main">
              <strong>{s.title}</strong>
              <span>{s.text}</span>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}

export function AdminUsersPage() {
  const { user: me } = useAuth();
  const { data: users, error, loading, reload } = useLoad(() => api.getUsers(), []);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const changeRole = async (id: number, role: Role) => {
    setBusyId(id);
    setActionError('');
    try {
      await api.setUserRole(id, role);
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Header eyebrow="АДМИНИСТРИРОВАНИЕ" title="Пользователи" text="Назначайте роли: студент создаёт заявки, сотрудник обрабатывает их." />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !users && <Loading />}
      {actionError && <p className="error-text" role="alert">{actionError}</p>}
      {users && (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ПОЛЬЗОВАТЕЛЬ</th>
                  <th>РОЛЬ</th>
                  <th>СОЗДАНО ЗАЯВОК</th>
                  <th>НАЗНАЧЕНО НА НЕГО</th>
                  <th>РЕГИСТРАЦИЯ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.fullName}</strong>
                      <span className="table-sub">{u.email}</span>
                    </td>
                    <td>
                      {u.id === me?.id ? (
                        <span title="Свою роль менять нельзя">{ROLE_LABELS[u.role]} (вы)</span>
                      ) : (
                        <select className="select-inline" value={u.role} disabled={busyId === u.id} onChange={(e) => changeRole(u.id, e.target.value as Role)} aria-label={`Роль: ${u.fullName}`}>
                          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>{u.ticketsCreated}</td>
                    <td>{u.ticketsAssigned}</td>
                    <td>{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">Пользователей: <strong>{users.length}</strong></div>
        </section>
      )}
    </>
  );
}

export function AdminCategoriesPage() {
  const { data: categories, error, loading, reload } = useLoad(() => api.getCategories(), []);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError('');
    try {
      await action();
      reload();
      return true;
    } catch (e) {
      setActionError(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => api.createCategory(newName.trim()))) setNewName('');
  };
  const rename = async (id: number) => {
    if (await run(() => api.renameCategory(id, editName.trim()))) setEditId(null);
  };
  const remove = (id: number, name: string) => {
    if (window.confirm(`Удалить категорию «${name}»?`)) void run(() => api.deleteCategory(id));
  };

  return (
    <>
      <Header eyebrow="АДМИНИСТРИРОВАНИЕ" title="Категории" text="Категории выбирают при создании заявки. Удалить можно только категорию без заявок." />
      <section className="panel">
        <form className="inline-form" onSubmit={create}>
          <label>
            Новая категория
            <input value={newName} onChange={(e) => setNewName(e.target.value)} required minLength={2} maxLength={60} placeholder="Например, Библиотека" />
          </label>
          <button className="btn btn-primary" disabled={busy}>Добавить</button>
        </form>
        {actionError && <p className="error-text" role="alert">{actionError}</p>}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {loading && !categories && <Loading />}

        {categories?.map((c) => (
          <div className="ticket-row" key={c.id}>
            <div className="ticket-symbol"><Tags size={18} /></div>
            <div className="ticket-main">
              {editId === c.id ? (
                <input value={editName} onChange={(e) => setEditName(e.target.value)} minLength={2} maxLength={60} aria-label="Название категории" autoFocus />
              ) : (
                <strong>{c.name}</strong>
              )}
              <span>Заявок: {c.ticketsCount ?? 0}</span>
            </div>
            {editId === c.id ? (
              <div className="row-actions">
                <button className="btn btn-primary btn-small" disabled={busy} onClick={() => rename(c.id)}>Сохранить</button>
                <button className="btn btn-outline btn-small" onClick={() => setEditId(null)}>Отмена</button>
              </div>
            ) : (
              <div className="row-actions">
                <button className="btn btn-outline btn-small" onClick={() => { setEditId(c.id); setEditName(c.name); }}>Переименовать</button>
                <button className="btn btn-outline btn-small btn-danger" disabled={busy || (c.ticketsCount ?? 0) > 0} title={(c.ticketsCount ?? 0) > 0 ? 'В категории есть заявки' : 'Удалить'} onClick={() => remove(c.id, c.name)}>
                  <UserX size={14} /> Удалить
                </button>
              </div>
            )}
          </div>
        ))}
        {categories?.length === 0 && <div className="empty-state">Категорий пока нет. Добавьте первую.</div>}
      </section>
    </>
  );
}

function BarRow({ label, value, total, tone }: { label: string; value: number; total: number; tone: number }) {
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar-track">
        <div className={`bar-fill bar-${tone % 4}`} style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

export function AdminStatisticsPage() {
  const { data: stats, error, loading, reload } = useLoad(() => api.getStats(), []);
  return (
    <>
      <Header eyebrow="ОТЧЁТЫ И АНАЛИТИКА" title="Статистика" text="Сводная информация по обращениям в системе." />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !stats && <Loading />}
      {stats && (
        <>
          <div className="stats-grid">
            <MiniStat icon={<ClipboardList />} label="Всего заявок" value={stats.total} />
            <MiniStat icon={<Clock3 />} label="Открытых" value={stats.open} />
            <MiniStat icon={<Users />} label="Без исполнителя" value={stats.unassigned} />
            <MiniStat icon={<CheckCircle2 />} label="Закрыто" value={stats.byStatus.CLOSED} />
          </div>
          <section className="panel statistics-panel">
            <div className="panel-heading"><div><h3>Заявки по статусам</h3><p>Количество обращений в каждом статусе</p></div></div>
            {STATUS_ORDER.map((s, i) => <BarRow key={s} label={STATUS_LABELS[s]} value={stats.byStatus[s]} total={stats.total} tone={i} />)}
          </section>
          <section className="panel statistics-panel">
            <div className="panel-heading"><div><h3>Заявки по приоритетам</h3><p>Насколько срочные обращения</p></div></div>
            {PRIORITY_ORDER.map((p, i) => <BarRow key={p} label={PRIORITY_LABELS[p]} value={stats.byPriority[p]} total={stats.total} tone={i} />)}
          </section>
          <section className="panel statistics-panel">
            <div className="panel-heading"><div><h3>Заявки по категориям</h3><p>Какие проблемы встречаются чаще всего</p></div></div>
            {stats.byCategory.map((c, i) => <BarRow key={c.id} label={c.name} value={c.count} total={stats.total} tone={i} />)}
            {stats.byCategory.length === 0 && <div className="empty-state">Категорий пока нет.</div>}
          </section>
        </>
      )}
    </>
  );
}
