import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Notice } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/format';
import { ROLE_LABELS } from '../lib/labels';
import { api } from '../services/api';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.fullName ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      setUser(await api.updateProfile(name.trim()));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">ЛИЧНЫЙ КАБИНЕТ</div>
          <h1>Мой профиль</h1>
          <p className="muted">Информация о вашем аккаунте.</p>
        </div>
      </div>

      <section className="panel profile-panel">
        <div className="profile-cover" />
        <div className="profile-content">
          <div className="profile-avatar">{user.fullName.slice(0, 1).toUpperCase()}</div>
          <h2>{user.fullName}</h2>
          <p className="muted">{ROLE_LABELS[user.role]}</p>

          <div className="profile-fields">
            <div><Mail size={18} /><span><small>Email</small><strong>{user.email}</strong></span></div>
            <div><ShieldCheck size={18} /><span><small>Роль в системе</small><strong>{ROLE_LABELS[user.role]}</strong></span></div>
            <div><UserRound size={18} /><span><small>ID пользователя</small><strong>{user.id}</strong></span></div>
          </div>

          <form className="inline-form" onSubmit={save}>
            <label>
              Имя и фамилия
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} />
            </label>
            <button className="btn btn-primary" disabled={busy || name.trim() === user.fullName}>
              {busy ? 'Сохраняем…' : 'Сохранить имя'}
            </button>
          </form>
          {error && <p className="error-text" role="alert">{error}</p>}
          {saved && <Notice tone="success">Имя сохранено.</Notice>}

          <Link to="/tickets" className="btn btn-outline">Перейти к заявкам</Link>
        </div>
      </section>
    </>
  );
}
