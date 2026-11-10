import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { ErrorBox, Loading } from '../components/Feedback';
import { FilePicker } from '../components/FilePicker';
import { useLoad } from '../hooks/useLoad';
import { errorMessage } from '../lib/format';
import { PRIORITY_LABELS, PRIORITY_ORDER } from '../lib/labels';
import { api } from '../services/api';
import type { Priority } from '../types';

const MAX_FILES = 5;

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const categories = useLoad(() => api.getCategories(), []);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [room, setRoom] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (categoryId === '') {
      setError('Выберите категорию');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const ticket = await api.createTicket({ title: title.trim(), description: description.trim(), priority, room, categoryId });

      // Заявка уже создана — файлы грузим по одному и сообщаем о тех, что не прошли.
      const failed: string[] = [];
      for (const file of files) {
        try {
          await api.uploadAttachment(ticket.id, file);
        } catch (err) {
          failed.push(`${file.name}: ${errorMessage(err)}`);
        }
      }
      navigate(`/tickets/${ticket.id}`, {
        state: failed.length > 0 ? { warning: `Заявка создана, но не все файлы загружены. ${failed.join('; ')}` } : undefined,
      });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/tickets" className="back-link">
        <ArrowLeft size={16} /> Назад к заявкам
      </Link>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">НОВОЕ ОБРАЩЕНИЕ</div>
          <h1>Создать заявку</h1>
          <p className="muted">Опишите проблему как можно подробнее — это поможет быстрее её решить.</p>
        </div>
      </div>

      {categories.error && <ErrorBox message={categories.error} onRetry={categories.reload} />}
      {categories.loading && !categories.data && <Loading />}

      {categories.data && (
        <form className="panel ticket-form" onSubmit={submit}>
          <div className="form-section-title">
            <span>✎</span>
            <div>
              <h3>Основная информация</h3>
              <p>Расскажите, что произошло.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="field-full">
              Заголовок заявки <b>*</b>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={120} placeholder="Например, не работает проектор" />
            </label>
            <label>
              Категория <b>*</b>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')} required>
                <option value="">Выберите категорию</option>
                {categories.data.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Аудитория / место
              <input value={room} onChange={(e) => setRoom(e.target.value)} maxLength={50} placeholder="Например, 305" />
            </label>
            <label>
              Приоритет
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </label>
            <label className="field-full">
              Описание проблемы <b>*</b>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required minLength={5} maxLength={5000} rows={5} placeholder="Что именно не работает? Когда появилась проблема? Что вы уже пробовали сделать?" />
            </label>
          </div>

          <FilePicker files={files} max={MAX_FILES} onChange={setFiles} onError={setFileError} />
          {fileError && <p className="error-text">{fileError}</p>}
          {error && <p className="error-text" role="alert">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/tickets')}>
              Отмена
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Создаём…' : (<><Plus size={17} /> Создать заявку</>)}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
