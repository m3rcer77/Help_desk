import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Headset, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/format';

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="brand-icon">
          <Headset size={23} />
        </span>
        <span>
          Help<span className="brand-light">Desk</span>
        </span>
      </div>
      <div className="auth-card">
        <div className="auth-symbol">
          <Headset size={25} />
        </div>
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </div>
      <div className="auth-foot">© 2026 University Help Desk</div>
    </div>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="С возвращением!" subtitle="Войдите, чтобы управлять своими заявками.">
      <form className="form-stack" onSubmit={submit}>
        <label>
          Email
          <div className="input-wrap">
            <Mail size={17} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" placeholder="name@university.ru" />
          </div>
        </label>
        <label>
          Пароль
          <div className="input-wrap">
            <LockKeyhole size={17} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Введите пароль" />
          </div>
        </label>
        {error && <p className="error-text" role="alert">{error}</p>}
        <button className="btn btn-primary btn-full" disabled={busy}>
          {busy ? 'Входим…' : 'Войти в систему'}
        </button>
      </form>
      <p className="auth-switch">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await register(fullName.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="Создать аккаунт" subtitle="Зарегистрируйтесь, чтобы отправлять заявки.">
      <form className="form-stack" onSubmit={submit}>
        <label>
          Имя и фамилия
          <div className="input-wrap">
            <UserRound size={17} />
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name" placeholder="Иван Иванов" />
          </div>
        </label>
        <label>
          Университетский email
          <div className="input-wrap">
            <Mail size={17} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" placeholder="name@university.ru" />
          </div>
        </label>
        <label>
          Пароль
          <div className="input-wrap">
            <LockKeyhole size={17} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Минимум 8 символов" />
          </div>
        </label>
        <label>
          Повторите пароль
          <div className="input-wrap">
            <LockKeyhole size={17} />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" placeholder="Ещё раз пароль" />
          </div>
        </label>
        {error && <p className="error-text" role="alert">{error}</p>}
        <button className="btn btn-primary btn-full" disabled={busy}>
          {busy ? 'Создаём…' : 'Создать аккаунт'}
        </button>
      </form>
      <p className="auth-switch">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </AuthFrame>
  );
}
