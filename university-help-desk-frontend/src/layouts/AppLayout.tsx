import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ChartNoAxesColumn,
  ClipboardList,
  Headset,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  ShieldCheck,
  Tags,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../hooks/useHealth';
import { ROLE_LABELS } from '../lib/labels';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const health = useHealth();

  if (!user) return null;
  const isStaff = user.role === 'STAFF' || user.role === 'ADMIN';
  const initial = user.fullName.slice(0, 1).toUpperCase();

  const healthText = health === null ? 'Проверка связи…' : health ? 'Система работает' : 'Нет связи с сервером';
  const healthClass = health === false ? 'online-dot offline' : 'online-dot';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/dashboard" className="brand">
          <span className="brand-icon">
            <Headset size={22} />
          </span>
          <span>
            Help<span className="brand-light">Desk</span>
            <small>UNIVERSITY SUPPORT</small>
          </span>
        </NavLink>

        <div className="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav className="nav-list">
          <NavLink to="/dashboard">
            <LayoutDashboard size={18} />
            Обзор
          </NavLink>
          <NavLink to="/tickets" end>
            <ClipboardList size={18} />
            {isStaff ? 'Все заявки' : 'Мои заявки'}
          </NavLink>
          <NavLink to="/tickets/create">
            <PlusCircle size={18} />
            Создать заявку
          </NavLink>
          <NavLink to="/profile">
            <UserRound size={18} />
            Мой профиль
          </NavLink>

          {isStaff && (
            <>
              <div className="nav-label nav-label-gap">УПРАВЛЕНИЕ</div>
              <NavLink to="/staff/dashboard">
                <ShieldCheck size={18} />
                Панель сотрудника
              </NavLink>
            </>
          )}
          {user.role === 'ADMIN' && (
            <>
              <NavLink to="/admin/users">
                <Users size={18} />
                Пользователи
              </NavLink>
              <NavLink to="/admin/categories">
                <Tags size={18} />
                Категории
              </NavLink>
              <NavLink to="/admin/statistics">
                <ChartNoAxesColumn size={18} />
                Статистика
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-dot" />
            <strong>Нужна помощь?</strong>
            <p>Создайте заявку, и служба поддержки поможет вам.</p>
            <NavLink to="/tickets/create">Обратиться в поддержку →</NavLink>
          </div>
          <div className="user-mini">
            <div className="avatar">{initial}</div>
            <div className="user-mini-info">
              <strong>{user.fullName}</strong>
              <span>{ROLE_LABELS[user.role]}</span>
            </div>
            <button
              className="icon-button"
              title="Выйти"
              aria-label="Выйти"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">УНИВЕРСИТЕТСКИЙ СЕРВИС</span>
            <h2>Центр поддержки</h2>
          </div>
          <div className="topbar-right">
            <span className={healthClass} />
            {healthText}
            <div className="avatar avatar-small">{initial}</div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
        <footer className="footer">
          University Help Desk <span>•</span> Сервис поддержки университета
        </footer>
      </main>
    </div>
  );
}
