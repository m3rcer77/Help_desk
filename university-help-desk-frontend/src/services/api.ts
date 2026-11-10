import type {
  AdminUser,
  Attachment,
  Category,
  Person,
  Role,
  Stats,
  TicketComment,
  TicketDetail,
  TicketFilters,
  TicketStatus,
  TicketSummary,
  User,
} from '../types';

// По умолчанию запросы идут на относительный /api: в разработке их проксирует Vite,
// в Docker — nginx. Свой адрес можно задать через VITE_API_URL.
const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'helpdesk-token';

export const UNAUTHORIZED_EVENT = 'helpdesk:unauthorized';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = tokenStore.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Нет связи с сервером. Проверьте подключение и попробуйте снова.');
  }

  if (!response.ok) {
    let message = `Ошибка сервера (${response.status})`;
    try {
      const data = await response.json();
      if (data && typeof data.error === 'string') message = data.error;
    } catch {
      /* тело ответа не JSON — оставляем сообщение по умолчанию */
    }
    // Токен истёк или отозван: выходим из системы (но не на самой форме входа).
    if (response.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(response.status, message);
  }
  return response;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await send(path, init);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

interface AuthResponse {
  token: string;
  user: User;
}

export const api = {
  // --- авторизация ---
  async login(email: string, password: string): Promise<User> {
    const data = await json<AuthResponse>('/auth/login', jsonInit('POST', { email, password }));
    tokenStore.set(data.token);
    return data.user;
  },
  async register(fullName: string, email: string, password: string): Promise<User> {
    const data = await json<AuthResponse>('/auth/register', jsonInit('POST', { fullName, email, password }));
    tokenStore.set(data.token);
    return data.user;
  },
  logout: () => tokenStore.clear(),
  me: () => json<User>('/users/me'),
  updateProfile: (fullName: string) => json<User>('/users/me', jsonInit('PATCH', { fullName })),

  // --- заявки ---
  getTickets: (filters: TicketFilters = {}) => json<TicketSummary[]>(`/tickets${query({ ...filters })}`),
  getTicket: (id: number) => json<TicketDetail>(`/tickets/${id}`),
  createTicket: (input: { title: string; description: string; priority: string; room: string; categoryId: number }) =>
    json<TicketDetail>('/tickets', jsonInit('POST', { ...input, room: input.room.trim() || undefined })),
  updateTicket: (id: number, patch: { status?: TicketStatus; assignedToId?: number | null }) =>
    json<TicketDetail>(`/tickets/${id}`, jsonInit('PATCH', patch)),
  addComment: (id: number, text: string) => json<TicketComment>(`/tickets/${id}/comments`, jsonInit('POST', { text })),

  // --- файлы ---
  uploadAttachment(ticketId: number, file: File): Promise<Attachment> {
    const form = new FormData(); // Content-Type с boundary выставит браузер
    form.append('file', file);
    return json<Attachment>(`/tickets/${ticketId}/attachments`, { method: 'POST', body: form });
  },
  async downloadAttachment(id: number): Promise<Blob> {
    return (await send(`/attachments/${id}/download`)).blob();
  },

  // --- справочники и администрирование ---
  getCategories: () => json<Category[]>('/categories'),
  createCategory: (name: string) => json<Category>('/categories', jsonInit('POST', { name })),
  renameCategory: (id: number, name: string) => json<Category>(`/categories/${id}`, jsonInit('PATCH', { name })),
  deleteCategory: (id: number) => json<void>(`/categories/${id}`, { method: 'DELETE' }),
  getStaff: () => json<(Person & { role: Role })[]>('/users/staff'),
  getUsers: () => json<AdminUser[]>('/users'),
  setUserRole: (id: number, role: Role) => json<User>(`/users/${id}/role`, jsonInit('PATCH', { role })),
  getStats: () => json<Stats>('/stats'),

  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
};
