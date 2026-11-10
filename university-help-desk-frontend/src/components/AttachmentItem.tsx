import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { errorMessage } from '../lib/format';
import { api } from '../services/api';
import type { Attachment } from '../types';

/**
 * Файлы лежат за авторизацией, поэтому <img src> не подходит:
 * скачиваем blob с токеном и показываем через object URL.
 */
export function AttachmentItem({ attachment }: { attachment: Attachment }) {
  const isImage = /\.(png|jpe?g)$/i.test(attachment.fileUrl);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    let objectUrl = '';
    api
      .downloadAttachment(attachment.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) URL.revokeObjectURL(objectUrl);
        else setPreview(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id, isImage]);

  const download = async () => {
    setError('');
    try {
      const blob = await api.downloadAttachment(attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="attach-item">
      {isImage && preview ? (
        <img src={preview} alt={attachment.fileName} className="attach-thumb" />
      ) : (
        <div className="attach-icon">
          <FileText size={22} />
        </div>
      )}
      <div className="attach-info">
        <strong title={attachment.fileName}>{attachment.fileName}</strong>
        {error && <span className="error-text">{error}</span>}
      </div>
      <button type="button" className="icon-button" title="Скачать" aria-label={`Скачать ${attachment.fileName}`} onClick={download}>
        <Download size={16} />
      </button>
    </div>
  );
}
