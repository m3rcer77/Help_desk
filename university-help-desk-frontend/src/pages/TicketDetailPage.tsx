import { useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, History, MapPin, MessageCircle, Paperclip, Send } from 'lucide-react';
import { AttachmentItem } from '../components/AttachmentItem';
import { ErrorBox, Loading, Notice } from '../components/Feedback';
import { FilePicker } from '../components/FilePicker';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useLoad } from '../hooks/useLoad';
import { errorMessage, formatDate, formatDateTime } from '../lib/format';
import { ROLE_LABELS, transitionLabel } from '../lib/labels';
import { api } from '../services/api';
import type { TicketStatus } from '../types';

export default function TicketDetailPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  const { user } = useAuth();
  const location = useLocation();
  const warning = (location.state as { warning?: string } | null)?.warning;
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';

  const { data: ticket, error, loading, reload } = useLoad(() => api.getTicket(ticketId), [ticketId]);
  const staff = useLoad(() => (isStaff ? api.getStaff() : Promise.resolve([])), [isStaff]);

  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    return <div className="empty-state">Некорректный номер заявки. <Link to="/tickets">Вернуться к списку</Link></div>;
  }
  if (!ticket) {
    return loading ? <Loading /> : (
      <>
        <Link to="/tickets" className="back-link"><ArrowLeft size={16} /> Назад к заявкам</Link>
        <ErrorBox message={error || 'Заявка не найдена'} onRetry={reload} />
      </>
    );
  }

  // Любое действие: выполнить, показать ошибку сервера, обновить заявку.
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError('');
    try {
      await action();
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (status: TicketStatus) => run(() => api.updateTicket(ticket.id, { status }));
  const assign = (value: string) => run(() => api.updateTicket(ticket.id, { assignedToId: value ? Number(value) : null }));

  const sendComment = async (e: FormEvent) => {
    e.preventDefault();
    const text = comment.trim();
    if (!text) return;
    await run(async () => {
      await api.addComment(ticket.id, text);
      setComment('');
    });
  };

  const uploadFiles = () =>
    run(async () => {
      for (const file of newFiles) await api.uploadAttachment(ticket.id, file);
      setNewFiles([]);
    });

  const maxNewFiles = Math.max(0, 5 - ticket.attachments.length);

  return (
    <>
      <Link to="/tickets" className="back-link"><ArrowLeft size={16} /> Назад к заявкам</Link>
      {warning && <Notice tone="warning">{warning}</Notice>}

      <div className="detail-header">
        <div>
          <div className="eyebrow">ЗАЯВКА #{ticket.id}</div>
          <h1>{ticket.title}</h1>
          <p className="muted">Создана {formatDateTime(ticket.createdAt)} · Автор: {ticket.creator.fullName}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="detail-grid">
        <div className="panel detail-main">
          <div className="panel-heading">
            <div>
              <h3>Описание проблемы</h3>
              <p>Подробности обращения</p>
            </div>
            <PriorityBadge priority={ticket.priority} />
          </div>
          <p className="description-text">{ticket.description}</p>

          <div className="detail-meta">
            <div>
              <MapPin size={17} />
              <span><small>Место</small><strong>{ticket.room ? `Аудитория ${ticket.room}` : 'Не указано'}</strong></span>
            </div>
            <div>
              <CalendarDays size={17} />
              <span><small>Дата создания</small><strong>{formatDate(ticket.createdAt)}</strong></span>
            </div>
          </div>

          <div className="detail-section">
            <h3><Paperclip size={18} /> Файлы <span className="comment-count">{ticket.attachments.length}</span></h3>
            {ticket.attachments.length === 0 && <p className="muted">Файлов нет.</p>}
            {ticket.attachments.map((a) => <AttachmentItem key={a.id} attachment={a} />)}
            {ticket.canAttach && maxNewFiles > 0 && (
              <div className="attach-add">
                <FilePicker files={newFiles} max={maxNewFiles} onChange={setNewFiles} onError={setFileError} />
                {fileError && <p className="error-text">{fileError}</p>}
                {newFiles.length > 0 && (
                  <button type="button" className="btn btn-primary btn-small" disabled={busy} onClick={uploadFiles}>Загрузить</button>
                )}
              </div>
            )}
          </div>

          <div className="detail-section">
            <h3><MessageCircle size={18} /> Комментарии <span className="comment-count">{ticket.comments.length}</span></h3>
            {ticket.comments.length === 0 && <p className="muted">Комментариев пока нет.</p>}
            {ticket.comments.map((c) => (
              <div className="comment-item" key={c.id}>
                <div className="avatar">{c.author.fullName.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>{c.author.fullName}</strong>
                  <span>{ROLE_LABELS[c.author.role]} · {formatDateTime(c.createdAt)}</span>
                  <p>{c.text}</p>
                </div>
              </div>
            ))}
            {ticket.canComment ? (
              <form className="comment-form" onSubmit={sendComment}>
                <textarea rows={2} value={comment} maxLength={2000} onChange={(e) => setComment(e.target.value)} placeholder="Напишите комментарий…" aria-label="Комментарий" />
                <button className="btn btn-primary" disabled={busy || !comment.trim()}><Send size={15} /> Отправить</button>
              </form>
            ) : (
              <p className="muted">Заявка закрыта — новые комментарии недоступны.</p>
            )}
          </div>

          <div className="detail-section">
            <h3><History size={18} /> История изменений</h3>
            <ul className="timeline">
              {ticket.history.map((h) => (
                <li key={h.id}>
                  <strong>{h.action}</strong>
                  <span>{h.user ? `${h.user.fullName} · ` : ''}{formatDateTime(h.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="panel detail-side">
          <h3>Информация</h3>
          <div className="side-field"><span>Статус</span><StatusBadge status={ticket.status} /></div>
          <div className="side-field"><span>Приоритет</span><PriorityBadge priority={ticket.priority} /></div>
          <div className="side-field"><span>Категория</span><strong>{ticket.category.name}</strong></div>
          <div className="side-field"><span>Аудитория</span><strong>{ticket.room || '—'}</strong></div>
          <div className="side-field">
            <span>Исполнитель</span>
            {ticket.canAssign ? (
              <select className="select-inline" value={ticket.assignedTo?.id ?? ''} disabled={busy || staff.loading} onChange={(e) => assign(e.target.value)} aria-label="Исполнитель">
                <option value="">Не назначен</option>
                {(staff.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
              </select>
            ) : (
              <strong>{ticket.assignedTo?.fullName ?? 'Не назначен'}</strong>
            )}
          </div>

          <div className="side-divider" />
          <h4>Действия</h4>
          {ticket.allowedTransitions.map((to, index) => (
            <button
              key={to}
              className={`btn btn-full ${index === 0 ? 'btn-primary' : 'btn-outline'}`}
              disabled={busy}
              onClick={() => changeStatus(to)}
            >
              {transitionLabel(ticket.status, to)}
            </button>
          ))}
          {ticket.allowedTransitions.length === 0 && (
            <p className="resolved-note">
              {ticket.status === 'CLOSED' ? 'Заявка закрыта.' : 'Сейчас от вас действий не требуется.'}
            </p>
          )}
          {actionError && <p className="error-text" role="alert">{actionError}</p>}
        </aside>
      </div>
    </>
  );
}
