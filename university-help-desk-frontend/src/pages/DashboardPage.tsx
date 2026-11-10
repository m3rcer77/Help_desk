import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  Headphones,
  KeyRound,
  Monitor,
  Plus,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { ErrorBox, Loading } from '../components/Feedback';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../hooks/useHealth';
import { useLoad } from '../hooks/useLoad';
import { firstName } from '../lib/format';
import { api } from '../services/api';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Оборудование: Monitor,
  Интернет: Wifi,
  'Учётная запись': KeyRound,
};
const CATEGORY_TONES = ['purple', 'blue', 'orange', 'green'];

function Stat({ icon, label, value, tone, hint }: { icon: ReactNode; label: string; value: number; tone: string; hint: string }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${tone}`}>{icon}</div>
        <span className="stat-hint">{hint}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const health = useHealth();
  const { data: tickets, error, loading, reload } = useLoad(() => api.getTickets(), []);

  if (!user) return null;
  const isStaff = user.role !== 'STUDENT';
  const list = tickets ?? [];

  const open = list.filter((t) => t.status === 'NEW' || t.status === 'IN_PROGRESS').length;
  const resolved = list.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const urgent = list.filter((t) => t.priority === 'HIGH' && t.status !== 'CLOSED').length;

  const counts = new Map<string, number>();
  for (const t of list) counts.set(t.category.name, (counts.get(t.category.name) ?? 0) + 1);
  const categories = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">{today.toUpperCase()}</div>
          <h1>Здравствуйте, {firstName(user.fullName)}!</h1>
          <p className="muted">
            {isStaff ? 'Все обращения в службу поддержки в одном месте.' : 'Здесь вы можете отслеживать свои обращения в службу поддержки.'}
          </p>
        </div>
        <Link to="/tickets/create" className="btn btn-primary">
          <Plus size={18} /> Создать заявку
        </Link>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !tickets && <Loading />}

      {tickets && (
        <>
          <div className="stats-grid">
            <Stat icon={<ClipboardList />} label="Всего заявок" value={list.length} tone="blue" hint={isStaff ? 'Все обращения' : 'Ваши обращения'} />
            <Stat icon={<Clock3 />} label="В обработке" value={open} tone="orange" hint="Новые и в работе" />
            <Stat icon={<CheckCircle2 />} label="Решено" value={resolved} tone="green" hint="Решённые и закрытые" />
            <Stat icon={<CircleAlert />} label="Высокий приоритет" value={urgent} tone="red" hint="Не закрыты" />
          </div>

          <div className="dashboard-grid">
            <section className="panel tickets-panel">
              <div className="panel-heading">
                <div>
                  <h3>Последние заявки</h3>
                  <p>Обзор последних обращений</p>
                </div>
                <Link className="text-link" to="/tickets">
                  Все заявки <ArrowRight size={15} />
                </Link>
              </div>
              {list.slice(0, 4).map((t) => (
                <Link className="ticket-row" to={`/tickets/${t.id}`} key={t.id}>
                  <div className="ticket-symbol">
                    <Wrench size={18} />
                  </div>
                  <div className="ticket-main">
                    <strong>{t.title}</strong>
                    <span>
                      #{t.id} · {t.category.name}
                      {t.room ? ` · Ауд. ${t.room}` : ''}
                    </span>
                  </div>
                  <div className="ticket-badges">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <ArrowUpRight className="row-arrow" size={17} />
                </Link>
              ))}
              {list.length === 0 && <div className="empty-state">Заявок пока нет. Создайте первую заявку.</div>}
            </section>

            <section className="panel category-panel">
              <div className="panel-heading">
                <div>
                  <h3>Категории обращений</h3>
                  <p>Распределение по типу проблемы</p>
                </div>
              </div>
              {categories.map(([name, count], index) => {
                const Icon = CATEGORY_ICONS[name] ?? Wrench;
                return (
                  <div className="category-row" key={name}>
                    <div className={`category-icon ${CATEGORY_TONES[index % CATEGORY_TONES.length]}`}>
                      <Icon size={19} />
                    </div>
                    <div className="category-text">
                      <strong>{name}</strong>
                      <span>Заявок: {count}</span>
                    </div>
                    <div className="category-count">{count}</div>
                  </div>
                );
              })}
              {categories.length === 0 && <div className="empty-state">Данных по категориям пока нет.</div>}
              <div className="support-callout">
                <div className="support-callout-icon">
                  <Headphones size={20} />
                </div>
                <div>
                  <strong>Не нашли нужное?</strong>
                  <p>Опишите проблему, и мы поможем.</p>
                  <Link to="/tickets/create">
                    Создать обращение <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      <div className="info-strip">
        <div className="info-icon">
          <Clock3 size={19} />
        </div>
        <div>
          <strong>Мы на связи</strong>
          <p>Заявки регистрируются в системе и передаются ответственным сотрудникам.</p>
        </div>
        <span className="info-status">
          <span className={health === false ? 'online-dot offline' : 'online-dot'} />{' '}
          {health === null ? 'Проверка…' : health ? 'Сервис активен' : 'Сервис недоступен'}
        </span>
      </div>
    </>
  );
}
