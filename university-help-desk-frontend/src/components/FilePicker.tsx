import { Paperclip, X } from 'lucide-react';

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** Возвращает текст ошибки или пустую строку, если файл подходит. */
export function validateFile(file: File): string {
  if (!ALLOWED_TYPES.includes(file.type)) return `«${file.name}»: допустимы только JPG, PNG и PDF`;
  if (file.size > MAX_FILE_BYTES) return `«${file.name}»: размер больше 5 МБ`;
  return '';
}

interface Props {
  files: File[];
  max: number;
  onChange: (files: File[]) => void;
  onError: (message: string) => void;
}

export function FilePicker({ files, max, onChange, onError }: Props) {
  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    onError('');
    for (const file of Array.from(list)) {
      const problem = validateFile(file);
      if (problem) return onError(problem);
      if (next.length >= max) return onError(`Можно прикрепить не больше ${max} файлов`);
      next.push(file);
    }
    onChange(next);
  };

  return (
    <div className="file-picker">
      <label className="btn btn-outline btn-small file-button">
        <Paperclip size={15} /> Прикрепить файл
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </label>
      <span className="muted file-hint">JPG, PNG или PDF, до 5 МБ, не больше {max} файлов</span>
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`}>
              <span>{file.name}</span>
              <button type="button" className="icon-button" aria-label={`Убрать ${file.name}`} onClick={() => onChange(files.filter((_, i) => i !== index))}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
