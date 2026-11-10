import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Страница не найдена</h1>
        <p className="auth-subtitle">Такого адреса нет. Проверьте ссылку или вернитесь на главную.</p>
        <Link to="/dashboard" className="btn btn-primary btn-full">На главную</Link>
      </div>
    </div>
  );
}
