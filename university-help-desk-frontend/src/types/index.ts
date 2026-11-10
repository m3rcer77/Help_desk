export type Role = 'STUDENT' | 'STAFF' | 'ADMIN';
export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}

export interface Category {
  id: number;
  name: string;
  ticketsCount?: number;
}

export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export interface TicketComment {
  id: number;
  text: string;
  createdAt: string;
  author: { fullName: string; role: Role };
}

export interface HistoryEntry {
  id: number;
  action: string;
  createdAt: string;
  user: { fullName: string } | null;
}

export interface Person {
  id: number;
  fullName: string;
}

/** Элемент списка заявок (GET /tickets). */
export interface TicketSummary {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  room: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
  creator: Person;
  assignedTo: Person | null;
  _count?: { comments: number; attachments: number };
}

/** Полная заявка (GET /tickets/:id). */
export interface TicketDetail extends TicketSummary {
  creator: Person & { email: string };
  comments: TicketComment[];
  history: HistoryEntry[];
  attachments: Attachment[];
  allowedTransitions: TicketStatus[];
  canAssign: boolean;
  canComment: boolean;
  canAttach: boolean;
}

export interface TicketFilters {
  q?: string;
  status?: TicketStatus | '';
  priority?: Priority | '';
  categoryId?: number | '';
  room?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedToId?: number | 'me' | 'none' | '';
  mine?: boolean;
}

export interface AdminUser extends User {
  createdAt: string;
  ticketsCreated: number;
  ticketsAssigned: number;
}

export interface Stats {
  total: number;
  open: number;
  unassigned: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<Priority, number>;
  byCategory: { id: number; name: string; count: number }[];
}
